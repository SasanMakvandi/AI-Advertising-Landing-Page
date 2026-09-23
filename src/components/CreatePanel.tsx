"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode, TextareaHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Captions,
  Check,
  ChevronDown,
  Loader2,
  Mic,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import type { Brief, Script } from "@/lib/generation-schemas";
import { MAX_REVISIONS } from "@/lib/generation-schemas";

type Stage = "prompt" | "extracting" | "brief" | "generating" | "done";
type PickedFile = { file: File; url: string };

const DURATION_OPTIONS = [10, 15, 20, 25, 30];
const RATIO_OPTIONS = ["9:16", "1:1", "16:9", "4:5"];
const RESOLUTION_OPTIONS = ["720p", "1080p", "4K"];

// Avoids the "useLayoutEffect does nothing on the server" warning during SSR.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const inputClass =
  "w-full rounded-xl border border-hair bg-bg px-3.5 py-2.5 text-[13.5px] text-text outline-none transition-colors placeholder:text-text-dim focus:border-accent disabled:opacity-60";

const isDev = process.env.NODE_ENV !== "production";

const MOCK_PROMPT = "A 20-second product showcase for our new ceramic pour-over coffee set";

const MOCK_THINKING = [
  "Reading the brief for concrete details — product, audience, tone...\n",
  "No explicit price given, so leaving that unset rather than guessing.\n",
  "Tone reads as warm and unhurried given the morning-ritual framing.\n",
];

const MOCK_SCRIPT_THINKING = [
  "Aiming for four ~5s scenes, roughly 20s total.\n",
  "Opening on a sensory close-up usually earns attention fastest.\n",
  "Splitting the voiceover evenly so each scene gets one clear line.\n",
];

// Claude's extended thinking is adaptive — for a short, simple request it
// often reasons silently and streams back zero thinking tokens. These cycle
// in the thinking panel as a fallback so the wait never looks empty; real
// thinking text (when the model does produce it) always takes priority.
const BRIEF_STATUS_MESSAGES = [
  "Reading your request…",
  "Identifying the product and audience…",
  "Drafting tone and selling points…",
  "Wrapping up the brief…",
];
const SCRIPT_STATUS_MESSAGES = [
  "Reviewing the brief…",
  "Blocking out scenes…",
  "Writing shot descriptions…",
  "Polishing the voiceover…",
];

const MOCK_BRIEF: Brief = {
  productName: "Ceramic Pour-Over Coffee Set",
  productDescription:
    "A hand-glazed ceramic pour-over set designed for a slower, more deliberate morning coffee ritual.",
  price: "$68",
  targetAudience: "Home coffee enthusiasts who care about craft and aesthetics, ages 25-45",
  tone: "Warm, premium, unhurried",
  keySellingPoints: [
    "Hand-glazed, one-of-a-kind ceramic finish",
    "Designed for slow, intentional brewing",
    "Looks as good on a shelf as it does in use",
  ],
  ctaIntent: "Shop now",
};

const MOCK_SCRIPT: Script = {
  voiceoverScript:
    "Some mornings deserve more than instant coffee. Meet the pour-over set built for the ritual — hand-glazed ceramic, a slow bloom, and a cup that tastes like you meant it. Available now.",
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reads an NDJSON stream of {type:"thinking",text} / {type:"result",...} /
// {type:"error",message} lines, forwarding thinking deltas live and
// resolving with the final result event.
async function streamGenerate<T extends { type: "result" }>(
  url: string,
  body: unknown,
  onThinking: (chunk: string) => void
): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(url, {
    method: "POST",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | null = null;

  function consumeLine(line: string) {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "thinking") {
      onThinking(event.text);
    } else if (event.type === "error") {
      throw new Error(event.message);
    } else {
      result = event;
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      consumeLine(line);
    }
  }
  if (buffer.trim()) consumeLine(buffer);

  if (!result) throw new Error("Stream ended unexpectedly");
  return result;
}

// A textarea that grows to fit its content (up to maxHeight) instead of
// scrolling internally — scrolling only kicks in past that cap.
function AutoTextarea({
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

  return (
    <textarea ref={ref} value={value} onChange={onChange} className={className} {...rest} />
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-hair bg-bg p-6">{children}</div>;
}

function ThinkingPanel({ text, fallback }: { text: string; fallback: string }) {
  return (
    <Panel>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-text-dim uppercase">
        <Loader2 size={12} className="animate-spin" />
        Claude is working
      </p>
      <p className="max-h-[360px] overflow-y-auto whitespace-pre-line text-[13px] leading-[1.55] text-text-dim">
        {text || fallback}
      </p>
    </Panel>
  );
}

function NextStepsPreview() {
  const steps = [
    {
      icon: Sparkles,
      label: "Brief",
      note: "We'll pull out product, audience, tone & selling points.",
    },
    { icon: Wand2, label: "Script", note: "A scene-by-scene shot list, ready to edit." },
    {
      icon: RefreshCw,
      label: "Revisions",
      note: `Up to ${MAX_REVISIONS} AI-assisted rewrites per project.`,
    },
  ];
  return (
    <Panel>
      <p className="mb-5 text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
        What happens next
      </p>
      <div className="flex flex-col gap-4">
        {steps.map((s) => (
          <div key={s.label} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <s.icon size={15} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-text">{s.label}</p>
              <p className="text-[12.5px] leading-[1.45] text-text-dim">{s.note}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function HistoryCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-hair bg-bg px-4 py-3">
      <p className="mb-1 text-[10.5px] font-semibold tracking-wide text-text-dim/70 uppercase">
        {label}
      </p>
      <p className="truncate text-[13px] leading-[1.45] text-text-dim">{children}</p>
    </div>
  );
}

function YesNoToggle({
  icon: Icon,
  label,
  value,
  onChange,
  disabled,
}: {
  icon: typeof Mic;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-hair bg-bg px-4 py-3">
      <span className="flex items-center gap-2 text-[13.5px] font-medium text-text">
        <Icon size={15} className="text-text-dim" />
        {label}
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(true)}
          className={`rounded-full border px-3.5 py-[6px] text-[12.5px] font-semibold transition-colors disabled:opacity-60 ${
            value
              ? "border-text bg-text text-bg"
              : "border-hair text-text-dim hover:border-text/30 hover:text-text"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={`rounded-full border px-3.5 py-[6px] text-[12.5px] font-semibold transition-colors disabled:opacity-60 ${
            !value
              ? "border-text bg-text text-bg"
              : "border-hair text-text-dim hover:border-text/30 hover:text-text"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function DurationStepper({
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
        className="flex h-5 w-5 items-center justify-center rounded-full text-text-dim transition-colors hover:bg-panel-2 hover:text-text disabled:opacity-30"
      >
        <Minus size={11} />
      </button>
      <span className="w-9 text-center font-mono text-[11px] text-text-dim">{value}s</span>
      <button
        type="button"
        disabled={disabled || value >= 30}
        onClick={() => onChange(Math.min(30, value + 1))}
        aria-label="Increase duration"
        className="flex h-5 w-5 items-center justify-center rounded-full text-text-dim transition-colors hover:bg-panel-2 hover:text-text disabled:opacity-30"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
  formatLabel,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  formatLabel?: (v: T) => string;
}) {
  return (
    <div>
      <span className="mb-2 block text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
        {label}
      </span>
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
                : "border-hair text-text-dim hover:border-text/30 hover:text-text"
            }`}
          >
            {formatLabel ? formatLabel(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function FileDropzone({
  label,
  hint,
  files,
  onAdd,
  onRemove,
  disabled,
}: {
  label: string;
  hint: string;
  files: PickedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className="mb-2 block text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
        {label}
      </span>
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div
              key={f.url}
              className="group relative h-16 w-16 overflow-hidden rounded-lg border border-hair"
            >
              <Image src={f.url} alt={f.file.name} fill unoptimized className="object-cover" />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onRemove(i)}
                disabled={disabled}
                className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80 disabled:opacity-60"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-hair bg-bg px-4 py-4 text-[12.5px] font-medium text-text-dim transition-colors hover:border-accent hover:text-text ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <Upload size={14} />
        {hint}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          disabled={disabled}
          onChange={(e) => {
            const picked = Array.from(e.target.files || []);
            if (picked.length) onAdd(picked);
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>
    </div>
  );
}

export function CreatePanel() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("prompt");
  const [prompt, setPrompt] = useState("");
  const [wantsVoiceover, setWantsVoiceover] = useState(true);
  const [wantsSubtitles, setWantsSubtitles] = useState(false);
  const [duration, setDuration] = useState(20);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [assetFiles, setAssetFiles] = useState<PickedFile[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resolution, setResolution] = useState("1080p");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [toneRefFiles, setToneRefFiles] = useState<PickedFile[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [thinking, setThinking] = useState("");
  const [statusIndex, setStatusIndex] = useState(0);
  const statusTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [revisionsLeft, setRevisionsLeft] = useState(MAX_REVISIONS);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [error, setError] = useState("");

  function addFiles(setter: typeof setAssetFiles, files: File[]) {
    setter((prev) => [...prev, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  function removeFile(setter: typeof setAssetFiles, index: number) {
    setter((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });
  }

  // Cycles the thinking panel's fallback status line while a real request is
  // in flight — Claude's adaptive thinking frequently streams back nothing
  // for a short task, so this keeps the wait from looking stalled.
  useEffect(() => () => stopStatusTicker(), []);

  function startStatusTicker() {
    setStatusIndex(0);
    if (statusTickerRef.current) clearInterval(statusTickerRef.current);
    statusTickerRef.current = setInterval(() => setStatusIndex((i) => i + 1), 1400);
  }

  function stopStatusTicker() {
    if (statusTickerRef.current) {
      clearInterval(statusTickerRef.current);
      statusTickerRef.current = null;
    }
  }

  function reset() {
    setStage("prompt");
    setPrompt("");
    setWantsVoiceover(true);
    setWantsSubtitles(false);
    setDuration(20);
    setAspectRatio("9:16");
    setResolution("1080p");
    setNegativePrompt("");
    setShowAdvanced(false);
    assetFiles.forEach((f) => URL.revokeObjectURL(f.url));
    toneRefFiles.forEach((f) => URL.revokeObjectURL(f.url));
    setAssetFiles([]);
    setToneRefFiles([]);
    setProjectId(null);
    setBrief(null);
    setScript(null);
    setIsMock(false);
    setThinking("");
    stopStatusTicker();
    setIsRevising(false);
    setRevisionsLeft(MAX_REVISIONS);
    setIsFinalizing(false);
    setIsFinalized(false);
    setError("");
  }

  async function handlePreview() {
    setError("");
    setIsMock(true);
    setPrompt(MOCK_PROMPT);
    setWantsVoiceover(true);
    setWantsSubtitles(false);
    setDuration(20);
    setAspectRatio("9:16");
    setResolution("1080p");
    setNegativePrompt("");
    setStage("extracting");
    setThinking("");
    for (const line of MOCK_THINKING) {
      await wait(500);
      setThinking((prev) => prev + line);
    }
    await wait(400);
    setBrief(MOCK_BRIEF);
    setStage("brief");
  }

  async function handleExtract() {
    if (!prompt.trim()) {
      setError("Tell us what you're making first.");
      return;
    }
    setError("");
    setIsMock(false);
    setStage("extracting");
    setThinking("");

    const form = new FormData();
    form.set("prompt", prompt.trim());
    form.set("wantsVoiceover", String(wantsVoiceover));
    form.set("wantsSubtitles", String(wantsSubtitles));
    form.set("duration", String(duration));
    form.set("aspectRatio", aspectRatio);
    form.set("resolution", resolution);
    if (negativePrompt.trim()) form.set("negativePrompt", negativePrompt.trim());
    assetFiles.forEach(({ file }) => form.append("assets", file));
    toneRefFiles.forEach(({ file }) => form.append("toneRefs", file));

    startStatusTicker();
    try {
      const result = await streamGenerate<{
        type: "result";
        projectId: string;
        brief: Brief;
      }>("/api/generate/brief", form, (chunk) => setThinking((prev) => prev + chunk));
      setProjectId(result.projectId);
      setBrief(result.brief);
      setStage("brief");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setStage("prompt");
    } finally {
      stopStatusTicker();
    }
  }

  async function handleConfirmBrief() {
    if (!brief) return;
    setError("");
    setStage("generating");
    setThinking("");

    if (isMock) {
      for (const line of MOCK_SCRIPT_THINKING) {
        await wait(600);
        setThinking((prev) => prev + line);
      }
      await wait(300);
      setScript(MOCK_SCRIPT);
      setRevisionsLeft(MAX_REVISIONS);
      setStage("done");
      return;
    }

    if (!projectId) return;

    startStatusTicker();
    try {
      const result = await streamGenerate<{
        type: "result";
        script: Script;
        revisionsLeft: number;
      }>("/api/generate/script", { projectId, brief }, (chunk) =>
        setThinking((prev) => prev + chunk)
      );
      setScript(result.script);
      setRevisionsLeft(result.revisionsLeft);
      setStage("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setStage("brief");
    } finally {
      stopStatusTicker();
    }
  }

  async function handleReviseScript() {
    if (!brief || !script || revisionsLeft <= 0) return;
    setError("");
    setIsRevising(true);
    setThinking("");

    if (isMock) {
      for (const line of MOCK_SCRIPT_THINKING) {
        await wait(500);
        setThinking((prev) => prev + line);
      }
      await wait(300);
      setRevisionsLeft((n) => n - 1);
      setIsRevising(false);
      return;
    }

    if (!projectId) return;

    startStatusTicker();
    try {
      const result = await streamGenerate<{
        type: "result";
        script: Script;
        revisionsLeft: number;
      }>("/api/generate/revise", { projectId, brief, script }, (chunk) =>
        setThinking((prev) => prev + chunk)
      );
      setScript(result.script);
      setRevisionsLeft(result.revisionsLeft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      stopStatusTicker();
      setIsRevising(false);
    }
  }

  async function handleFinalize() {
    if (!script) return;
    setError("");
    setIsFinalizing(true);

    if (isMock || !projectId) {
      await wait(300);
      setIsFinalized(true);
      setIsFinalizing(false);
      return;
    }

    try {
      const res = await fetch("/api/generate/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, script }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Couldn't finalize — please try again.");
      }
      setIsFinalized(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setIsFinalizing(false);
    }
  }

  function updateBrief<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateScene<K extends keyof Script["scenes"][number]>(
    index: number,
    key: K,
    value: Script["scenes"][number][K]
  ) {
    setScript((prev) => {
      if (!prev) return prev;
      const scenes = prev.scenes.map((s, i) => (i === index ? { ...s, [key]: value } : s));
      return { ...prev, scenes };
    });
  }

  const totalDuration = script?.scenes.reduce((sum, s) => sum + s.duration, 0) ?? 0;
  const scenesLocked = isRevising || isFinalized;

  return (
    <div className="rounded-[28px] border border-hair bg-panel p-8 shadow-[0_1px_2px_rgba(33,30,25,0.05),0_16px_36px_rgba(33,30,25,0.08)] sm:p-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[12px] font-semibold text-accent">
          Create
        </span>
        {isMock && stage !== "prompt" && (
          <span className="rounded-full bg-panel-2 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-text-dim uppercase">
            Preview · no tokens used
          </span>
        )}
      </div>
      <h2 className="mb-1 font-serif text-[clamp(22px,2.6vw,28px)] font-semibold tracking-tight text-text">
        New project
      </h2>
      <p className="mb-8 max-w-[560px] text-[15px] leading-[1.5] text-text-dim">
        Describe what you need — we&apos;ll turn it into a finished video.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        {/* LEFT — controls, and a running history of completed steps */}
        <div className="flex min-w-0 flex-col gap-4">
          {(stage === "prompt" || stage === "extracting") && (
            <>
              <div>
                <p className="mb-2 text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                  What are you making?
                </p>
                <AutoTextarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  maxHeight={240}
                  placeholder="e.g. A 20-second product showcase for our new ceramic mug"
                  disabled={stage === "extracting"}
                  className="w-full resize-none overflow-hidden rounded-xl border border-hair bg-bg px-4 py-3.5 text-[15.5px] leading-[1.5] text-text outline-none transition-colors focus:border-accent disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ChipGroup
                  label="Length"
                  options={DURATION_OPTIONS}
                  value={duration}
                  onChange={setDuration}
                  disabled={stage === "extracting"}
                  formatLabel={(v) => `${v}s`}
                />
                <ChipGroup
                  label="Ratio"
                  options={RATIO_OPTIONS}
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  disabled={stage === "extracting"}
                />
              </div>

              <FileDropzone
                label="Product photos (optional)"
                hint="Upload reference photos"
                files={assetFiles}
                onAdd={(files) => addFiles(setAssetFiles, files)}
                onRemove={(i) => removeFile(setAssetFiles, i)}
                disabled={stage === "extracting"}
              />

              <YesNoToggle
                icon={Mic}
                label="Needs voiceover?"
                value={wantsVoiceover}
                disabled={stage === "extracting"}
                onChange={(v) => {
                  setWantsVoiceover(v);
                  if (!v) setWantsSubtitles(false);
                }}
              />
              {wantsVoiceover && (
                <YesNoToggle
                  icon={Captions}
                  label="Include subtitles?"
                  value={wantsSubtitles}
                  disabled={stage === "extracting"}
                  onChange={setWantsSubtitles}
                />
              )}

              <div className="overflow-hidden rounded-xl border border-hair bg-bg">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  disabled={stage === "extracting"}
                  className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold text-text disabled:opacity-60"
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
                  <div className="flex flex-col gap-4 border-t border-hair px-4 py-4">
                    <ChipGroup
                      label="Resolution"
                      options={RESOLUTION_OPTIONS}
                      value={resolution}
                      onChange={setResolution}
                      disabled={stage === "extracting"}
                    />
                    <div>
                      <label className="mb-2 block text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                        Negative prompt
                      </label>
                      <AutoTextarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        rows={2}
                        maxHeight={140}
                        placeholder="Anything to avoid — e.g. text overlays, fast cuts, competitor branding"
                        disabled={stage === "extracting"}
                        className={`${inputClass} resize-none overflow-hidden`}
                      />
                    </div>
                    <FileDropzone
                      label="Tone reference images (optional)"
                      hint="Upload mood/style references"
                      files={toneRefFiles}
                      onAdd={(files) => addFiles(setToneRefFiles, files)}
                      onRemove={(i) => removeFile(setToneRefFiles, i)}
                      disabled={stage === "extracting"}
                    />
                  </div>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={stage === "extracting"}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-text px-[22px] py-3 text-[14px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-70"
                >
                  {stage === "extracting" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Reading your brief...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>

                {isDev && stage === "prompt" && (
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-text-dim hover:text-text"
                  >
                    <Wand2 size={13} />
                    Preview with sample data — no tokens used
                  </button>
                )}
              </div>
            </>
          )}

          {(stage === "brief" || stage === "generating") && brief && (
            <>
              <HistoryCard label="Your request">{prompt}</HistoryCard>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-text-dim uppercase">
                  Confirm the brief
                </p>
                <p className="text-[13px] leading-[1.5] text-text-dim">
                  Review what Claude picked up on the right — edit anything, then continue.
                </p>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={stage === "generating"}
                  className="inline-flex items-center justify-center rounded-full border border-hair px-4 py-2.5 text-[13px] font-semibold text-text-dim transition-colors hover:border-text/30 hover:text-text disabled:opacity-60"
                >
                  Start over
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBrief}
                  disabled={stage === "generating"}
                  className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-text px-4 py-2.5 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-70"
                >
                  {stage === "generating" ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Writing script...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Confirm &amp; generate script
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {stage === "done" && script && (
            <>
              <HistoryCard label="Your request">{prompt}</HistoryCard>
              {brief && (
                <HistoryCard label="Brief">
                  {brief.productName} — {brief.productDescription}
                </HistoryCard>
              )}

              <div className="flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2.5 text-[13.5px] font-semibold text-accent">
                <Sparkles size={16} />
                {isMock
                  ? "This is a preview — nothing was saved"
                  : isFinalized
                    ? "Finalized"
                    : "Added to your gallery"}
              </div>

              <p className="text-[13px] leading-[1.5] text-text-dim">
                {isFinalized
                  ? "This script is locked in. Start a new project to keep iterating."
                  : "Edit any scene on the right, then revise with Claude or finalize when you're happy."}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={reset}
                  disabled={isRevising}
                  className="inline-flex items-center justify-center rounded-full border border-hair px-4 py-2.5 text-[13px] font-semibold text-text-dim transition-colors hover:border-text/30 hover:text-text disabled:opacity-60"
                >
                  Create another
                </button>

                {!isFinalized && (
                  <button
                    type="button"
                    onClick={handleReviseScript}
                    disabled={isRevising || revisionsLeft <= 0}
                    className="group inline-flex items-center gap-2 rounded-full bg-text px-4 py-2.5 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-70"
                  >
                    {isRevising ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    {isRevising
                      ? "Revising..."
                      : revisionsLeft > 0
                        ? `Revise (${revisionsLeft} left)`
                        : "No revisions left"}
                  </button>
                )}

                {!isFinalized ? (
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={isRevising || isFinalizing}
                    className="group inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#ff7455] disabled:opacity-70"
                  >
                    {isFinalizing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    {isFinalizing ? "Finalizing..." : "Looks good — finalize"}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
                    <Check size={15} /> Script finalized
                  </span>
                )}
              </div>
            </>
          )}

          {error && <p className="text-[13px] text-coral">{error}</p>}
        </div>

        {/* RIGHT — whatever is actively being worked on right now */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          {stage === "prompt" && <NextStepsPreview />}
          {stage === "extracting" && (
            <ThinkingPanel
              text={thinking}
              fallback={BRIEF_STATUS_MESSAGES[statusIndex % BRIEF_STATUS_MESSAGES.length]}
            />
          )}

          {stage === "brief" && brief && (
            <Panel>
              <p className="mb-4 text-[11px] font-semibold tracking-wide text-text-dim uppercase">
                Brief details
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-[11px] text-text-dim">Product / subject</label>
                  <input
                    value={brief.productName}
                    onChange={(e) => updateBrief("productName", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] text-text-dim">Description</label>
                  <AutoTextarea
                    value={brief.productDescription}
                    onChange={(e) => updateBrief("productDescription", e.target.value)}
                    rows={2}
                    maxHeight={200}
                    className={`${inputClass} resize-none overflow-hidden`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] text-text-dim">Target audience</label>
                  <input
                    value={brief.targetAudience}
                    onChange={(e) => updateBrief("targetAudience", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-text-dim">Tone</label>
                    <input
                      value={brief.tone}
                      onChange={(e) => updateBrief("tone", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-text-dim">After watching</label>
                    <input
                      value={brief.ctaIntent}
                      onChange={(e) => updateBrief("ctaIntent", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] text-text-dim">
                    Selling points (one per line)
                  </label>
                  <AutoTextarea
                    value={brief.keySellingPoints.join("\n")}
                    onChange={(e) =>
                      updateBrief(
                        "keySellingPoints",
                        e.target.value.split("\n").filter((line) => line.trim().length > 0)
                      )
                    }
                    rows={3}
                    maxHeight={220}
                    className={`${inputClass} resize-none overflow-hidden`}
                  />
                </div>
              </div>
            </Panel>
          )}

          {stage === "generating" && (
            <ThinkingPanel
              text={thinking}
              fallback={SCRIPT_STATUS_MESSAGES[statusIndex % SCRIPT_STATUS_MESSAGES.length]}
            />
          )}

          {stage === "done" && script && (
            <>
              {isRevising && (
                <ThinkingPanel
                  text={thinking}
                  fallback={SCRIPT_STATUS_MESSAGES[statusIndex % SCRIPT_STATUS_MESSAGES.length]}
                />
              )}

              <Panel>
                {script.voiceoverScript !== null ? (
                  <div className="mb-5">
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-text-dim uppercase">
                      Voiceover script
                    </p>
                    <AutoTextarea
                      value={script.voiceoverScript}
                      onChange={(e) =>
                        setScript((prev) =>
                          prev ? { ...prev, voiceoverScript: e.target.value } : prev
                        )
                      }
                      disabled={scenesLocked}
                      rows={3}
                      maxHeight={200}
                      className={`${inputClass} resize-none overflow-hidden italic`}
                    />
                  </div>
                ) : (
                  <div className="mb-5 rounded-lg border border-dashed border-hair px-3.5 py-2.5 text-[12.5px] text-text-dim">
                    No voiceover for this video — visual only.
                  </div>
                )}

                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold tracking-wide text-text-dim uppercase">
                    Scenes
                  </p>
                  <span className="font-mono text-[11.5px] text-text-dim">
                    {totalDuration}s total
                  </span>
                </div>
                <p className="mb-3 text-[12px] leading-[1.5] text-text-dim">
                  Every field below is editable — shot type, duration, description, voiceover.
                  Changes apply next time you revise.
                </p>

                <div className="flex flex-col gap-2.5">
                  {script.scenes.map((scene, i) => (
                    <div
                      key={scene.order}
                      className={`rounded-xl border border-hair bg-panel p-3 transition-opacity ${
                        scenesLocked ? "opacity-60" : ""
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-accent">
                          {String(scene.order).padStart(2, "0")}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] font-semibold tracking-wide text-text-dim/70 uppercase">
                            Shot type
                          </label>
                          <div className="relative">
                            <input
                              value={scene.shotType}
                              onChange={(e) => updateScene(i, "shotType", e.target.value)}
                              disabled={scenesLocked}
                              className="w-32 rounded-full border border-hair bg-bg py-1 pr-6 pl-2.5 text-[11px] font-semibold tracking-wide text-accent uppercase outline-none focus:border-accent disabled:opacity-60"
                            />
                            <Pencil
                              size={10}
                              className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-accent/50"
                            />
                          </div>
                        </div>
                        <div className="ml-auto">
                          <DurationStepper
                            value={scene.duration}
                            onChange={(v) => updateScene(i, "duration", v)}
                            disabled={scenesLocked}
                          />
                        </div>
                      </div>
                      <AutoTextarea
                        value={scene.description}
                        onChange={(e) => updateScene(i, "description", e.target.value)}
                        disabled={scenesLocked}
                        rows={2}
                        maxHeight={160}
                        placeholder="What's happening in this shot"
                        className="mb-1.5 w-full resize-none overflow-hidden rounded-lg border border-hair bg-bg px-2.5 py-2 text-[13px] leading-[1.5] text-text-dim outline-none transition-colors placeholder:text-text-dim/60 focus:border-accent disabled:opacity-60"
                      />
                      {scene.voiceover !== null && (
                        <AutoTextarea
                          value={scene.voiceover}
                          onChange={(e) => updateScene(i, "voiceover", e.target.value)}
                          disabled={scenesLocked}
                          rows={1}
                          maxHeight={140}
                          placeholder="Voiceover line for this scene"
                          className="w-full resize-none overflow-hidden rounded-lg border border-hair bg-bg px-2.5 py-2 text-[12.5px] leading-[1.5] text-text-dim italic outline-none transition-colors placeholder:text-text-dim/60 placeholder:not-italic focus:border-accent disabled:opacity-60"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
