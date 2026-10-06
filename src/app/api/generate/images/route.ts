import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSceneImage } from "@/lib/cometapi";
import { isAiEnabled, aiDisabledResponse } from "@/lib/features";
import { setProjectStatus } from "@/lib/project-status";
import { deleteBlobs, parseStoredScript, sanitizeScriptAssets } from "@/lib/blob-assets";
import { buildSceneImagePrompt } from "@/lib/image-prompt";
import {
  ScriptWithImagesSchema,
  type Brief,
  type SceneWithImage,
} from "@/lib/generation-schemas";

export async function POST(request: Request) {
  if (!isAiEnabled()) return aiDisabledResponse();

  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  const scriptInput = ScriptWithImagesSchema.safeParse(body?.script);

  if (!projectId || !scriptInput.success) {
    return new Response(JSON.stringify({ error: "Missing or invalid project or script" }), {
      status: 400,
    });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  const stored = parseStoredScript(project.scriptJson);
  const script = sanitizeScriptAssets(scriptInput.data, stored);
  const brief: Brief | null = project.briefJson ? JSON.parse(project.briefJson) : null;

  const assetUrls: string[] = project.assetUrls ? JSON.parse(project.assetUrls) : [];
  const toneUrls: string[] = project.toneReferenceUrls ? JSON.parse(project.toneReferenceUrls) : [];
  const referenceImageUrl = assetUrls[0] || toneUrls[0] || null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: object) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }

      const scenes: SceneWithImage[] = script.scenes.map((s) => ({ ...s }));
      let done = 0;

      // Saves whatever has been generated so far (finished images are paid
      // for), then frees any stored image that no scene points at anymore.
      async function persist(status: string) {
        const out = { ...script, scenes };
        await setProjectStatus(projectId as string, status, {
          scriptJson: JSON.stringify(out),
        });
        const kept = new Set(scenes.map((s) => s.imageUrl).filter(Boolean));
        await deleteBlobs(
          (stored?.scenes ?? []).map((s) => s.imageUrl).filter((u) => u && !kept.has(u))
        );
        return out;
      }

      try {
        for (let i = 0; i < scenes.length; i++) {
          const imageBuffer = await generateSceneImage({
            prompt: buildSceneImagePrompt(
              scenes[i],
              i,
              scenes.length,
              brief,
              project.aspectRatio,
              project.negativePrompt
            ),
            referenceImageUrl,
            quality: "medium",
          });
          const blob = await put(`scene-images/${randomUUID()}.png`, imageBuffer, {
            access: "public",
            contentType: "image/png",
          });
          scenes[i] = { ...scenes[i], imageUrl: blob.url, imageRegens: 0 };
          done++;
          send({
            type: "progress",
            sceneOrder: scenes[i].order,
            imageUrl: blob.url,
            done,
            total: scenes.length,
          });
        }

        const out = await persist("images_ready");
        send({ type: "result", script: out });
      } catch (err) {
        console.error("scene image generation failed:", err);
        await persist(done > 0 ? "images_ready" : project.status).catch((e) =>
          console.error("couldn't save partial images:", e)
        );
        send({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Couldn't generate reference images. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
