import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createVideoJob } from "@/lib/apiframe";
import { isAiEnabled, aiDisabledResponse } from "@/lib/features";
import { setProjectStatus } from "@/lib/project-status";
import {
  deleteBlobs,
  parseStoredScript,
  sanitizeScriptAssets,
  videoUrlsOf,
} from "@/lib/blob-assets";
import {
  ScriptWithImagesSchema,
  type Brief,
  type SceneWithImage,
} from "@/lib/generation-schemas";

const RESOLUTIONS = ["480p", "720p", "1080p"] as const;
type Resolution = (typeof RESOLUTIONS)[number];

function buildScenePrompt(scene: SceneWithImage, brief: Brief | null, negativePrompt: string | null) {
  const productContext = brief
    ? ` Product: ${brief.productName}. ${brief.productDescription}. Tone: ${brief.tone}.`
    : "";
  const avoid = negativePrompt ? ` Avoid: ${negativePrompt}.` : "";
  return `${scene.shotType} shot. ${scene.description}.${productContext}${avoid}`;
}

export async function POST(request: Request) {
  if (!isAiEnabled()) return aiDisabledResponse();

  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  const requested = body?.resolution as string | undefined;
  const resolution: Resolution = RESOLUTIONS.includes(requested as Resolution)
    ? (requested as Resolution)
    : "480p";
  // Retry mode: only scenes that don't have a clip yet get a new (billed) job.
  const onlyMissing = body?.onlyMissing === true;
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

  // The previous final video (if any) will no longer match, and a full rerun
  // replaces the old clips too. Free that storage.
  await deleteBlobs(onlyMissing ? [stored?.finalVideoUrl] : videoUrlsOf(stored));

  let firstError: string | null = null;
  let started = 0;
  const scenes: SceneWithImage[] = [];
  for (const scene of script.scenes) {
    const base: SceneWithImage = onlyMissing
      ? { ...scene }
      : { ...scene, videoUrl: null, videoJobId: null, videoStatus: null };

    if (base.videoUrl) {
      scenes.push(base);
      continue;
    }

    // One scene failing shouldn't discard jobs already started (and billed)
    // for the others, so each is tracked independently.
    try {
      const { jobId } = await createVideoJob({
        prompt: buildScenePrompt(base, brief, project.negativePrompt),
        startImageUrl: base.imageUrl,
        duration: base.duration,
        resolution,
        aspectRatio: project.aspectRatio,
      });
      started++;
      scenes.push({
        ...base,
        videoJobId: jobId,
        videoStatus: "queued",
        videoUrl: null,
        videoError: null,
      });
    } catch (err) {
      console.error(`video job creation failed for scene ${scene.order}:`, err);
      const message = err instanceof Error ? err.message : "Couldn't start video generation";
      firstError ??= message;
      scenes.push({
        ...base,
        videoJobId: null,
        videoStatus: "failed",
        videoUrl: null,
        videoError: message,
      });
    }
  }

  const updated = {
    ...script,
    finalVideoUrl: null,
    videoStartedAt: started > 0 ? Date.now() : null,
    scenes,
  };
  await setProjectStatus(projectId, started > 0 ? "videos_generating" : project.status, {
    scriptJson: JSON.stringify(updated),
  });

  if (firstError) {
    return new Response(JSON.stringify({ error: firstError, script: updated }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ script: updated }), {
    headers: { "Content-Type": "application/json" },
  });
}
