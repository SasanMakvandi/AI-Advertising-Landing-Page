import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSceneImage } from "@/lib/cometapi";
import { ScriptSchema, type Brief, type Scene } from "@/lib/generation-schemas";

function buildScenePrompt(scene: Scene, brief: Brief | null, aspectRatio: string) {
  const productContext = brief
    ? ` Product: ${brief.productName} — ${brief.productDescription}. Tone: ${brief.tone}.`
    : "";
  return `${scene.shotType} shot, ${aspectRatio} aspect ratio ad photography. ${scene.description}.${productContext}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  const scriptInput = ScriptSchema.safeParse(body?.script);

  if (!projectId || !scriptInput.success) {
    return new Response(JSON.stringify({ error: "Missing or invalid project or script" }), {
      status: 400,
    });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  const script = scriptInput.data;
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

      try {
        const scenesWithImages: (Scene & { imageUrl: string | null })[] = [];
        for (const scene of script.scenes) {
          const prompt = buildScenePrompt(scene, brief, project.aspectRatio);
          const imageBuffer = await generateSceneImage({
            prompt,
            referenceImageUrl,
            quality: "medium",
          });
          const blob = await put(`scene-images/${randomUUID()}.png`, imageBuffer, {
            access: "public",
            contentType: "image/png",
          });
          scenesWithImages.push({ ...scene, imageUrl: blob.url });
          send({
            type: "progress",
            sceneOrder: scene.order,
            imageUrl: blob.url,
            done: scenesWithImages.length,
            total: script.scenes.length,
          });
        }

        const scriptWithImages = { ...script, scenes: scenesWithImages };

        await prisma.project.update({
          where: { id: projectId },
          data: { scriptJson: JSON.stringify(scriptWithImages), status: "images_ready" },
        });

        send({ type: "result", script: scriptWithImages });
      } catch (err) {
        console.error("scene image generation failed:", err);
        send({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Couldn't generate reference images — please try again.",
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
