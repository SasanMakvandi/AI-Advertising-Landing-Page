import type { Brief, ScriptWithImages } from "@/lib/generation-schemas";

export const DURATION_OPTIONS = [10, 15, 20, 25, 30];
export const RATIO_OPTIONS = ["9:16", "1:1", "16:9", "4:5"];

export const VIDEO_RESOLUTIONS = ["480p", "720p", "1080p"] as const;
export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number];

export function normalizeResolution(r: string | null | undefined): VideoResolution {
  return (VIDEO_RESOLUTIONS as readonly string[]).includes(r ?? "")
    ? (r as VideoResolution)
    : "480p";
}

// $0.01 per ApiFrame credit; credits per second of Seedance 2 output.
const CREDITS_PER_SECOND: Record<VideoResolution, number> = { "480p": 8, "720p": 19, "1080p": 43 };

// The video model only accepts 4 to 15 second clips.
export function clampSceneSeconds(seconds: number) {
  return Math.min(15, Math.max(4, Math.round(seconds)));
}

export function estimateVideoCost(scenes: { duration: number }[], resolution: VideoResolution) {
  const seconds = scenes.reduce((sum, s) => sum + clampSceneSeconds(s.duration), 0);
  return seconds * CREDITS_PER_SECOND[resolution] * 0.01;
}

// Rough time Seedance takes per run at each resolution (scenes render in
// parallel), plus the time to join the clips. Used only for the progress bar.
const GENERATION_SECONDS: Record<VideoResolution, number> = { "480p": 150, "720p": 210, "1080p": 330 };
const STITCH_SECONDS = 30;

export type VideoProgress = { percent: number; label: string };

export function estimateVideoProgress({
  startedAt,
  now,
  resolution,
  totalScenes,
  clipsDone,
  stitching,
}: {
  startedAt: number | null;
  now: number;
  resolution: VideoResolution;
  totalScenes: number;
  clipsDone: number;
  stitching: boolean;
}): VideoProgress {
  if (stitching) return { percent: 94, label: "Almost done" };

  const expected = GENERATION_SECONDS[resolution];
  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  // Time-based guess that never reaches 100% on its own, floored by how many
  // clips have actually finished.
  const byTime = startedAt ? Math.min(0.95, elapsed / expected) : 0;
  const byClips = totalScenes > 0 ? clipsDone / totalScenes : 0;
  const fraction = Math.max(byTime, byClips);
  const percent = Math.min(90, Math.round(fraction * 90));

  if (!startedAt) return { percent, label: "A few minutes left" };
  if (elapsed >= expected) return { percent, label: "Taking a little longer than usual" };
  const remaining = Math.max(15, expected - elapsed) + STITCH_SECONDS;
  const minutes = Math.ceil(remaining / 60);
  return { percent, label: minutes <= 1 ? "Less than a minute left" : `About ${minutes} minutes left` };
}

export const IMAGE_COST_PER_SCENE = 0.04;

export function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export const MOCK_PROMPT = "A 20 second product showcase for our new ceramic pour-over coffee set";

export const MOCK_THINKING = [
  "Reading the request for concrete details: product, audience, tone.\n",
  "No explicit price given, so leaving that unset rather than guessing.\n",
  "Tone reads as warm and unhurried given the morning-ritual framing.\n",
];

export const MOCK_SCRIPT_THINKING = [
  "Aiming for four 5 second scenes, roughly 20 seconds total.\n",
  "Opening on a sensory close-up usually earns attention fastest.\n",
  "Splitting the voiceover evenly so each scene gets one clear line.\n",
];

// Claude's adaptive thinking often streams nothing for a short task, so these
// cycle in the working panel so the wait never looks stalled. Real thinking
// text, when it exists, always takes priority.
export const BRIEF_STATUS_MESSAGES = [
  "Reading your request…",
  "Identifying the product and audience…",
  "Drafting tone and selling points…",
  "Wrapping up the brief…",
];
export const SCRIPT_STATUS_MESSAGES = [
  "Reviewing the brief…",
  "Blocking out scenes…",
  "Writing shot descriptions…",
  "Polishing the voiceover…",
];

export const MOCK_BRIEF: Brief = {
  productName: "Ceramic Pour-Over Set",
  productDescription:
    "A hand-glazed ceramic pour-over set designed for a slower, more deliberate morning coffee ritual.",
  price: "$68",
  targetAudience: "Home coffee enthusiasts who care about craft and aesthetics, ages 25 to 45",
  tone: "Warm, premium, unhurried",
  keySellingPoints: [
    "Hand-glazed, one-of-a-kind ceramic finish",
    "Designed for slow, intentional brewing",
    "Looks as good on a shelf as it does in use",
  ],
  ctaIntent: "Shop now",
};

// Preview mode never calls the image API; gradients stand in for images.
export const MOCK_IMAGE_GRADIENTS = [
  "linear-gradient(135deg, #4B4EFF, #211E19)",
  "linear-gradient(135deg, #FF5C39, #4B4EFF)",
  "linear-gradient(135deg, #E4DECF, #FF5C39)",
  "linear-gradient(135deg, #211E19, #4B4EFF)",
];

export const MOCK_SCRIPT: ScriptWithImages = {
  voiceoverScript:
    "Some mornings deserve more than instant coffee. Meet the pour-over set built for the ritual. Hand-glazed ceramic, a slow bloom, and a cup that tastes like you meant it. Available now.",
  scenes: [
    {
      order: 1,
      shotType: "Close-up",
      duration: 5,
      description:
        "Slow push-in on the pour-over set, steam curling upward, soft morning light through a window.",
      voiceover: "Some mornings deserve more than instant coffee.",
    },
    {
      order: 2,
      shotType: "Wide",
      duration: 5,
      description: "Water arcing into the dripper in slow motion, coffee blooming beneath.",
      voiceover: "Meet the pour-over set built for the ritual.",
    },
    {
      order: 3,
      shotType: "Lifestyle",
      duration: 5,
      description: "Hands wrapped around the finished mug at a sunlit table.",
      voiceover: "A slow bloom. A cup that tastes like you meant it.",
    },
    {
      order: 4,
      shotType: "Macro",
      duration: 5,
      description: "Detail shot of the ceramic glaze and texture, logo subtly in frame.",
      voiceover: "Hand-glazed ceramic. Available now.",
    },
  ],
};
