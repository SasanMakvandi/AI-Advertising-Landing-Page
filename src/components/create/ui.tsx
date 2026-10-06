"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode, TextareaHTMLAttributes } from "react";
import Image from "next/image";
import { Download, Loader2, Minus, Plus, Upload, X } from "lucide-react";
import { PEOPLE_TIP, reviewText } from "@/lib/content-review";
import type { PickedFile } from "./types";
import { downloadHref } from "./api";

// Avoids the "useLayoutEffect does nothing on the server" warning during SSR.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const inputClass =
  "w-full rounded-xl border border-hair bg-panel px-3.5 py-2.5 text-[13.5px] text-text outline-none transition-colors placeholder:text-text-dim/70 focus:border-accent disabled:opacity-60";

export const btnPrimary =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-text px-5 py-2.5 text-[13.5px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-hair px-4 py-2.5 text-[13px] font-semibold text-text-dim transition-colors hover:border-text/30 hover:text-text disabled:opacity-60";
export const btnAccent =
  "inline-flex items-center justify-center gap-2 rounded-full bg-coral px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#ff7455] disabled:opacity-60";

// A textarea that grows to fit its content (up to maxHeight) instead of
// scrolling internally; scrolling only kicks in past that cap.
export function AutoTextarea({
  value,
  onChange,
  className,
  maxHeight = 320,
  ...rest
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  maxHeight?: number;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, maxHeight]);

  return <textarea ref={ref} value={value} onChange={onChange} className={className} {...rest} />;
}

// Blob images can 404 for a moment right after upload, or drop on a flaky
// connection. Instead of leaving a blank tile, retry a few times with a
// cache-busting query, then offer a manual retry.
export function RetryImage({
  src,
  alt,
  className = "object-cover",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAttempt(0);
    setLoaded(false);
    setFailed(false);
  }, [src]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleError() {
    if (attempt >= 3) {
      setFailed(true);
      return;
    }
    timer.current = setTimeout(() => setAttempt((a) => a + 1), 1000 * (attempt + 1));
  }

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-panel-2 text-center">
        <p className="px-3 text-[12px] text-text-dim">Image didn&apos;t load</p>
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setLoaded(false);
            setAttempt((a) => a + 1);
          }}
          className="rounded-full border border-hair bg-panel px-3 py-1 text-[12px] font-semibold text-text-dim hover:text-text"
        >
          Try again
        </button>
      </div>
    );
  }

  const url = attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}r=${attempt}`;
  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-panel-2" />}
      <Image
        key={attempt}
        src={url}
        alt={alt}
        fill
        unoptimized
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={className}
      />
    </>
  );
}

// Heads-up about wording the image or video model is likely to reject.
export function ContentNotice({ text, compact = false }: { text: string; compact?: boolean }) {
  const flags = reviewText(text);
  if (flags.length === 0) return null;
  const cautions = flags.filter((f) => f.severity === "caution");
  const people = flags.find((f) => f.severity === "tip");
  return (
    <div
      className={`rounded-lg border border-coral/30 bg-coral/5 text-[12px] leading-[1.5] text-coral ${
        compact ? "mt-2 px-3 py-2" : "mt-3 px-3.5 py-2.5"
      }`}
    >
      {cautions.map((f) => (
        <p key={f.label}>
          <span className="font-semibold">{f.label}:</span> &quot;{f.matches.join(", ")}&quot; may be
          rejected by the image or video model.
        </p>
      ))}
      {people && (
        <p>
          <span className="font-semibold">{people.label}:</span> &quot;{people.matches.join(", ")}
          &quot;. {PEOPLE_TIP}
        </p>
      )}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-hair bg-bg p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function SectionLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <p className="mb-3 flex items-baseline gap-2 text-[11px] font-semibold tracking-wide text-text-dim uppercase">
      {children}
      {hint && <span className="font-medium tracking-normal normal-case text-text-dim/70">{hint}</span>}
    </p>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-[11.5px] font-medium text-text-dim">{children}</label>;
}

export function ThinkingPanel({ text, fallback }: { text: string; fallback: string }) {
  return (
    <Panel>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-text-dim uppercase">
        <Loader2 size={12} className="animate-spin" />
        Claude is working
      </p>
      <p className="max-h-[260px] overflow-y-auto whitespace-pre-line text-[13px] leading-[1.55] text-text-dim">
        {text || fallback}
      </p>
    </Panel>
  );
}

export function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
  formatLabel,
}: {
  label?: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  formatLabel?: (v: T) => string;
}) {
  return (
    <div>
      {label && (
        <span className="mb-2 block text-[11.5px] font-medium text-text-dim">{label}</span>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors disabled:opacity-60 ${
              value === opt
                ? "border-text bg-text text-bg"
                : "border-hair bg-panel text-text-dim hover:border-text/30 hover:text-text"
            }`}
          >
            {formatLabel ? formatLabel(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function YesNoToggle({
  icon: Icon,
  label,
  value,
  onChange,
  disabled,
}: {
  icon: typeof Upload;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-[6px] text-[12.5px] font-semibold transition-colors disabled:opacity-60 ${
      active
        ? "border-text bg-text text-bg"
        : "border-hair text-text-dim hover:border-text/30 hover:text-text"
    }`;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-hair bg-panel px-4 py-3">
      <span className="flex items-center gap-2 text-[13.5px] font-medium text-text">
        <Icon size={15} className="text-text-dim" />
        {label}
      </span>
      <div className="flex gap-1.5">
        <button type="button" disabled={disabled} onClick={() => onChange(true)} className={pill(value)}>
          Yes
        </button>
        <button type="button" disabled={disabled} onClick={() => onChange(false)} className={pill(!value)}>
          No
        </button>
      </div>
    </div>
  );
}

export function DurationStepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-hair bg-panel p-0.5">
      <button
        type="button"
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Decrease duration"
        className="flex h-6 w-6 items-center justify-center rounded-full text-text-dim transition-colors hover:bg-panel-2 hover:text-text disabled:opacity-30"
      >
        <Minus size={12} />
      </button>
      <span className="w-9 text-center font-mono text-[12px] text-text">{value}s</span>
      <button
        type="button"
        disabled={disabled || value >= 30}
        onClick={() => onChange(Math.min(30, value + 1))}
        aria-label="Increase duration"
        className="flex h-6 w-6 items-center justify-center rounded-full text-text-dim transition-colors hover:bg-panel-2 hover:text-text disabled:opacity-30"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

export function FileDropzone({
  hint,
  files,
  existingUrls = [],
  onAdd,
  onRemove,
  disabled,
}: {
  hint: string;
  files: PickedFile[];
  existingUrls?: string[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  const thumb = "group relative h-16 w-16 overflow-hidden rounded-lg border border-hair";
  return (
    <div>
      {(existingUrls.length > 0 || files.length > 0) && (
        <div className="mb-2 flex flex-wrap gap-2">
          {existingUrls.map((u) => (
            <div key={u} className={thumb}>
              <Image src={u} alt="Uploaded reference" fill unoptimized className="object-cover" />
            </div>
          ))}
          {files.map((f, i) => (
            <div key={f.url} className={thumb}>
              <Image src={f.url} alt={f.file.name} fill unoptimized className="object-cover" />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onRemove(i)}
                disabled={disabled}
                className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-60"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      {!disabled && (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-hair bg-panel px-4 py-4 text-[12.5px] font-medium text-text-dim transition-colors hover:border-accent hover:text-text">
          <Upload size={14} />
          {hint}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => {
              const picked = Array.from(e.target.files || []);
              if (picked.length) onAdd(picked);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

// Full-size view of a generated image, with download. Click outside, press
// Escape, or use Close to dismiss it.
export function Lightbox({
  src,
  alt,
  downloadName,
  isMock,
  onClose,
}: {
  src: string;
  alt: string;
  downloadName: string;
  isMock?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-4xl flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-square max-h-[78vh] w-full overflow-hidden rounded-2xl bg-black">
          {isMock ? (
            <div className="h-full w-full" style={{ background: src }} />
          ) : (
            <RetryImage src={src} alt={alt} className="object-contain" />
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          {isMock ? (
            <span className="text-[12.5px] text-white/70">Preview image (nothing to download)</span>
          ) : (
            <a
              href={downloadHref(src, downloadName)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-white/90"
            >
              <Download size={14} />
              Download
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            <X size={14} />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
