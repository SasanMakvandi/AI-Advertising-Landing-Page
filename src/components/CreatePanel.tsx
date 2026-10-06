"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { Brief, Script, ScriptWithImages } from "@/lib/generation-schemas";
import { FREE_IMAGE_REGENS, MAX_REVISIONS } from "@/lib/generation-schemas";
import { Stepper } from "./create/Stepper";
import { DescribeStep } from "./create/DescribeStep";
import { BriefStep } from "./create/BriefStep";
import { ScriptStep } from "./create/ScriptStep";
import { ImagesStep } from "./create/ImagesStep";
import { VideoStep } from "./create/VideoStep";
import {
  deriveStep,
  type DescribeForm,
  type InitialProject,
  type StepId,
} from "./create/types";
import {
  MOCK_BRIEF,
  MOCK_IMAGE_GRADIENTS,
  MOCK_PROMPT,
  MOCK_SCRIPT,
  MOCK_SCRIPT_THINKING,
  MOCK_THINKING,
  normalizeResolution,
} from "./create/constants";
import { streamGenerate, wait } from "./create/api";

type Scene = ScriptWithImages["scenes"][number];

function emptyForm(): DescribeForm {
  return {
    prompt: "",
    wantsVoiceover: true,
    wantsSubtitles: false,
    duration: 20,
    aspectRatio: "9:16",
    resolution: "480p",
    negativePrompt: "",
    assetFiles: [],
    toneRefFiles: [],
  };
}

// Blank lines are fine while typing selling points, but never worth saving.
function cleanBrief(b: Brief): Brief {
  return { ...b, keySellingPoints: b.keySellingPoints.map((s) => s.trim()).filter(Boolean) };
}

function renumber(scenes: Scene[]): Scene[] {
  return scenes.map((s, i) => ({ ...s, order: i + 1 }));
}

export function CreatePanel({ initialProject = null }: { initialProject?: InitialProject | null }) {
  const router = useRouter();
  const init = initialProject;
  const startStep = deriveStep(init?.brief ?? null, init?.script ?? null);

  const [form, setForm] = useState<DescribeForm>(() =>
    init
      ? {
          prompt: init.prompt,
          wantsVoiceover: init.wantsVoiceover,
          wantsSubtitles: init.wantsSubtitles,
          duration: init.duration,
          aspectRatio: init.aspectRatio,
          resolution: normalizeResolution(init.resolution),
          negativePrompt: init.negativePrompt ?? "",
          assetFiles: [],
          toneRefFiles: [],
        }
      : emptyForm()
  );
  const [projectId, setProjectId] = useState<string | null>(init?.id ?? null);
  const [assetUrls, setAssetUrls] = useState<string[]>(init?.assetUrls ?? []);
  const [toneUrls, setToneUrls] = useState<string[]>(init?.toneReferenceUrls ?? []);
  const [brief, setBrief] = useState<Brief | null>(init?.brief ?? null);
  const [script, setScript] = useState<ScriptWithImages | null>(init?.script ?? null);
  const [isMock, setIsMock] = useState(false);
  const [revisionsLeft, setRevisionsLeft] = useState(
    Math.max(0, MAX_REVISIONS - (init?.revisionCount ?? 0))
  );
  const [isFinalized, setIsFinalized] = useState(init?.status === "finalized");
  const [step, setStep] = useState<StepId>(startStep);
  const [maxVisited, setMaxVisited] = useState<StepId>(startStep);

  const [isExtracting, setIsExtracting] = useState(false);
  const [isWritingScript, setIsWritingScript] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState({ done: 0, total: 0 });
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [isStitching, setIsStitching] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [thinking, setThinking] = useState("");
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState("");

  const statusTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollBusyRef = useRef(false);
  const dirtyRef = useRef({ brief: false, script: false });

  const busy =
    isExtracting ||
    isWritingScript ||
    isRevising ||
    isGeneratingImages ||
    regeneratingIndex !== null ||
    isGeneratingVideos ||
    isStitching ||
    isFinalizing;

  function updateForm(patch: Partial<DescribeForm>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function showStep(id: StepId) {
    setStep(id);
    setMaxVisited((m) => (id > m ? id : m));
    setError("");
  }

  function canReach(id: StepId) {
    if (id === 1) return true;
    if (id === 2) return !!brief;
    return !!script;
  }

  function goToStep(id: StepId) {
    if (busy || !canReach(id)) return;
    showStep(id);
  }

  // Cycles the working panel's fallback line while a Claude request runs.
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

  function stopVideoPolling() {
    if (videoPollRef.current) {
      clearInterval(videoPollRef.current);
      videoPollRef.current = null;
    }
  }

  useEffect(
    () => () => {
      stopStatusTicker();
      stopVideoPolling();
    },
    []
  );

  // Picking a saved project back up while its video is still rendering.
  useEffect(() => {
    if (init?.script?.scenes.some((s) => s.videoJobId)) startVideoPolling(init.id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave edits to the brief and script so a project can be resumed from
  // the gallery exactly as it was left.
  useEffect(() => {
    if (!projectId || isMock || isFinalized || busy) return;
    const dirty = dirtyRef.current;
    if (!dirty.brief && !dirty.script) return;
    const timer = setTimeout(() => {
      const payload: Record<string, unknown> = { projectId };
      if (dirty.brief && brief) payload.brief = cleanBrief(brief);
      if (dirty.script && script) payload.script = script;
      dirtyRef.current = { brief: false, script: false };
      fetch("/api/projects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => {
          if (dirty.brief) router.refresh();
        })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [brief, script, busy, projectId, isMock, isFinalized, router]);

  function startNew() {
    if (init) {
      router.push("/dashboard");
      return;
    }
    form.assetFiles.forEach((f) => URL.revokeObjectURL(f.url));
    form.toneRefFiles.forEach((f) => URL.revokeObjectURL(f.url));
    stopStatusTicker();
    stopVideoPolling();
    dirtyRef.current = { brief: false, script: false };
    setForm(emptyForm());
    setProjectId(null);
    setAssetUrls([]);
    setToneUrls([]);
    setBrief(null);
    setScript(null);
    setIsMock(false);
    setRevisionsLeft(MAX_REVISIONS);
    setIsFinalized(false);
    setStep(1);
    setMaxVisited(1);
    setIsExtracting(false);
    setIsWritingScript(false);
    setIsRevising(false);
    setIsGeneratingImages(false);
    setRegeneratingIndex(null);
    setIsGeneratingVideos(false);
    setIsStitching(false);
    setIsFinalizing(false);
    setImageProgress({ done: 0, total: 0 });
    setThinking("");
    setError("");
  }

  // ---------------------------------------------------------------- step 1

  async function handlePreview() {
    setError("");
    setIsMock(true);
    updateForm({
      prompt: MOCK_PROMPT,
      wantsVoiceover: true,
      wantsSubtitles: false,
      duration: 20,
      aspectRatio: "9:16",
      resolution: "480p",
      negativePrompt: "",
    });
    setIsExtracting(true);
    setThinking("");
    for (const line of MOCK_THINKING) {
      await wait(500);
      setThinking((prev) => prev + line);
    }
    await wait(400);
    setBrief(MOCK_BRIEF);
    setIsExtracting(false);
    showStep(2);
  }

  async function handleExtract() {
    if (!form.prompt.trim()) {
      setError("Tell us what you're making first.");
      return;
    }
    setError("");
    setIsMock(false);
    setIsExtracting(true);
    setThinking("");

    const data = new FormData();
    data.set("prompt", form.prompt.trim());
    data.set("wantsVoiceover", String(form.wantsVoiceover));
    data.set("wantsSubtitles", String(form.wantsSubtitles));
    data.set("duration", String(form.duration));
    data.set("aspectRatio", form.aspectRatio);
    data.set("resolution", form.resolution);
    if (form.negativePrompt.trim()) data.set("negativePrompt", form.negativePrompt.trim());
    form.assetFiles.forEach(({ file }) => data.append("assets", file));
    form.toneRefFiles.forEach(({ file }) => data.append("toneRefs", file));

    startStatusTicker();
    try {
      const result = await streamGenerate<{
        type: "result";
        projectId: string;
        brief: Brief;
        assetUrls: string[];
        toneReferenceUrls: string[];
      }>("/api/generate/brief", data, (chunk) => setThinking((prev) => prev + chunk));
      form.assetFiles.forEach((f) => URL.revokeObjectURL(f.url));
      form.toneRefFiles.forEach((f) => URL.revokeObjectURL(f.url));
      updateForm({ assetFiles: [], toneRefFiles: [] });
      setAssetUrls(result.assetUrls ?? []);
      setToneUrls(result.toneReferenceUrls ?? []);
      setProjectId(result.projectId);
      setBrief(result.brief);
      showStep(2);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      stopStatusTicker();
      setIsExtracting(false);
    }
  }

  // ---------------------------------------------------------------- step 2

  function updateBrief(patch: Partial<Brief>) {
    setBrief((b) => (b ? { ...b, ...patch } : b));
    dirtyRef.current = { ...dirtyRef.current, brief: true };
  }

  async function handleGenerateScript() {
    if (!brief) return;
    if (
      script &&
      !window.confirm(
        "This replaces your current script (including any edits) and clears generated images and video. Continue?"
      )
    ) {
      return;
    }
    setError("");
    setIsWritingScript(true);
    setThinking("");

    if (isMock) {
      for (const line of MOCK_SCRIPT_THINKING) {
        await wait(600);
        setThinking((prev) => prev + line);
      }
      await wait(300);
      setScript(structuredClone(MOCK_SCRIPT));
      setRevisionsLeft(MAX_REVISIONS);
      setIsWritingScript(false);
      showStep(3);
      return;
    }

    if (!projectId) {
      setIsWritingScript(false);
      return;
    }

    startStatusTicker();
    try {
      const cleaned = cleanBrief(brief);
      const result = await streamGenerate<{
        type: "result";
        script: Script;
        revisionsLeft: number;
      }>("/api/generate/script", { projectId, brief: cleaned }, (chunk) =>
        setThinking((prev) => prev + chunk)
      );
      dirtyRef.current = { brief: false, script: false };
      setBrief(cleaned);
      setScript(result.script);
      setRevisionsLeft(result.revisionsLeft);
      showStep(3);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      stopStatusTicker();
      setIsWritingScript(false);
    }
  }

  // ---------------------------------------------------------------- step 3

  function editScript(fn: (s: ScriptWithImages) => ScriptWithImages) {
    setScript((prev) => (prev ? fn(prev) : prev));
    dirtyRef.current = { ...dirtyRef.current, script: true };
  }

  function updateScene<K extends keyof Scene>(index: number, key: K, value: Scene[K]) {
    editScript((s) => ({
      ...s,
      scenes: s.scenes.map((sc, i) => (i === index ? { ...sc, [key]: value } : sc)),
    }));
  }

  function moveScene(index: number, direction: -1 | 1) {
    editScript((s) => {
      const target = index + direction;
      if (target < 0 || target >= s.scenes.length) return s;
      const scenes = [...s.scenes];
      [scenes[index], scenes[target]] = [scenes[target], scenes[index]];
      return { ...s, scenes: renumber(scenes) };
    });
  }

  function addScene() {
    editScript((s) => ({
      ...s,
      scenes: renumber([
        ...s.scenes,
        {
          order: s.scenes.length + 1,
          shotType: "",
          duration: 5,
          description: "",
          voiceover: s.voiceoverScript === null ? null : "",
        },
      ]),
    }));
  }

  function removeScene(index: number) {
    editScript((s) =>
      s.scenes.length <= 1 ? s : { ...s, scenes: renumber(s.scenes.filter((_, i) => i !== index)) }
    );
  }

  async function handleRevise() {
    if (!brief || !script || revisionsLeft <= 0) return;
    const hasAssets =
      !!script.finalVideoUrl || script.scenes.some((s) => s.imageUrl || s.videoUrl || s.videoJobId);
    if (
      hasAssets &&
      !window.confirm(
        "Revising replaces your scenes and clears the images and video you've generated. Continue?"
      )
    ) {
      return;
    }
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

    if (!projectId) {
      setIsRevising(false);
      return;
    }

    startStatusTicker();
    try {
      const result = await streamGenerate<{
        type: "result";
        script: Script;
        revisionsLeft: number;
      }>("/api/generate/revise", { projectId, brief: cleanBrief(brief), script }, (chunk) =>
        setThinking((prev) => prev + chunk)
      );
      dirtyRef.current = { ...dirtyRef.current, script: false };
      setScript(result.script);
      setRevisionsLeft(result.revisionsLeft);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      stopStatusTicker();
      setIsRevising(false);
    }
  }

  // ---------------------------------------------------------------- step 4

  async function handleGenerateImages() {
    if (!script) return;
    setError("");
    setIsGeneratingImages(true);
    setImageProgress({ done: 0, total: script.scenes.length });

    if (isMock) {
      for (let i = 0; i < script.scenes.length; i++) {
        await wait(700);
        const gradient = MOCK_IMAGE_GRADIENTS[i % MOCK_IMAGE_GRADIENTS.length];
        setScript((prev) =>
          prev
            ? {
                ...prev,
                scenes: prev.scenes.map((s, idx) => (idx === i ? { ...s, imageUrl: gradient } : s)),
              }
            : prev
        );
        setImageProgress({ done: i + 1, total: script.scenes.length });
      }
      setIsGeneratingImages(false);
      return;
    }

    if (!projectId) {
      setIsGeneratingImages(false);
      return;
    }

    try {
      const result = await streamGenerate<{ type: "result"; script: ScriptWithImages }>(
        "/api/generate/images",
        { projectId, script },
        () => {},
        (event) => {
          const index = (event.done as number) - 1;
          const imageUrl = event.imageUrl as string;
          setImageProgress({ done: event.done as number, total: event.total as number });
          setScript((prev) =>
            prev
              ? {
                  ...prev,
                  scenes: prev.scenes.map((s, i) => (i === index ? { ...s, imageUrl } : s)),
                }
              : prev
          );
        }
      );
      dirtyRef.current = { ...dirtyRef.current, script: false };
      setScript(result.script);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't generate reference images. Please try again."
      );
    } finally {
      setIsGeneratingImages(false);
    }
  }

  // Regenerates one scene's image from its edited description. Each scene
  // gets one free regeneration; the server enforces that from its own copy.
  async function handleRegenerateImage(index: number) {
    if (!script) return;
    const scene = script.scenes[index];
    if (!scene?.imageUrl || (scene.imageRegens ?? 0) >= FREE_IMAGE_REGENS) return;
    setError("");
    setRegeneratingIndex(index);

    if (isMock) {
      await wait(900);
      const gradient = MOCK_IMAGE_GRADIENTS[(index + 1) % MOCK_IMAGE_GRADIENTS.length];
      setScript((prev) =>
        prev
          ? {
              ...prev,
              scenes: prev.scenes.map((s, i) =>
                i === index ? { ...s, imageUrl: gradient, imageRegens: (s.imageRegens ?? 0) + 1 } : s
              ),
            }
          : prev
      );
      setRegeneratingIndex(null);
      return;
    }

    if (!projectId) {
      setRegeneratingIndex(null);
      return;
    }

    try {
      const res = await fetch("/api/generate/images/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, script, sceneIndex: index }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't regenerate this image. Please try again.");
      dirtyRef.current = { ...dirtyRef.current, script: false };
      setScript(body.script);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't regenerate this image. Please try again."
      );
    } finally {
      setRegeneratingIndex(null);
    }
  }

  // ---------------------------------------------------------------- step 5

  async function runStitch(pid: string) {
    setError("");
    setIsStitching(true);
    try {
      const res = await fetch("/api/generate/videos/stitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: pid }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't join the scenes together.");
      setScript(body.script);
      // Uploaded photos are deleted once the video is finished.
      if (body.uploadsCleared) {
        setAssetUrls([]);
        setToneUrls([]);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't join the scenes together.");
    } finally {
      setIsStitching(false);
    }
  }

  // Checks on the video jobs every few seconds. When every scene is finished
  // the clips are joined into the final video without another click.
  function startVideoPolling(pid: string, immediate: boolean) {
    stopVideoPolling();
    setIsGeneratingVideos(true);

    const tick = async () => {
      if (pollBusyRef.current) return;
      pollBusyRef.current = true;
      try {
        const res = await fetch(`/api/generate/videos/status?projectId=${pid}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Couldn't check on your video.");
        const next: ScriptWithImages = body.script;
        setScript(next);

        if (!next.scenes.some((s) => s.videoJobId)) {
          stopVideoPolling();
          setIsGeneratingVideos(false);
          if (next.scenes.length > 0 && next.scenes.every((s) => s.videoUrl)) {
            await runStitch(pid);
          } else {
            setError("Some scenes didn't finish. You can retry just the missing ones.");
          }
        }
      } catch (err) {
        stopVideoPolling();
        setIsGeneratingVideos(false);
        setError(err instanceof Error ? err.message : "Couldn't check on your video.");
      } finally {
        pollBusyRef.current = false;
      }
    };

    videoPollRef.current = setInterval(tick, 6000);
    if (immediate) void tick();
  }

  async function handleGenerateVideos(onlyMissing: boolean) {
    if (!script) return;
    setError("");

    if (isMock) {
      setIsGeneratingVideos(true);
      setScript((prev) => (prev ? { ...prev, videoStartedAt: Date.now() } : prev));
      for (const videoStatus of ["queued", "in_progress", "completed"] as const) {
        await wait(900);
        setScript((prev) =>
          prev
            ? {
                ...prev,
                scenes: prev.scenes.map((s) => ({
                  ...s,
                  videoStatus,
                  videoJobId: videoStatus === "completed" ? null : "mock-job",
                  videoUrl: videoStatus === "completed" ? "mock-preview" : null,
                })),
              }
            : prev
        );
      }
      setIsGeneratingVideos(false);
      setIsStitching(true);
      await wait(1200);
      setScript((prev) =>
        prev
          ? {
              ...prev,
              finalVideoUrl: "mock-preview",
              scenes: prev.scenes.map((s) => ({ ...s, videoUrl: null })),
            }
          : prev
      );
      setIsStitching(false);
      return;
    }

    if (!projectId) return;
    setIsGeneratingVideos(true);
    try {
      const res = await fetch("/api/generate/videos/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          script,
          resolution: normalizeResolution(form.resolution),
          onlyMissing,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.script) setScript(body.script);
      if (!res.ok && !body.script) {
        throw new Error(body.error || "Couldn't start video generation. Please try again.");
      }
      if (body.error) setError(body.error);

      const anyPending = (body.script as ScriptWithImages | undefined)?.scenes.some(
        (s) => s.videoJobId
      );
      if (!anyPending) {
        setIsGeneratingVideos(false);
        return;
      }
      startVideoPolling(projectId, false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't start video generation. Please try again."
      );
      setIsGeneratingVideos(false);
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
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Couldn't finalize. Please try again.");
      }
      if (body.uploadsCleared) {
        setAssetUrls([]);
        setToneUrls([]);
      }
      setIsFinalized(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsFinalizing(false);
    }
  }

  // ---------------------------------------------------------------- render

  const subtitle =
    step === 1
      ? "Describe what you need and we'll turn it into a finished video."
      : step === 2
        ? "Review what we understood from your request."
        : step === 3
          ? "Shape the scene by scene plan."
          : step === 4
            ? "See each scene before it becomes video."
            : "Review everything, then make your video.";

  return (
    <div className="rounded-[28px] border border-hair bg-panel p-6 shadow-[0_1px_2px_rgba(33,30,25,0.05),0_16px_36px_rgba(33,30,25,0.08)] sm:p-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[12px] font-semibold text-accent">
          {projectId || brief ? "Project" : "Create"}
        </span>
        {isMock && (
          <span className="rounded-full bg-panel-2 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-text-dim uppercase">
            Preview, no tokens used
          </span>
        )}
      </div>
      <h2 className="mb-1 font-serif text-[clamp(22px,2.6vw,28px)] font-semibold tracking-tight text-text">
        {brief?.productName?.trim() || "New project"}
      </h2>
      <p className="mb-7 max-w-[600px] text-[15px] leading-[1.5] text-text-dim">{subtitle}</p>

      <Stepper
        current={step}
        maxVisited={maxVisited}
        canReach={canReach}
        disabled={busy}
        onSelect={goToStep}
      />

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-coral/30 bg-coral/5 px-4 py-3 text-[13px] leading-[1.5] text-coral"
        >
          <span>{error}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setError("")} className="mt-0.5 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {step === 1 && (
        <DescribeStep
          form={form}
          onChange={updateForm}
          hasProject={!!projectId}
          isExtracting={isExtracting}
          thinking={thinking}
          statusIndex={statusIndex}
          existingAssetUrls={assetUrls}
          existingToneUrls={toneUrls}
          onContinue={handleExtract}
          onNext={() => showStep(2)}
          onStartNew={startNew}
          onPreview={handlePreview}
        />
      )}

      {step === 2 && brief && (
        <BriefStep
          brief={brief}
          onChange={updateBrief}
          hasScript={!!script}
          isWriting={isWritingScript}
          locked={isFinalized}
          thinking={thinking}
          statusIndex={statusIndex}
          onGenerateScript={handleGenerateScript}
          onNext={() => showStep(3)}
          onBack={() => showStep(1)}
        />
      )}

      {step === 3 && script && (
        <ScriptStep
          script={script}
          locked={isFinalized}
          isRevising={isRevising}
          revisionsLeft={revisionsLeft}
          thinking={thinking}
          statusIndex={statusIndex}
          onVoiceoverScript={(text) => editScript((s) => ({ ...s, voiceoverScript: text }))}
          onUpdateScene={updateScene}
          onMoveScene={moveScene}
          onAddScene={addScene}
          onRemoveScene={removeScene}
          onRevise={handleRevise}
          onNext={() => showStep(4)}
          onBack={() => showStep(2)}
        />
      )}

      {step === 4 && script && (
        <ImagesStep
          script={script}
          isMock={isMock}
          isGenerating={isGeneratingImages}
          regeneratingIndex={regeneratingIndex}
          progress={imageProgress}
          locked={isFinalized}
          hasFinalVideo={!!script.finalVideoUrl}
          hasReferencePhotos={assetUrls.length + toneUrls.length > 0}
          onUpdateScene={updateScene}
          onGenerate={handleGenerateImages}
          onRegenerate={handleRegenerateImage}
          onNext={() => showStep(5)}
          onBack={() => showStep(3)}
        />
      )}

      {step === 5 && script && (
        <VideoStep
          script={script}
          brief={brief}
          form={form}
          isMock={isMock}
          isGenerating={isGeneratingVideos}
          isStitching={isStitching}
          isFinalizing={isFinalizing}
          isFinalized={isFinalized}
          onResolution={(r) => updateForm({ resolution: r })}
          onGenerate={handleGenerateVideos}
          onStitch={() => projectId && runStitch(projectId)}
          onFinalize={handleFinalize}
          onGoToStep={goToStep}
          onStartNew={startNew}
          onBack={() => showStep(4)}
        />
      )}
    </div>
  );
}
