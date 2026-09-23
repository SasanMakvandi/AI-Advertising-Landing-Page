"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Palette,
  Pencil,
  RefreshCw,
  Check,
  Mic,
  Play,
  Captions,
  Lock,
  Upload,
  X,
} from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { SectionHead } from "./ui/SectionHead";
import { promptDemo } from "@/lib/content";

const WAVEFORM = [
  40, 65, 30, 80, 55, 90, 45, 60, 35, 70, 50, 85, 40, 60, 30, 75, 55, 95, 45, 65, 35, 80, 50, 70,
  40, 60, 30, 85, 55, 75, 45, 65, 35, 90, 50, 70, 40, 60, 30, 80,
];

function ChipGroup({
  label,
  options,
  selected,
  onSelect,
  allowCustom,
  customValue,
  onCustomChange,
}: {
  label: string;
  options: string[];
  selected: number;
  onSelect: (i: number) => void;
  allowCustom?: boolean;
  customValue?: string;
  onCustomChange?: (v: string) => void;
}) {
  const customIndex = options.length;
  const isCustom = allowCustom && selected === customIndex;

  return (
    <div>
      <span className="mb-2 block text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(i)}
            className={`rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors ${
              selected === i
                ? "border-text bg-text text-bg"
                : "border-hair text-text-dim hover:border-text/30 hover:text-text"
            }`}
          >
            {opt}
          </button>
        ))}
        {allowCustom && (
          <button
            type="button"
            onClick={() => onSelect(customIndex)}
            className={`rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors ${
              isCustom
                ? "border-text bg-text text-bg"
                : "border-hair text-text-dim hover:border-text/30 hover:text-text"
            }`}
          >
            {promptDemo.customOptionLabel}
          </button>
        )}
      </div>
      {isCustom && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange?.(e.target.value)}
          placeholder={promptDemo.customPlaceholder}
          className="mt-2 w-full rounded-full border border-hair bg-bg px-3.5 py-[7px] text-[13px] text-text outline-none transition-colors focus:border-accent"
        />
      )}
    </div>
  );
}

function ApprovalGate({
  question,
  onApprove,
  onRedo,
  redoLabel = "Needs changes",
  redoNote,
}: {
  question: string;
  onApprove: () => void;
  onRedo: () => void;
  redoLabel?: string;
  redoNote?: string;
}) {
  return (
    <div className="mt-7 rounded-2xl border border-hair bg-bg p-5">
      <p className="mb-3 text-[14.5px] font-medium text-text">{question}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onApprove}
          className="inline-flex items-center gap-1.5 rounded-full bg-text px-5 py-2.5 text-[13.5px] font-semibold text-bg transition-colors hover:bg-accent"
        >
          <Check size={14} /> Approve
        </button>
        <button
          type="button"
          onClick={onRedo}
          className="inline-flex items-center gap-1.5 rounded-full border border-hair px-5 py-2.5 text-[13.5px] font-semibold text-text-dim transition-colors hover:border-text/30 hover:text-text"
        >
          <RefreshCw size={14} /> {redoLabel}
        </button>
      </div>
      {redoNote && <p className="mt-2.5 text-[12.5px] text-text-dim">{redoNote}</p>}
    </div>
  );
}

function SceneRow({ scene }: { scene: (typeof promptDemo.scenes)[number] }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-hair bg-bg p-4">
      <span className="font-mono mt-0.5 shrink-0 text-sm font-medium text-accent">
        {String(scene.order).padStart(2, "0")}
      </span>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent uppercase">
            {scene.shotType}
          </span>
          <span className="font-mono text-[11.5px] text-text-dim">{scene.duration}s</span>
        </div>
        <p className="text-[14.5px] leading-[1.55] text-text-dim">{scene.description}</p>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-text-dim italic">&quot;{scene.voiceover}&quot;</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Edit scene"
          className="rounded-full p-2 text-text-dim transition-colors hover:bg-panel-2 hover:text-text"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          aria-label="Regenerate scene"
          className="rounded-full p-2 text-text-dim transition-colors hover:bg-panel-2 hover:text-text"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}

export function PromptDemo() {
  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [prompt, setPrompt] = useState(promptDemo.placeholderPrompt);
  const [campaignSelections, setCampaignSelections] = useState(
    promptDemo.campaignTweaks.map((t) => t.defaultIndex)
  );
  const [campaignCustomValues, setCampaignCustomValues] = useState(
    promptDemo.campaignTweaks.map(() => "")
  );
  const [formatSelections, setFormatSelections] = useState(
    promptDemo.formatTweaks.map((t) => t.defaultIndex)
  );
  const [demoAssets, setDemoAssets] = useState<{ file: File; url: string }[]>([]);
  const [stage, setStage] = useState(0);
  const [scriptGenerated, setScriptGenerated] = useState(false);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [audioGenerated, setAudioGenerated] = useState(false);
  const [subtitleStyleIndex, setSubtitleStyleIndex] = useState(0);
  const [subtitlesGenerated, setSubtitlesGenerated] = useState(false);

  const totalDuration = promptDemo.scenes.reduce((sum, s) => sum + s.duration, 0);

  function goToStep(n: number) {
    setStep(n);
    setMaxStepReached((m) => Math.max(m, n));
  }

  function addDemoAssets(files: File[]) {
    setDemoAssets((prev) => [...prev, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  function removeDemoAsset(index: number) {
    setDemoAssets((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });
  }

  return (
    <section id="try-it" className="mx-auto max-w-[1200px] px-6 pb-[90px] lg:px-12">
      <SectionHead title={promptDemo.headline} />

      <Reveal className="rounded-[28px] border border-hair bg-panel p-8 shadow-[0_1px_2px_rgba(33,30,25,0.05),0_16px_36px_rgba(33,30,25,0.08)] sm:p-12">
        <div className="mb-9 flex flex-wrap gap-2">
          {promptDemo.steps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(s.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                step === s.id
                  ? "border-text bg-text text-bg"
                  : "border-hair text-text-dim hover:border-text/30 hover:text-text"
              }`}
            >
              <span className="font-mono text-[11px] opacity-70">{String(s.id).padStart(2, "0")}</span>
              {s.title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 1 && (
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[12px] font-semibold text-accent">
                  {promptDemo.eyebrow}
                </span>

                <p className="mt-5 mb-2 text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                  What are you making?
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-hair bg-bg px-4 py-3.5 text-[15.5px] leading-[1.5] text-text outline-none transition-colors focus:border-accent"
                />

                <div className="mt-5">
                  <span className="mb-2 block text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                    Product photos
                  </span>
                  {demoAssets.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {demoAssets.map((a, i) => (
                        <div
                          key={a.url}
                          className="group relative h-16 w-16 overflow-hidden rounded-lg border border-hair"
                        >
                          <Image src={a.url} alt={a.file.name} fill unoptimized className="object-cover" />
                          <button
                            type="button"
                            aria-label="Remove image"
                            onClick={() => removeDemoAsset(i)}
                            className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-hair bg-bg px-4 py-3 text-[13px] font-medium text-text-dim transition-colors hover:border-accent hover:text-text">
                    <Upload size={14} />
                    Upload product photos
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(e) => {
                        const picked = Array.from(e.target.files || []);
                        if (picked.length) addDemoAssets(picked);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 flex items-center gap-2 text-[12.5px] text-text-dim">
                    <Palette size={13} />
                    {promptDemo.brandNote}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {promptDemo.formatTweaks.map((t, i) => (
                    <ChipGroup
                      key={t.label}
                      label={t.label}
                      options={t.options}
                      selected={formatSelections[i]}
                      onSelect={(v) =>
                        setFormatSelections((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                      }
                    />
                  ))}
                </div>

                {stage === 0 && (
                  <button
                    type="button"
                    onClick={() => setStage(1)}
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-text px-[22px] py-[12px] text-[14px] font-semibold text-bg transition-colors hover:bg-accent"
                  >
                    {promptDemo.continueCta}
                    <ArrowRight size={15} />
                  </button>
                )}

                {stage >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="mt-8 mb-3 text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                      Campaign &amp; goals
                    </p>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {promptDemo.campaignTweaks.map((t, i) => (
                        <ChipGroup
                          key={t.label}
                          label={t.label}
                          options={t.options}
                          selected={campaignSelections[i]}
                          onSelect={(v) =>
                            setCampaignSelections((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                          }
                          allowCustom={t.allowCustom}
                          customValue={campaignCustomValues[i]}
                          onCustomChange={(v) =>
                            setCampaignCustomValues((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {!scriptGenerated ? (
                  stage >= 1 && (
                    <button
                      type="button"
                      onClick={() => setScriptGenerated(true)}
                      className="group mt-9 inline-flex items-center gap-2 rounded-full bg-text px-[26px] py-[14px] text-[15px] font-semibold text-bg transition-colors hover:bg-accent"
                    >
                      {promptDemo.generateScriptCta}
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )
                ) : (
                  <div className="mt-9 border-t border-hair pt-8">
                    <div className="mb-5 flex items-center justify-between">
                      <p className="text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                        Scene breakdown
                      </p>
                      <span className="font-mono text-[13px] text-text-dim">{totalDuration}s total</span>
                    </div>
                    <p className="mb-5 text-[13.5px] leading-[1.5] text-text-dim">
                      Configure each scene below — edit the shot, or regenerate it on its own.
                    </p>
                    <div className="mb-7 flex flex-col gap-3">
                      {promptDemo.scenes.map((scene) => (
                        <SceneRow key={scene.order} scene={scene} />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="group inline-flex items-center gap-2 rounded-full bg-text px-[26px] py-[14px] text-[15px] font-semibold text-bg transition-colors hover:bg-accent"
                    >
                      Continue to reference images
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-[19px] font-semibold text-text">Reference images</h3>
                  <span className="rounded-full bg-panel-2 px-2.5 py-1 text-[11px] font-semibold text-text-dim">
                    Gen-3
                  </span>
                </div>
                <p className="mb-6 max-w-[480px] text-[14px] leading-[1.55] text-text-dim">
                  {promptDemo.refImageNote}
                </p>
                <p className="mb-6 text-[13.5px] text-text-dim">
                  Your generated reference images are on the right — one per scene.
                </p>

                <ApprovalGate
                  question={promptDemo.refImageGateQuestion}
                  onApprove={() => goToStep(3)}
                  onRedo={() => {
                    setStep(1);
                    setScriptGenerated(false);
                    setStage(0);
                  }}
                  redoNote={promptDemo.refImageRedoNote}
                />
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="mb-3 font-serif text-[19px] font-semibold text-text">Video generation</h3>
                <div className="mb-6 flex flex-wrap gap-2">
                  {promptDemo.videoProviders.map((p) => (
                    <span
                      key={p.name}
                      className="rounded-full bg-panel-2 px-3 py-1.5 text-[12px] text-text-dim"
                    >
                      <span className="font-semibold text-text">{p.name}</span> — {p.limit}
                    </span>
                  ))}
                </div>
                <p className="mb-6 text-[13.5px] text-text-dim">
                  Your generated clips are on the right — one per scene.
                </p>

                <ApprovalGate
                  question={promptDemo.videoGateQuestion}
                  onApprove={() => goToStep(4)}
                  onRedo={() => setStep(2)}
                  redoNote={promptDemo.videoRedoNote}
                />
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-[19px] font-semibold text-text">Audio</h3>
                  <span className="rounded-full bg-panel-2 px-2.5 py-1 text-[11px] font-semibold text-text-dim">
                    Optional · ElevenLabs
                  </span>
                </div>

                <p className="mb-3 text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                  Pick a voice
                </p>
                <div className="mb-7 flex flex-wrap gap-2">
                  {promptDemo.voices.map((v, i) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setVoiceIndex(i)}
                      className={`rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors ${
                        voiceIndex === i
                          ? "border-text bg-text text-bg"
                          : "border-hair text-text-dim hover:border-text/30 hover:text-text"
                      }`}
                    >
                      {v.name} <span className="opacity-70">— {v.style}</span>
                    </button>
                  ))}
                </div>

                <div className="mb-7 rounded-2xl border border-hair bg-bg p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                      Voiceover script
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:underline"
                    >
                      <Pencil size={12} /> Edit script
                    </button>
                  </div>
                  <p className="text-[14.5px] leading-[1.55] text-text-dim italic">
                    &quot;{promptDemo.voiceoverScript}&quot;
                  </p>
                </div>

                {!audioGenerated ? (
                  <div className="flex flex-wrap items-center gap-5">
                    <button
                      type="button"
                      onClick={() => setAudioGenerated(true)}
                      className="group inline-flex items-center gap-2 rounded-full bg-text px-[26px] py-[14px] text-[15px] font-semibold text-bg transition-colors hover:bg-accent"
                    >
                      <Mic size={16} /> Generate audio
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(5)}
                      className="text-[13.5px] font-semibold text-text-dim hover:text-text"
                    >
                      Skip audio →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-3 rounded-2xl border border-hair bg-bg p-5">
                      <button
                        type="button"
                        aria-label="Play"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text text-bg"
                      >
                        <Play size={14} />
                      </button>
                      <div className="flex h-8 flex-1 items-center gap-[3px]">
                        {WAVEFORM.map((h, i) => (
                          <span
                            key={i}
                            className="w-[3px] rounded-full bg-accent/40"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[12px] text-text-dim">0:20</span>
                    </div>
                    <ApprovalGate
                      question={promptDemo.audioGateQuestion}
                      onApprove={() => goToStep(5)}
                      onRedo={() => setAudioGenerated(false)}
                      redoLabel="Regenerate"
                    />
                  </>
                )}
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-[19px] font-semibold text-text">Subtitles</h3>
                  <span className="rounded-full bg-panel-2 px-2.5 py-1 text-[11px] font-semibold text-text-dim">
                    Optional
                  </span>
                </div>

                <p className="mb-3 text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                  Style
                </p>
                <div className="mb-7 flex flex-wrap gap-2">
                  {promptDemo.subtitleStyles.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubtitleStyleIndex(i)}
                      className={`rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors ${
                        subtitleStyleIndex === i
                          ? "border-text bg-text text-bg"
                          : "border-hair text-text-dim hover:border-text/30 hover:text-text"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div
                  className="mb-7 flex aspect-video max-w-[360px] items-end justify-center overflow-hidden rounded-2xl p-4"
                  style={{ background: promptDemo.scenes[0].gradient }}
                >
                  <span
                    className={`mb-3 rounded-md px-3 py-1.5 text-center text-[13px] font-semibold text-white ${
                      subtitleStyleIndex === 2 ? "bg-accent" : "bg-black/55"
                    }`}
                  >
                    {promptDemo.voiceoverScript.split(".")[0]}.
                  </span>
                </div>

                {!subtitlesGenerated ? (
                  <div className="flex flex-wrap items-center gap-5">
                    <button
                      type="button"
                      onClick={() => setSubtitlesGenerated(true)}
                      className="group inline-flex items-center gap-2 rounded-full bg-text px-[26px] py-[14px] text-[15px] font-semibold text-bg transition-colors hover:bg-accent"
                    >
                      <Captions size={16} /> Generate subtitles
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(6)}
                      className="text-[13.5px] font-semibold text-text-dim hover:text-text"
                    >
                      Skip subtitles →
                    </button>
                  </div>
                ) : (
                  <ApprovalGate
                    question={promptDemo.subtitleGateQuestion}
                    onApprove={() => goToStep(6)}
                    onRedo={() => setSubtitlesGenerated(false)}
                    redoLabel="Regenerate"
                  />
                )}
              </div>
            )}

            {step === 6 && (
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
                  <Check size={26} className="text-accent" />
                </div>
                <h3 className="mb-2 font-serif text-[24px] font-semibold text-text">
                  {promptDemo.doneHeadline}
                </h3>
                <p className="mb-7 max-w-[420px] text-[14px] leading-[1.5] text-text-dim">
                  {promptDemo.doneNote}
                </p>
                <div className="flex flex-wrap items-center gap-5">
                  <a
                    href="/signup"
                    className="group inline-flex items-center gap-2 rounded-full bg-coral px-[26px] py-[14px] text-[15px] font-semibold text-white transition-colors hover:bg-[#ff7455]"
                  >
                    {promptDemo.finalCta}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[13px] font-semibold text-text-dim hover:text-text"
                  >
                    ↺ Replay the walkthrough
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          <div className="h-fit rounded-2xl border border-hair bg-bg p-6 lg:sticky lg:top-6">
            <p className="mb-5 text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
              {promptDemo.assetsPanelTitle}
            </p>

            <div className="mb-5">
              <p className="mb-1.5 text-[12.5px] font-semibold text-text">{promptDemo.scriptAssetLabel}</p>
              {scriptGenerated ? (
                <p className="text-[13.5px] leading-[1.55] text-text-dim italic">
                  &quot;{promptDemo.voiceoverScript}&quot;
                </p>
              ) : (
                <p className="text-[13px] text-text-dim/60">{promptDemo.notGeneratedYet}</p>
              )}
            </div>

            <div className="mb-5 border-t border-hair pt-5">
              <p className="mb-3 text-[12.5px] font-semibold text-text">{promptDemo.picturesAssetLabel}</p>
              {maxStepReached >= 2 ? (
                <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {promptDemo.scenes.map((scene) => (
                    <div
                      key={scene.order}
                      className="relative aspect-[3/4] w-[150px] shrink-0 snap-center overflow-hidden rounded-2xl shadow-[0_10px_24px_rgba(33,30,25,0.16)]"
                      style={{ background: scene.gradient }}
                    >
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2.5">
                        <span className="text-[12px] font-semibold text-white">{scene.shotType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-dim/60">{promptDemo.notGeneratedYet}</p>
              )}
            </div>

            <div className="border-t border-hair pt-5">
              <p className="mb-3 text-[12.5px] font-semibold text-text">{promptDemo.videoAssetLabel}</p>
              {maxStepReached >= 3 ? (
                <Link href="/signup" className="group relative block overflow-hidden rounded-2xl">
                  <div className="flex aspect-video">
                    {promptDemo.scenes.map((scene) => (
                      <div key={scene.order} className="flex-1" style={{ background: scene.gradient }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 backdrop-blur-md" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/35 transition-colors group-hover:bg-black/45">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95">
                      <Lock size={18} className="text-text" />
                    </div>
                    <span className="text-[12.5px] font-semibold text-white">Sign up to view</span>
                    <span className="font-mono text-[11px] text-white/75">{totalDuration}s · 9:16</span>
                  </div>
                </Link>
              ) : (
                <p className="text-[13px] text-text-dim/60">{promptDemo.notGeneratedYet}</p>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
