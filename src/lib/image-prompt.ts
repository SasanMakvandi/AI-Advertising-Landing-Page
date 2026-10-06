import type { Brief, SceneWithImage } from "@/lib/generation-schemas";

// Scene images are starting frames for video, not finished ads, so the prompt
// says so. Without this the image model tends to produce a polished
// standalone product shot with text and a poster layout.
export function buildSceneImagePrompt(
  scene: SceneWithImage,
  index: number,
  total: number,
  brief: Brief | null,
  aspectRatio: string,
  negativePrompt: string | null
) {
  const product = brief
    ? ` The video is about: ${brief.productName}. ${brief.productDescription}. Tone: ${brief.tone}.`
    : "";
  const avoid = negativePrompt ? ` Avoid: ${negativePrompt}.` : "";
  return (
    `A single still frame taken from scene ${index + 1} of ${total} of a video, not a standalone advertisement or poster. ` +
    `Show the exact moment described, as a candid cinematic frame with natural camera framing for a ${aspectRatio} video. ` +
    `${scene.shotType ? `${scene.shotType} shot. ` : ""}${scene.description}.${product} ` +
    `No text, captions, logo overlays, watermarks, borders, or graphic design elements. Do not compose it as a product hero shot unless the scene is explicitly about the product.${avoid}`
  );
}
