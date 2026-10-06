"use client";

import { useState } from "react";
import { ArrowRight, Captions, ChevronDown, Loader2, Lock, Mic, SlidersHorizontal, Wand2 } from "lucide-react";
import type { DescribeForm } from "./types";
import {
  DURATION_OPTIONS,
  RATIO_OPTIONS,
  VIDEO_RESOLUTIONS,
  BRIEF_STATUS_MESSAGES,
  normalizeResolution,
} from "./constants";
import {
  AutoTextarea,
  ChipGroup,
  ContentNotice,
  FileDropzone,
  Panel,
  SectionLabel,
  ThinkingPanel,
  YesNoToggle,
  btnPrimary,
  btnSecondary,
  inputClass,
} from "./ui";

const isDev = process.env.NODE_ENV !== "production";

export function DescribeStep({
  form,
  onChange,
  hasProject,
  isExtracting,
  thinking,
  statusIndex,
  existingAssetUrls,
  existingToneUrls,
  onContinue,
  onNext,
  onStartNew,
  onPreview,
}: {
  form: DescribeForm;
  onChange: (patch: Partial<DescribeForm>) => void;
  hasProject: boolean;
  isExtracting: boolean;
  thinking: string;
  statusIndex: number;
  existingAssetUrls: string[];
  existingToneUrls: string[];
  onContinue: () => void;
  onNext: () => void;
  onStartNew: () => void;
  onPreview: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const locked = hasProject || isExtracting;

  function addFiles(key: "assetFiles" | "toneRefFiles", files: File[]) {
    const next = [...form[key], ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))];
    onChange(key === "assetFiles" ? { assetFiles: next } : { toneRefFiles: next });
  }

  function removeFile(key: "assetFiles" | "toneRefFiles", index: number) {
    const removed = form[key][index];
    if (removed) URL.revokeObjectURL(removed.url);
    const next = form[key].filter((_, i) => i !== index);
    onChange(key === "assetFiles" ? { assetFiles: next } : { toneRefFiles: next });
  }

  return (
    <div>
      {hasProject && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-hair bg-bg px-4 py-3 text-[13px] leading-[1.5] text-text-dim">
          <Lock size={14} className="mt-0.5 shrink-0" />
          This is the request your project was built from, so it can&apos;t be edited. You can
          change the brief and script in the next steps, or start a new project.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-5">
          <Panel>
            <SectionLabel>What are you making?</SectionLabel>
            <AutoTextarea
              value={form.prompt}
              onChange={(e) => onChange({ prompt: e.target.value })}
              rows={4}
              maxHeight={280}
              placeholder="e.g. A 20 second product showcase for our new ceramic mug"
              disabled={locked}
              className={`${inputClass} resize-none overflow-hidden px-4 py-3.5 text-[15.5px] leading-[1.5]`}
            />
            {!locked && <ContentNotice text={form.prompt} />}
          </Panel>

          <Panel>
            <SectionLabel hint="optional">Product photos</SectionLabel>
            <FileDropzone
              hint="Upload reference photos"
              files={form.assetFiles}
              existingUrls={existingAssetUrls}
              onAdd={(files) => addFiles("assetFiles", files)}
              onRemove={(i) => removeFile("assetFiles", i)}
              disabled={locked}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel>
            <SectionLabel>Format</SectionLabel>
            <div className="flex flex-col gap-4">
              <ChipGroup
                label="Length"
                options={DURATION_OPTIONS}
                value={form.duration}
                onChange={(v) => onChange({ duration: v })}
                disabled={locked}
                formatLabel={(v) => `${v}s`}
              />
              <ChipGroup
                label="Ratio"
                options={RATIO_OPTIONS}
                value={form.aspectRatio}
                onChange={(v) => onChange({ aspectRatio: v })}
                disabled={locked}
              />
            </div>
          </Panel>

          <Panel>
            <SectionLabel>Audio</SectionLabel>
            <div className="flex flex-col gap-2.5">
              <YesNoToggle
                icon={Mic}
                label="Needs voiceover?"
                value={form.wantsVoiceover}
                disabled={locked}
                onChange={(v) =>
                  onChange(v ? { wantsVoiceover: true } : { wantsVoiceover: false, wantsSubtitles: false })
                }
              />
              {form.wantsVoiceover && (
                <YesNoToggle
                  icon={Captions}
                  label="Include subtitles?"
                  value={form.wantsSubtitles}
                  disabled={locked}
                  onChange={(v) => onChange({ wantsSubtitles: v })}
                />
              )}
            </div>
          </Panel>

          <div className="overflow-hidden rounded-2xl border border-hair bg-bg">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-[13px] font-semibold text-text"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-text-dim" />
                Advanced options
              </span>
              <ChevronDown
                size={16}
                className={`text-text-dim transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              />
            </button>
            {showAdvanced && (
              <div className="flex flex-col gap-5 border-t border-hair px-5 py-5">
                <ChipGroup
                  label="Video resolution"
                  options={VIDEO_RESOLUTIONS}
                  value={normalizeResolution(form.resolution)}
                  onChange={(v) => onChange({ resolution: v })}
                  disabled={locked}
                />
                <div>
                  <span className="mb-2 block text-[11.5px] font-medium text-text-dim">
                    Negative prompt
                  </span>
                  <AutoTextarea
                    value={form.negativePrompt}
                    onChange={(e) => onChange({ negativePrompt: e.target.value })}
                    rows={2}
                    maxHeight={140}
                    placeholder="Anything to avoid, e.g. text overlays, fast cuts, competitor branding"
                    disabled={locked}
                    className={`${inputClass} resize-none overflow-hidden`}
                  />
                </div>
                <div>
                  <span className="mb-2 block text-[11.5px] font-medium text-text-dim">
                    Tone reference images <span className="text-text-dim/70">(optional)</span>
                  </span>
                  <FileDropzone
                    hint="Upload mood or style references"
                    files={form.toneRefFiles}
                    existingUrls={existingToneUrls}
                    onAdd={(files) => addFiles("toneRefFiles", files)}
                    onRemove={(i) => removeFile("toneRefFiles", i)}
                    disabled={locked}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {hasProject ? (
          <>
            <button type="button" onClick={onStartNew} className={btnSecondary}>
              Start a new project
            </button>
            <button type="button" onClick={onNext} className={btnPrimary}>
              Continue
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onContinue} disabled={isExtracting} className={btnPrimary}>
              {isExtracting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Reading your request…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            {isDev && !isExtracting && (
              <button
                type="button"
                onClick={onPreview}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-text-dim hover:text-text"
              >
                <Wand2 size={13} />
                Preview with sample data (no tokens used)
              </button>
            )}
          </>
        )}
      </div>

      {isExtracting && (
        <div className="mt-5 max-w-2xl">
          <ThinkingPanel
            text={thinking}
            fallback={BRIEF_STATUS_MESSAGES[statusIndex % BRIEF_STATUS_MESSAGES.length]}
          />
        </div>
      )}
    </div>
  );
}
