import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import path from "path";
import { mkdir, writeFile, readFile, rm } from "fs/promises";
import ffmpegPath from "ffmpeg-static";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAiEnabled, aiDisabledResponse } from "@/lib/features";
import { setProjectStatus } from "@/lib/project-status";
import {
  deleteBlobs,
  deleteUploadedReferences,
  isOurBlobUrl,
  parseStoredScript,
} from "@/lib/blob-assets";

// Stitching re-encodes ~20-30s of combined footage: comfortably within a
// couple of minutes, but longer than the default serverless timeout.
export const maxDuration = 300;

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  if (!isAiEnabled()) return aiDisabledResponse();

  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  if (!projectId) {
    return new Response(JSON.stringify({ error: "Missing project" }), { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  // Always stitch what is stored for this project, never URLs from the request.
  const script = parseStoredScript(project.scriptJson);
  const ordered = [...(script?.scenes ?? [])].sort((a, b) => a.order - b.order);
  if (!script || ordered.length === 0 || ordered.some((s) => !isOurBlobUrl(s.videoUrl))) {
    return new Response(
      JSON.stringify({ error: "Every scene needs a finished clip before they can be stitched together." }),
      { status: 400 }
    );
  }
  if (!ffmpegPath) {
    return new Response(JSON.stringify({ error: "ffmpeg is not available on this server" }), {
      status: 500,
    });
  }

  const workDir = path.join(os.tmpdir(), `stitch-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    const clipPaths: string[] = [];
    for (let i = 0; i < ordered.length; i++) {
      const res = await fetch(ordered[i].videoUrl as string);
      if (!res.ok) {
        throw new Error(`Couldn't download scene ${ordered[i].order}'s clip (${res.status})`);
      }
      const clipPath = path.join(workDir, `clip-${i}.mp4`);
      await writeFile(clipPath, Buffer.from(await res.arrayBuffer()));
      clipPaths.push(clipPath);
    }

    const concatListPath = path.join(workDir, "concat.txt");
    await writeFile(
      concatListPath,
      clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n")
    );

    const outputPath = path.join(workDir, "output.mp4");
    // Re-encoding (rather than -c copy) avoids failures from any minor
    // codec/parameter mismatch between clips generated in separate jobs.
    await execFileAsync(ffmpegPath, [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", concatListPath,
      "-c:v", "libx264",
      "-c:a", "aac",
      "-movflags", "+faststart",
      outputPath,
    ]);

    const blob = await put(`final-videos/${randomUUID()}.mp4`, await readFile(outputPath), {
      access: "public",
      contentType: "video/mp4",
    });

    // The final video contains every clip, so the clips (and any earlier
    // final video) are just extra storage now.
    const clipUrls = ordered.map((s) => s.videoUrl);
    const updated = {
      ...script,
      finalVideoUrl: blob.url,
      scenes: script.scenes.map((s) => ({ ...s, videoUrl: null, videoStatus: "completed" as const })),
    };
    await setProjectStatus(projectId, "stitched", { scriptJson: JSON.stringify(updated) });
    await deleteBlobs([...clipUrls, script.finalVideoUrl]);
    // The finished video is the point where uploaded photos stop being needed.
    const uploadsCleared = await deleteUploadedReferences(projectId).catch((err) => {
      console.error("couldn't clean up uploaded references:", err);
      return false;
    });

    return new Response(JSON.stringify({ script: updated, uploadsCleared }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("video stitching failed:", err);
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error ? err.message : "Couldn't stitch the scenes together. Please try again.",
      }),
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
