import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVideoJobStatus } from "@/lib/apiframe";
import { isAiEnabled, aiDisabledResponse } from "@/lib/features";
import { setProjectStatus } from "@/lib/project-status";
import { ScriptWithImagesSchema } from "@/lib/generation-schemas";

export async function GET(request: Request) {
  if (!isAiEnabled()) return aiDisabledResponse();

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
          // The scene's reference image is kept: generated images are stored
          // with the project. Only uploaded photos are cleaned up, once the
          // finished video exists.
          return {
            ...scene,
            videoUrl: blob.url,
            videoJobId: null,
            videoStatus: "completed" as const,
          };
        }

        if (jobStatus.status === "FAILED") {
          changed = true;
          return {
            ...scene,
            videoJobId: null,
            videoStatus: "failed" as const,
            videoError: jobStatus.error ?? "ApiFrame reported this scene as failed.",
          };
        }

        const status = jobStatus.status === "IN_PROGRESS" ? "in_progress" : "queued";
        if (scene.videoStatus !== status) changed = true;
        return { ...scene, videoStatus: status as "queued" | "in_progress" };
      } catch (err) {
        // Our own hiccup (network, download, Blob upload), not ApiFrame
        // reporting a failure. The job may still be running or finished and
        // billed, so keep its id and try again on the next poll. Dropping it
        // here would make "retry" pay for a second job on the same scene.
        console.error(`video status check failed for scene ${scene.order}:`, err);
        if (err instanceof Error && err.message.includes("(404)")) {
          // ApiFrame doesn't know this job, so there is nothing left to wait for.
          changed = true;
          return { ...scene, videoJobId: null, videoStatus: "failed" as const };
        }
        return scene;
      }
    })
  );

  const updatedScript = { ...script, scenes };

  if (changed) {
    const stillPending = scenes.some((s) => s.videoJobId);
    if (stillPending) {
      await prisma.project.update({
        where: { id: projectId },
        data: { scriptJson: JSON.stringify(updatedScript) },
      });
    } else {
      await setProjectStatus(projectId, "videos_ready", {
        scriptJson: JSON.stringify(updatedScript),
      });
    }
  }

  return new Response(JSON.stringify({ script: updatedScript }), {
    headers: { "Content-Type": "application/json" },
  });
}
