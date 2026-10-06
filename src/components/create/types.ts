import type { Brief, ScriptWithImages } from "@/lib/generation-schemas";

export type StepId = 1 | 2 | 3 | 4 | 5;

export const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: "Describe" },
  { id: 2, label: "Brief" },
  { id: 3, label: "Script" },
  { id: 4, label: "Images" },
  { id: 5, label: "Video" },
];

export type PickedFile = { file: File; url: string };

export type DescribeForm = {
  prompt: string;
  wantsVoiceover: boolean;
  wantsSubtitles: boolean;
  duration: number;
  aspectRatio: string;
  resolution: string;
  negativePrompt: string;
  assetFiles: PickedFile[];
  toneRefFiles: PickedFile[];
};

// A saved project, loaded from the gallery so the user can pick up where
// they left off.
export type InitialProject = {
  id: string;
  prompt: string;
  wantsVoiceover: boolean;
  wantsSubtitles: boolean;
  duration: number;
  aspectRatio: string;
  resolution: string;
  negativePrompt: string | null;
  assetUrls: string[];
  toneReferenceUrls: string[];
  brief: Brief | null;
  script: ScriptWithImages | null;
  revisionCount: number;
  status: string;
};

// Where a project should reopen, based on how far its data got.
export function deriveStep(brief: Brief | null, script: ScriptWithImages | null): StepId {
  if (!brief) return 1;
  if (!script) return 2;
  const hasVideoWork =
    !!script.finalVideoUrl ||
    script.scenes.some((s) => s.videoJobId || s.videoUrl || s.videoStatus);
  if (hasVideoWork) return 5;
  if (script.scenes.some((s) => s.imageUrl)) return 4;
  return 3;
}
