"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, RefreshCw } from "lucide-react";
import type { Brief } from "@/lib/generation-schemas";
import { SCRIPT_STATUS_MESSAGES } from "./constants";
import {
  AutoTextarea,
  FieldLabel,
  Panel,
  SectionLabel,
  ThinkingPanel,
  btnPrimary,
  btnSecondary,
  inputClass,
} from "./ui";

export function BriefStep({
  brief,
  onChange,
  hasScript,
  isWriting,
  locked,
  thinking,
  statusIndex,
  onGenerateScript,
  onNext,
  onBack,
}: {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
  hasScript: boolean;
  isWriting: boolean;
  locked: boolean;
  thinking: string;
  statusIndex: number;
  onGenerateScript: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const disabled = locked || isWriting;

  return (
    <div>
      <p className="mb-5 max-w-[640px] text-[14px] leading-[1.55] text-text-dim">
        This is what Claude picked up from your request. Edit anything that&apos;s off. The
        product name becomes the name of your project.
      </p>

      <Panel>
        <SectionLabel>Brief details</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Product / project name</FieldLabel>
            <input
              value={brief.productName}
              onChange={(e) => onChange({ productName: e.target.value })}
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Target audience</FieldLabel>
            <input
              value={brief.targetAudience}
              onChange={(e) => onChange({ targetAudience: e.target.value })}
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <AutoTextarea
              value={brief.productDescription}
              onChange={(e) => onChange({ productDescription: e.target.value })}
              rows={2}
              maxHeight={200}
              disabled={disabled}
              className={`${inputClass} resize-none overflow-hidden`}
            />
          </div>
          <div>
            <FieldLabel>Tone</FieldLabel>
            <input
              value={brief.tone}
              onChange={(e) => onChange({ tone: e.target.value })}
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>After watching</FieldLabel>
            <input
              value={brief.ctaIntent}
              onChange={(e) => onChange({ ctaIntent: e.target.value })}
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Selling points (one per line)</FieldLabel>
            <AutoTextarea
              value={brief.keySellingPoints.join("\n")}
              onChange={(e) => onChange({ keySellingPoints: e.target.value.split("\n") })}
              rows={3}
              maxHeight={220}
              disabled={disabled}
              className={`${inputClass} resize-none overflow-hidden`}
            />
          </div>
        </div>
      </Panel>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack} disabled={isWriting} className={btnSecondary}>
          <ArrowLeft size={14} />
          Back
        </button>

        {!hasScript ? (
          <button type="button" onClick={onGenerateScript} disabled={isWriting || locked} className={btnPrimary}>
            {isWriting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Writing script…
              </>
            ) : (
              <>
                <Check size={15} />
                Confirm and write script
              </>
            )}
          </button>
        ) : (
          <>
            <button type="button" onClick={onNext} disabled={isWriting} className={btnPrimary}>
              Continue to script
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            {!locked && (
              <button type="button" onClick={onGenerateScript} disabled={isWriting} className={btnSecondary}>
                {isWriting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {isWriting ? "Writing script…" : "Rewrite script from this brief"}
              </button>
            )}
          </>
        )}
      </div>

      {isWriting && (
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
