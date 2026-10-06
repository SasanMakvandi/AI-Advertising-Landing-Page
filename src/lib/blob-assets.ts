import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  ScriptWithImagesSchema,
  type ScriptWithImages,
} from "@/lib/generation-schemas";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export function isOurBlobUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

export function parseStoredScript(json: string | null | undefined): ScriptWithImages | null {
  if (!json) return null;
  try {
    const parsed = ScriptWithImagesSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function assetUrlsOf(script: ScriptWithImages | null | undefined): string[] {
  if (!script) return [];
  const urls: string[] = [];
  for (const s of script.scenes) {
    if (s.imageUrl) urls.push(s.imageUrl);
    if (s.videoUrl) urls.push(s.videoUrl);
  }
  if (script.finalVideoUrl) urls.push(script.finalVideoUrl);
  return urls;
}

export function videoUrlsOf(script: ScriptWithImages | null | undefined): string[] {
  if (!script) return [];
  const urls = script.scenes.map((s) => s.videoUrl).filter((u): u is string => !!u);
  if (script.finalVideoUrl) urls.push(script.finalVideoUrl);
  return urls;
}

// Best-effort delete. Only ever touches URLs in our own Blob store; callers
// must pass URLs read from the database, never ones sent by the browser.
export async function deleteBlobs(urls: (string | null | undefined)[]) {
  const list = [...new Set(urls.filter(isOurBlobUrl))];
  if (list.length === 0) return;
  await del(list).catch((err) => console.error("blob cleanup failed:", err));
}

// The browser owns scene text, but it must not be able to point the server
// at arbitrary files or jobs. Any asset URL or job id that isn't already in
// the stored script is dropped.
export function sanitizeScriptAssets(
  client: ScriptWithImages,
  stored: ScriptWithImages | null
): ScriptWithImages {
  const urls = new Set(assetUrlsOf(stored));
  const jobs = new Set(
    (stored?.scenes ?? []).map((s) => s.videoJobId).filter((j): j is string => !!j)
  );
  // Regeneration counts follow the image they belong to, so reordering scenes
  // can't shuffle or reset them. Anything the browser claims is ignored.
  const regens = new Map<string, number>();
  for (const s of stored?.scenes ?? []) {
    if (s.imageUrl) regens.set(s.imageUrl, s.imageRegens ?? 0);
  }
  const keepUrl = (u: string | null | undefined) => (u && urls.has(u) ? u : null);
  return {
    ...client,
    finalVideoUrl: keepUrl(client.finalVideoUrl),
    videoStartedAt: stored?.videoStartedAt ?? null,
    scenes: client.scenes.map((s) => {
      const imageUrl = keepUrl(s.imageUrl);
      return {
        ...s,
        imageUrl,
        imageRegens: imageUrl ? (regens.get(imageUrl) ?? 0) : 0,
        videoUrl: keepUrl(s.videoUrl),
        videoJobId: s.videoJobId && jobs.has(s.videoJobId) ? s.videoJobId : null,
      };
    }),
  };
}

// Photos the user uploaded are only inputs for generating scene images. Once
// the project has a finished video they are just extra storage, so they are
// deleted and the project forgets them. Generated scene images are kept.
export async function deleteUploadedReferences(projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { assetUrls: true, toneReferenceUrls: true },
  });
  if (!project) return false;
  const parse = (json: string | null): string[] => {
    try {
      const v = json ? JSON.parse(json) : [];
      return Array.isArray(v) ? v.filter((u): u is string => typeof u === "string") : [];
    } catch {
      return [];
    }
  };
  const urls = [...parse(project.assetUrls), ...parse(project.toneReferenceUrls)];
  if (urls.length === 0) return false;
  await deleteBlobs(urls);
  await prisma.project.update({
    where: { id: projectId },
    data: { assetUrls: "[]", toneReferenceUrls: "[]" },
  });
  return true;
}
