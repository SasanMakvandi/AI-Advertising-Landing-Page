import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSceneImage } from "@/lib/cometapi";
import { isAiEnabled, aiDisabledResponse } from "@/lib/features";
import { deleteBlobs, parseStoredScript, sanitizeScriptAssets } from "@/lib/blob-assets";
import { buildSceneImagePrompt } from "@/lib/image-prompt";
import {
  FREE_IMAGE_REGENS,
  ScriptWithImagesSchema,
  type Brief,
} from "@/lib/generation-schemas";

// One image-edit call can take a while.
export const maxDuration = 300;

// Regenerates a single scene's image from its (possibly edited) description.
// Each scene gets FREE_IMAGE_REGENS free regenerations; after that it will
// cost tokens, which don't exist yet, so further requests are refused. The
// count is read from the stored script, never from the request.
export async function POST(request: Request) {
  if (!isAiEnabled()) return aiDisabledResponse();

  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  const index = Number(body?.sceneIndex);
  const scriptInput = ScriptWithImagesSchema.safeParse(body?.script);

  if (!projectId || !scriptInput.success || !Number.isInteger(index)) {
    return new Response(JSON.stringify({ error: "Missing or invalid project, script or scene" }), {
      status: 400,
    });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }
  if (project.status === "finalized") {
    return new Response(JSON.stringify({ error: "This project is finalized." }), { status: 403 });
  }

  const stored = parseStoredScript(project.scriptJson);
  const script = sanitizeScriptAssets(scriptInput.data, stored);
  const scene = script.scenes[index];
  if (!scene) {
    return new Response(JSON.stringify({ error: "Scene not found" }), { status: 400 });
  }
  if (!scene.imageUrl) {
    return new Response(
      JSON.stringify({ error: "Generate the scene images first, then regenerate single ones." }),
      { status: 400 }
    );
  }
  const used = scene.imageRegens ?? 0;
  if (used >= FREE_IMAGE_REGENS) {
    return new Response(
      JSON.stringify({
        error: "This scene's free regeneration is used. More will cost tokens once they launch.",
      }),
      { status: 403 }
    );
  }
  if (!scene.description.trim()) {
    return new Response(JSON.stringify({ error: "Describe the scene first." }), { status: 400 });
  }

  const brief: Brief | null = project.briefJson ? JSON.parse(project.briefJson) : null;
  const assetUrls: string[] = project.assetUrls ? JSON.parse(project.assetUrls) : [];
  const toneUrls: string[] = project.toneReferenceUrls ? JSON.parse(project.toneReferenceUrls) : [];

  try {
    const imageBuffer = await generateSceneImage({
      prompt: buildSceneImagePrompt(
        scene,
        index,
        script.scenes.length,
        brief,
        project.aspectRatio,
        project.negativePrompt
      ),
      referenceImageUrl: assetUrls[0] || toneUrls[0] || null,
      quality: "medium",
    });
    const blob = await put(`scene-images/${randomUUID()}.png`, imageBuffer, {
      access: "public",
      contentType: "image/png",
    });

    const oldUrl = scene.imageUrl;
    const scenes = script.scenes.map((s, i) =>
      i === index ? { ...s, imageUrl: blob.url, imageRegens: used + 1 } : s
    );
    const updated = { ...script, scenes };
    await prisma.project.update({
      where: { id: projectId },
      data: { scriptJson: JSON.stringify(updated) },
    });
    // Free the replaced image only once the new one is saved.
    await deleteBlobs([oldUrl]);

    return new Response(JSON.stringify({ script: updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("single scene image regeneration failed:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Couldn't regenerate this image. Please try again.",
      }),
      { status: 500 }
    );
  }
}
