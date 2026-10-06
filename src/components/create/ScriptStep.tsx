"use client";

import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { ScriptWithImages } from "@/lib/generation-schemas";
import { SCRIPT_STATUS_MESSAGES } from "./constants";
import {
  AutoTextarea,
  ContentNotice,
  DurationStepper,
  Panel,
  SectionLabel,
  ThinkingPanel,
  btnPrimary,
  btnSecondary,
  inputClass,
} from "./ui";

type Scene = ScriptWithImages["scenes"][number];

const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-full border border-hair bg-panel text-text-dim transition-colors hover:border-text/30 hover:text-text disabled:opacity-30";

export function ScriptStep({
  script,
  locked,
  isRevising,
  revisionsLeft,
  thinking,
  statusIndex,
  onVoiceoverScript,
  onUpdateScene,
  onMoveScene,
  onAddScene,
  onRemoveScene,
  onRevise,
  onNext,
  onBack,
}: {
  script: ScriptWithImages;
  locked: boolean;
  isRevising: boolean;
  revisionsLeft: number;
  thinking: string;
  statusIndex: number;
  onVoiceoverScript: (text: string) => void;
  onUpdateScene: <K extends keyof Scene>(index: number, key: K, value: Scene[K]) => void;
  onMoveScene: (index: number, direction: -1 | 1) => void;
  onAddScene: () => void;
  onRemoveScene: (index: number) => void;
  onRevise: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const disabled = locked || isRevising;
  const totalDuration = script.scenes.reduce((sum, s) => sum + s.duration, 0);
  const hasVoiceover = script.voiceoverScript !== null;

  return (
    <div>
      <p className="mb-5 max-w-[640px] text-[14px] leading-[1.55] text-text-dim">
        Everything here is editable, and your edits save automatically. Reorder scenes with the
        arrows, add or remove them, then continue. &quot;Revise&quot; asks Claude to smooth out the
        flow after your edits.
      </p>

      <div className="flex flex-col gap-5">
        <Panel>
          <SectionLabel>Voiceover script</SectionLabel>
          {hasVoiceover ? (
            <AutoTextarea
              value={script.voiceoverScript ?? ""}
              onChange={(e) => onVoiceoverScript(e.target.value)}
              disabled={disabled}
              rows={3}
              maxHeight={220}
              className={`${inputClass} resize-none overflow-hidden italic`}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-hair px-3.5 py-2.5 text-[12.5px] text-text-dim">
              No voiceover for this video. It&apos;s visual only.
            </p>
          )}
        </Panel>

        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-wide text-text-dim uppercase">Scenes</p>
            <span className="font-mono text-[12px] text-text-dim">{totalDuration}s total</span>
          </div>

          <div className="flex flex-col gap-3">
            {script.scenes.map((scene, i) => (
              <div
                key={`${scene.order}-${i}`}
                className="rounded-xl border border-hair bg-panel p-3.5 sm:p-4"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-mono text-[12px] font-semibold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <label className="flex min-w-[200px] flex-1 items-center gap-2">
                    <span className="shrink-0 text-[11.5px] font-medium text-text-dim">Shot type</span>
                    <input
                      value={scene.shotType}
                      onChange={(e) => onUpdateScene(i, "shotType", e.target.value)}
                      disabled={disabled}
                      placeholder="e.g. Close-up"
                      className="min-w-0 flex-1 rounded-lg border border-hair bg-bg px-3 py-1.5 text-left text-[13px] text-text outline-none transition-colors placeholder:text-text-dim/60 focus:border-accent disabled:opacity-60"
                    />
                  </label>
                  <DurationStepper
                    value={scene.duration}
                    onChange={(v) => onUpdateScene(i, "duration", v)}
                    disabled={disabled}
                  />
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onMoveScene(i, -1)}
                      disabled={disabled || i === 0}
                      aria-label={`Move scene ${i + 1} up`}
                      className={iconBtn}
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveScene(i, 1)}
                      disabled={disabled || i === script.scenes.length - 1}
                      aria-label={`Move scene ${i + 1} down`}
                      className={iconBtn}
                    >
                      <ChevronDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveScene(i)}
                      disabled={disabled || script.scenes.length <= 1}
                      aria-label={`Remove scene ${i + 1}`}
                      className={`${iconBtn} hover:border-coral/50 hover:text-coral`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <AutoTextarea
                  value={scene.description}
                  onChange={(e) => onUpdateScene(i, "description", e.target.value)}
                  disabled={disabled}
                  rows={2}
                  maxHeight={180}
                  placeholder="What's happening in this shot"
                  className="mt-3 w-full resize-none overflow-hidden rounded-lg border border-hair bg-bg px-3 py-2 text-[13px] leading-[1.5] text-text outline-none transition-colors placeholder:text-text-dim/60 focus:border-accent disabled:opacity-60"
                />
                <ContentNotice text={scene.description} compact />
                {scene.voiceover !== null && (
                  <AutoTextarea
                    value={scene.voiceover}
                    onChange={(e) => onUpdateScene(i, "voiceover", e.target.value)}
                    disabled={disabled}
                    rows={1}
                    maxHeight={140}
                    placeholder="Voiceover line for this scene"
                    className="mt-2 w-full resize-none overflow-hidden rounded-lg border border-hair bg-bg px-3 py-2 text-[12.5px] leading-[1.5] text-text-dim italic outline-none transition-colors placeholder:text-text-dim/60 placeholder:not-italic focus:border-accent disabled:opacity-60"
                  />
                )}
              </div>
            ))}
          </div>

          {!locked && (
            <button
              type="button"
              onClick={onAddScene}
              disabled={disabled}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-hair bg-panel px-4 py-3 text-[13px] font-semibold text-text-dim transition-colors hover:border-accent hover:text-text disabled:opacity-60"
            >
              <Plus size={14} />
              Add a scene
            </button>
          )}
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack} disabled={isRevising} className={btnSecondary}>
          <ArrowLeft size={14} />
          Back
        </button>
        {!locked && (
          <button
            type="button"
            onClick={onRevise}
            disabled={isRevising || revisionsLeft <= 0}
            className={btnSecondary}
          >
            {isRevising ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {isRevising
              ? "Revising…"
              : revisionsLeft > 0
                ? `Revise (${revisionsLeft} left)`
                : "No revisions left"}
          </button>
        )}
        <button type="button" onClick={onNext} disabled={isRevising} className={btnPrimary}>
          Continue to images
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {isRevising && (
        <div className="mt-5 max-w-2xl">
          <ThinkingPanel
            text={thinking}
            fallback={SCRIPT_STATUS_MESSAGES[statusIndex % SCRIPT_STATUS_MESSAGES.length]}
          />
        </div>
      )}
    </div>
  );
}
