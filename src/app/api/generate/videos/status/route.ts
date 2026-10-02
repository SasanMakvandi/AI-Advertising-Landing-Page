import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVideoJobStatus } from "@/lib/apiframe";
import { ScriptWithImagesSchema } from "@/lib/generation-schemas";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) {
    return new Response(JSON.stringify({ error: "Missing project" }), { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  const scriptInput = ScriptWithImagesSchema.safeParse(
    project.scriptJson ? JSON.parse(project.scriptJson) : null
  );
  if (!scriptInput.success) {
    return new Response(JSON.stringify({ error: "No script found for this project" }), {
      status: 400,
    });
  }

  const script = scriptInput.data;
  let changed = false;

  const scenes = await Promise.all(
    script.scenes.map(async (scene) => {
      if (!scene.videoJobId) return scene;

      try {
        const jobStatus = await getVideoJobStatus(scene.videoJobId);

        if (jobStatus.status === "COMPLETED" && jobStatus.videoUrl) {
          const videoRes = await fetch(jobStatus.videoUrl);
          if (!videoRes.ok) throw new Error(`Couldn't download finished video (${videoRes.status})`);
          const buffer = Buffer.from(await videoRes.arrayBuffer());
          const blob = await put(`scene-videos/${randomUUID()}.mp4`, buffer, {
            access: "public",
            contentType: "video/mp4",
          });
          changed = true;
          return { ...scene, videoUrl: blob.url, videoJobId: null, videoStatus: "completed" as const };
        }

        if (jobStatus.status === "FAILED") {
          changed = true;
          return { ...scene, videoJobId: null, videoStatus: "failed" as const };
        }

        const status = jobStatus.status === "IN_PROGRESS" ? "in_progress" : "queued";
        if (scene.videoStatus !== status) changed = true;
        return { ...scene, videoStatus: status as "queued" | "in_progress" };
      } catch (err) {
        console.error(`video status check failed for scene ${scene.order}:`, err);
        changed = true;
        return { ...scene, videoJobId: null, videoStatus: "failed" as const };
      }
    })
  );

  const updatedScript = { ...script, scenes };

  if (changed) {
    const stillPending = scenes.some((s) => s.videoJobId);
    await prisma.project.update({
      where: { id: projectId },
      data: {
        scriptJson: JSON.stringify(updatedScript),
        ...(stillPending ? {} : { status: "videos_ready" }),
      },
    });
  }

  return new Response(JSON.stringify({ script: updatedScript }), {
    headers: { "Content-Type": "application/json" },
  });
}
