import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createVideoJob } from "@/lib/apiframe";
import { ScriptWithImagesSchema, type Brief, type SceneWithImage } from "@/lib/generation-schemas";

function buildScenePrompt(scene: SceneWithImage, brief: Brief | null) {
  const productContext = brief
    ? ` Product: ${brief.productName} — ${brief.productDescription}. Tone: ${brief.tone}.`
    : "";
  return `${scene.shotType} shot. ${scene.description}.${productContext}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  const resolution = (body?.resolution as string | undefined) ?? "480p";
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
  const brief: Brief | null = project.briefJson ? JSON.parse(project.briefJson) : null;

  // Each scene's job is created independently — if one fails partway through
  // the batch, the jobs already started for other scenes are real, billed
  // work on ApiFrame's side, so we still persist and track them rather than
  // discarding everything on the first error.
  let firstError: string | null = null;
  const scenesWithJobs: SceneWithImage[] = [];
  for (const scene of script.scenes) {
    try {
      const { jobId } = await createVideoJob({
        prompt: buildScenePrompt(scene, brief),
        startImageUrl: scene.imageUrl,
        duration: scene.duration,
        resolution: resolution as "480p" | "720p" | "1080p" | "4k",
        aspectRatio: project.aspectRatio,
      });
      scenesWithJobs.push({ ...scene, videoJobId: jobId, videoStatus: "queued", videoUrl: null });
    } catch (err) {
      console.error(`video job creation failed for scene ${scene.order}:`, err);
      firstError ??= err instanceof Error ? err.message : "Couldn't start video generation";
      scenesWithJobs.push({ ...scene, videoJobId: null, videoStatus: "failed", videoUrl: null });
    }
  }

  const scriptWithJobs = { ...script, scenes: scenesWithJobs };

  await prisma.project.update({
    where: { id: projectId },
    data: { scriptJson: JSON.stringify(scriptWithJobs), status: "videos_generating" },
  });

  if (firstError) {
    return new Response(JSON.stringify({ error: firstError, script: scriptWithJobs }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ script: scriptWithJobs }), {
    headers: { "Content-Type": "application/json" },
  });
}
