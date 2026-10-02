const COMETAPI_BASE = "https://api.cometapi.com/v1";

type GenerateSceneImageInput = {
  prompt: string;
  // URL of an uploaded reference image (Vercel Blob), if the project has
  // one. When present we use the image-editing model (gpt-image-2) so the
  // result is guided by it; otherwise we fall back to pure text-to-image.
  referenceImageUrl?: string | null;
  size?: string;
  quality?: "low" | "medium" | "high";
};

async function parseImageResponse(res: Response, label: string): Promise<Buffer> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CometAPI ${label} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`CometAPI ${label} response did not include image data`);
  }
  return Buffer.from(b64, "base64");
}

// Generates one scene's reference image via CometAPI. Uses gpt-image-2
// (image editing, guided by an uploaded reference photo) when a reference
// image is available, otherwise gpt-image-1 (pure text-to-image).
export async function generateSceneImage({
  prompt,
  referenceImageUrl,
  size = "1024x1024",
  quality = "medium",
}: GenerateSceneImageInput): Promise<Buffer> {
  const apiKey = process.env.COMETAPI_KEY?.trim();
  if (!apiKey) {
    throw new Error("COMETAPI_KEY is not configured");
  }
  // Header values must be Latin-1 — a stray character from a bad copy/paste
  // into the env var (e.g. a smart quote or bullet) throws an opaque
  // "ByteString" error deep in fetch(). Catch it here with an actionable
  // message instead.
  if (/[^\x00-\xFF]/.test(apiKey)) {
    throw new Error(
      "COMETAPI_KEY contains a character that isn't valid in an HTTP header — it was likely corrupted when pasted into Vercel's environment variables. Re-copy and re-paste the key value."
    );
  }

  if (referenceImageUrl) {
    const refRes = await fetch(referenceImageUrl);
    if (!refRes.ok) {
      throw new Error(`Couldn't fetch reference image (${refRes.status})`);
    }
    const imageBuffer = Buffer.from(await refRes.arrayBuffer());

    // Note: unlike the generations endpoint below, the edits endpoint
    // rejects "response_format" outright on some CometAPI backend instances
    // ("Unknown parameter") — it already returns b64_json by default per
    // CometAPI's own docs, so we just omit it here.
    const form = new FormData();
    form.set("model", "gpt-image-2");
    form.set("prompt", prompt);
    form.set("size", size);
    form.set("quality", quality);
    form.set("image", new Blob([imageBuffer]), "reference.png");

    const res = await fetch(`${COMETAPI_BASE}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    return parseImageResponse(res, "image edit");
  }

  const res = await fetch(`${COMETAPI_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size,
      quality,
      n: 1,
      response_format: "b64_json",
    }),
  });
  return parseImageResponse(res, "image generation");
}
