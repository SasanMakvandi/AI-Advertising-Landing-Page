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
import { ScriptWithImagesSchema } from "@/lib/generation-schemas";

// Stitching re-encodes ~20-30s of combined footage — comfortably within a
// couple minutes, but longer than the default serverless timeout.
export const maxDuration = 300;

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
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

  const script = scriptInput.data;
  const ordered = [...script.scenes].sort((a, b) => a.order - b.order);
  const missing = ordered.filter((s) => !s.videoUrl);
  if (ordered.length === 0 || missing.length > 0) {
    return new Response(
      JSON.stringify({ error: "Every scene needs a generated video before they can be stitched together." }),
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
      const scene = ordered[i];
      const res = await fetch(scene.videoUrl as string);
      if (!res.ok) throw new Error(`Couldn't download scene ${scene.order}'s video (${res.status})`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const clipPath = path.join(workDir, `clip-${i}.mp4`);
      await writeFile(clipPath, buffer);
      clipPaths.push(clipPath);
    }

    const concatListPath = path.join(workDir, "concat.txt");
    const concatList = clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
    await writeFile(concatListPath, concatList);

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

    const outputBuffer = await readFile(outputPath);
    const blob = await put(`final-videos/${randomUUID()}.mp4`, outputBuffer, {
      access: "public",
      contentType: "video/mp4",
    });

    const updatedScript = { ...script, finalVideoUrl: blob.url };
    await prisma.project.update({
      where: { id: projectId },
      data: { scriptJson: JSON.stringify(updatedScript), status: "stitched" },
    });

    return new Response(JSON.stringify({ script: updatedScript }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("video stitching failed:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Couldn't stitch the scenes together — please try again.",
      }),
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
