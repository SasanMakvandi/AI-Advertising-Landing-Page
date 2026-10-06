"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Check, Download, Film, Loader2, RefreshCw, Video } from "lucide-react";
import type { Brief, ScriptWithImages } from "@/lib/generation-schemas";
import { PEOPLE_TIP, reviewText } from "@/lib/content-review";
import type { DescribeForm, StepId } from "./types";
import {
  VIDEO_RESOLUTIONS,
  estimateVideoCost,
  estimateVideoProgress,
  money,
  normalizeResolution,
  type VideoResolution,
} from "./constants";
import { downloadHref } from "./api";
import { ChipGroup, Panel, SectionLabel, btnAccent, btnPrimary, btnSecondary } from "./ui";

type Phase = "idle" | "generating" | "stitching" | "ready_to_stitch" | "partial" | "done";

function SummaryRow({
  label,
  children,
  step,
  actionLabel,
  onGoToStep,
}: {
  label: string;
  children: ReactNode;
  step: StepId;
  actionLabel: string;
  onGoToStep: (id: StepId) => void;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-hair py-3 last:border-b-0">
      <p className="w-24 shrink-0 pt-0.5 text-[11px] font-semibold tracking-wide text-text-dim uppercase">
        {label}
      </p>
      <div className="min-w-0 flex-1 text-[13.5px] leading-[1.5] text-text">{children}</div>
      <button
        type="button"
        onClick={() => onGoToStep(step)}
        className="shrink-0 text-[12.5px] font-semibold text-accent hover:underline"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function VideoStep({
  script,
  brief,
  form,
  isMock,
  isGenerating,
  isStitching,
  isFinalizing,
  isFinalized,
  onResolution,
  onGenerate,
  onStitch,
  onFinalize,
  onGoToStep,
  onStartNew,
  onBack,
}: {
  script: ScriptWithImages;
  brief: Brief | null;
  form: DescribeForm;
  isMock: boolean;
  isGenerating: boolean;
  isStitching: boolean;
  isFinalizing: boolean;
  isFinalized: boolean;
  onResolution: (r: VideoResolution) => void;
  onGenerate: (onlyMissing: boolean) => void;
  onStitch: () => void;
  onFinalize: () => void;
  onGoToStep: (id: StepId) => void;
  onStartNew: () => void;
  onBack: () => void;
}) {
  const resolution = normalizeResolution(form.resolution);
  const scenes = script.scenes;
  const total = scenes.length;
  const totalSeconds = scenes.reduce((sum, s) => sum + s.duration, 0);
  const withImages = scenes.filter((s) => s.imageUrl).length;
  const clips = scenes.filter((s) => s.videoUrl).length;
  const pending = scenes.filter((s) => s.videoJobId).length;
  const failed = scenes.filter((s) => !s.videoUrl && !s.videoJobId && s.videoStatus === "failed");
  const hasFinal = !!script.finalVideoUrl;

  const startedAt = script.videoStartedAt ?? null;
  const [now, setNow] = useState(() => Date.now());
  const running = !hasFinal && (isStitching || isGenerating || pending > 0);
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const phase: Phase = hasFinal
    ? "done"
    : isStitching
      ? "stitching"
      : isGenerating || pending > 0
        ? "generating"
        : total > 0 && clips === total
          ? "ready_to_stitch"
          : clips > 0 || failed.length > 0
            ? "partial"
            : "idle";

  const fullCost = estimateVideoCost(scenes, resolution);
  const retryCost = estimateVideoCost(
    scenes.filter((s) => !s.videoUrl),
    resolution
  );

  const progress = estimateVideoProgress({
    startedAt,
    now,
    resolution,
    totalScenes: total,
    clipsDone: clips,
    stitching: phase === "stitching",
  });

  // Wording the video model is likely to reject, found before any money is spent.
  const flagged = scenes
    .map((s, i) => ({ index: i, flags: reviewText(s.description) }))
    .filter((f) => f.flags.length > 0);
  const failureReasons = [
    ...new Set(failed.map((s) => s.videoError).filter((e): e is string => !!e)),
  ];

  const resolutionPicker = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <ChipGroup
        options={VIDEO_RESOLUTIONS}
        value={resolution}
        onChange={onResolution}
        disabled={isFinalized}
      />
    </div>
  );

  return (
    <div>
      {phase === "idle" || phase === "partial" ? (
        <>
          <p className="mb-5 max-w-[640px] text-[14px] leading-[1.55] text-text-dim">
            Last check before your video is made. It takes a few minutes, and you&apos;ll get one
            finished video at the end.
          </p>

          <Panel>
            <SectionLabel>Review your project</SectionLabel>
            <div>
              <SummaryRow label="Request" step={1} actionLabel="View" onGoToStep={onGoToStep}>
                <span className="line-clamp-2">{form.prompt}</span>
              </SummaryRow>
              <SummaryRow label="Brief" step={2} actionLabel="Edit" onGoToStep={onGoToStep}>
                <span className="font-semibold">{brief?.productName ?? "Untitled"}</span>
                {brief?.tone ? <span className="text-text-dim">, {brief.tone}</span> : null}
              </SummaryRow>
              <SummaryRow label="Format" step={1} actionLabel="View" onGoToStep={onGoToStep}>
                {form.aspectRatio}, about {form.duration}s.{" "}
                {form.wantsVoiceover
                  ? form.wantsSubtitles
                    ? "Voiceover with subtitles."
                    : "Voiceover, no subtitles."
                  : "No voiceover."}
              </SummaryRow>
              <SummaryRow label="Script" step={3} actionLabel="Edit" onGoToStep={onGoToStep}>
                {total} {total === 1 ? "scene" : "scenes"}, {totalSeconds}s in total.
                {scenes.some((s) => s.duration < 4 || s.duration > 15) && (
                  <span className="block text-[12px] text-text-dim">
                    Scenes under 4s or over 15s are adjusted to fit the video model.
                  </span>
                )}
              </SummaryRow>
              <SummaryRow label="Images" step={4} actionLabel="Edit" onGoToStep={onGoToStep}>
                {withImages === 0
                  ? "None. Each scene is made from its description alone."
                  : `${withImages} of ${total} scenes have a reference image.`}
              </SummaryRow>
            </div>
          </Panel>

          {flagged.length > 0 && (
            <Panel className="mt-5 !border-coral/30">
              <SectionLabel>Heads up before you pay</SectionLabel>
              <p className="text-[13px] leading-[1.55] text-text-dim">
                Some wording in your script is the kind the image and video models often reject.
                You can fix it in the Script or Images step first.
              </p>
              <ul className="mt-2 space-y-1 text-[12.5px] leading-[1.5] text-text-dim">
                {flagged.map((f) => (
                  <li key={f.index}>
                    <span className="font-semibold text-text">Scene {f.index + 1}:</span>{" "}
                    {f.flags.map((x) => `${x.label} (${x.matches.join(", ")})`).join("; ")}
                  </li>
                ))}
              </ul>
              {flagged.some((f) => f.flags.some((x) => x.severity === "tip")) && (
                <p className="mt-2 text-[12.5px] leading-[1.5] text-text-dim">{PEOPLE_TIP}</p>
              )}
            </Panel>
          )}

          <Panel className="mt-5">
            <SectionLabel>Video quality</SectionLabel>
            {resolutionPicker}
            <p className="mt-4 text-[13px] leading-[1.55] text-text-dim">
              Estimated cost{" "}
              <span className="font-semibold text-text">
                {money(phase === "partial" ? retryCost : fullCost)}
              </span>
              {phase === "partial" ? " to retry the missing parts" : ""}. Usually takes 2 to 5
              minutes. You can close this page while it runs and pick it back up from your gallery.
            </p>
          </Panel>

          {phase === "partial" && (
            <div className="mt-4 text-[13px] leading-[1.5]">
              <p className="text-coral">
                Part of your video didn&apos;t finish. Retrying only pays for the parts that
                failed.
              </p>
              {failureReasons.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-1 text-text-dim">
                  {failureReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              {failureReasons.some((r) =>
                /real person|face|inappropriate|moderat|sensitive|policy|safety/i.test(r)
              ) && (
                <p className="mt-2 text-text-dim">
                  The video model blocks reference images with realistic people, and anything its
                  content filter dislikes. Go back to Images, regenerate the image without people,
                  or reword the scene, then retry.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onBack} className={btnSecondary}>
              <ArrowLeft size={14} />
              Back
            </button>
            {phase === "partial" && (
              <button type="button" onClick={() => onGenerate(true)} disabled={isFinalized} className={btnPrimary}>
                <RefreshCw size={14} />
                Retry the missing parts
              </button>
            )}
            <button
              type="button"
              onClick={() => onGenerate(false)}
              disabled={isFinalized}
              className={phase === "partial" ? btnSecondary : btnAccent}
            >
              <Video size={15} />
              {phase === "partial" ? "Start over" : "Generate video"}
            </button>
          </div>
        </>
      ) : null}

      {(phase === "generating" || phase === "stitching") && (
        <Panel>
          <p className="mb-1 flex items-center gap-2 text-[15px] font-semibold text-text">
            <Loader2 size={16} className="animate-spin" />
            Making your video
          </p>
          <p className="mb-5 text-[13px] leading-[1.55] text-text-dim">
            This usually takes 2 to 5 minutes. You can leave this page. Your project will be waiting
            in your gallery.
          </p>
          <div
            role="progressbar"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            className="h-2.5 w-full overflow-hidden rounded-full bg-panel-2"
          >
            <div
              className="h-full rounded-full bg-coral transition-[width] duration-1000 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-2.5 flex items-center justify-between text-[12.5px] text-text-dim">
            <span>{progress.label}</span>
            <span className="font-mono">{progress.percent}%</span>
          </p>
        </Panel>
      )}

      {phase === "ready_to_stitch" && (
        <>
          <Panel>
            <p className="text-[15px] font-semibold text-text">Your video is almost ready</p>
            <p className="mt-1 text-[13px] leading-[1.55] text-text-dim">
              One step left to put it all together.
            </p>
          </Panel>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onBack} className={btnSecondary}>
              <ArrowLeft size={14} />
              Back
            </button>
            <button type="button" onClick={onStitch} className={btnPrimary}>
              <Film size={15} />
              Finish video
            </button>
          </div>
        </>
      )}

      {phase === "done" && script.finalVideoUrl && (
        <>
          <Panel>
            <SectionLabel>Your video</SectionLabel>
            {isMock ? (
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-panel-2 text-[13px] font-semibold text-text-dim">
                Preview: your final video would appear here
              </div>
            ) : (
              <video
                src={script.finalVideoUrl}
                controls
                playsInline
                className="mx-auto max-h-[72vh] w-auto max-w-full rounded-2xl bg-black"
              />
            )}
          </Panel>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onBack} className={btnSecondary}>
              <ArrowLeft size={14} />
              Back
            </button>
            {!isMock && (
              <a href={downloadHref(script.finalVideoUrl, "final-video.mp4")} className={btnPrimary}>
                <Download size={15} />
                Download video
              </a>
            )}
            {!isFinalized && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Make the video again? This replaces your current video and costs about ${money(fullCost)}.`
                    )
                  ) {
                    onGenerate(false);
                  }
                }}
                className={btnSecondary}
              >
                <RefreshCw size={14} />
                Make it again
              </button>
            )}
            {isFinalized ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
                <Check size={15} /> Project finalized
              </span>
            ) : (
              <button type="button" onClick={onFinalize} disabled={isFinalizing} className={btnAccent}>
                {isFinalizing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {isFinalizing ? "Finalizing…" : "Finalize project"}
              </button>
            )}
            <button type="button" onClick={onStartNew} className={btnSecondary}>
              Start a new project
            </button>
          </div>
        </>
      )}
    </div>
  );
}
