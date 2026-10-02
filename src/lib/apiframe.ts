const APIFRAME_BASE = "https://api.apiframe.ai/v2";

type CreateVideoJobInput = {
  prompt: string;
  startImageUrl?: string | null;
  duration?: number;
  resolution?: "480p" | "720p" | "1080p" | "4k";
  aspectRatio?: string;
};

type VideoJobStatus = {
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  videoUrl?: string | null;
};

// Our stored "9:16"/"1:1"/"16:9"/"4:5" values mapped to Seedance's
// supported aspect ratios (it has no 4:5, so that maps to the closest
// portrait ratio, 3:4).
const ASPECT_RATIO_MAP: Record<string, string> = {
  "9:16": "9:16",
  "1:1": "1:1",
  "16:9": "16:9",
  "4:5": "3:4",
};

function getApiKey(): string {
  const apiKey = process.env.APIFRAME_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("APIFRAME_API_KEY is not configured");
  }
  if (/[^\x00-\xFF]/.test(apiKey)) {
    throw new Error(
      "APIFRAME_API_KEY contains a character that isn't valid in an HTTP header — it was likely corrupted when pasted into Vercel's environment variables. Re-copy and re-paste the key value."
    );
  }
  return apiKey;
}

// Creates a Seedance video generation job. Returns immediately with a job
// id — the caller polls getVideoJobStatus() separately, since generation
// takes 1-3 minutes and a single serverless request shouldn't block that long.
export async function createVideoJob({
  prompt,
  startImageUrl,
  duration = 5,
  resolution = "480p",
  aspectRatio = "16:9",
}: CreateVideoJobInput): Promise<{ jobId: string }> {
  const apiKey = getApiKey();

  const res = await fetch(`${APIFRAME_BASE}/videos/generate`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      model: "seedance-2",
      seedanceParams: {
        duration: Math.min(15, Math.max(4, Math.round(duration))),
        resolution,
        aspect_ratio: ASPECT_RATIO_MAP[aspectRatio] ?? "16:9",
        ...(startImageUrl ? { start_image: startImageUrl } : {}),
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ApiFrame video job creation failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  if (!json?.jobId) {
    throw new Error("ApiFrame response did not include a job id");
  }
  return { jobId: json.jobId };
}

export async function getVideoJobStatus(jobId: string): Promise<VideoJobStatus> {
  const apiKey = getApiKey();

  const res = await fetch(`${APIFRAME_BASE}/jobs/${jobId}`, {
    headers: { "X-API-Key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ApiFrame job status check failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  return {
    status: json.status,
    videoUrl: json.result?.videoUrl ?? null,
  };
}
