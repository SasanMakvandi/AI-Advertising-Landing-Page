"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import { FREE_IMAGE_REGENS, type ScriptWithImages } from "@/lib/generation-schemas";
import { IMAGE_COST_PER_SCENE, money } from "./constants";
import { downloadHref } from "./api";
import {
  AutoTextarea,
  ContentNotice,
  Lightbox,
  Panel,
  RetryImage,
  btnPrimary,
  btnSecondary,
} from "./ui";

type Scene = ScriptWithImages["scenes"][number];

export function ImagesStep({
  script,
  isMock,
  isGenerating,
  regeneratingIndex,
  progress,
  locked,
  hasFinalVideo,
  hasReferencePhotos,
  onUpdateScene,
  onGenerate,
  onRegenerate,
  onNext,
  onBack,
}: {
  script: ScriptWithImages;
  isMock: boolean;
  isGenerating: boolean;
  regeneratingIndex: number | null;
  progress: { done: number; total: number };
  locked: boolean;
  hasFinalVideo: boolean;
  hasReferencePhotos: boolean;
  onUpdateScene: <K extends keyof Scene>(index: number, key: K, value: Scene[K]) => void;
  onGenerate: () => void;
  onRegenerate: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const hasImages = script.scenes.some((s) => s.imageUrl);
  const estimate = script.scenes.length * IMAGE_COST_PER_SCENE;
  const open = openIndex !== null ? script.scenes[openIndex] : null;
  const anyBusy = isGenerating || regeneratingIndex !== null;

  return (
    <div>
      <p className="mb-5 max-w-[640px] text-[14px] leading-[1.55] text-text-dim">
        One reference image per scene. They&apos;re optional: when present, each becomes the
        starting frame of its scene&apos;s video, so the result stays closer to what you see
        here. Not happy with one? Edit its description and regenerate just that image.
        {hasReferencePhotos
          ? " Your uploaded product photo is used as the reference."
          : " Upload a product photo in step 1 to make them match your real product."}
      </p>

      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-wide text-text-dim uppercase">
            Scene images
          </p>
          {!locked && (
            <button type="button" onClick={onGenerate} disabled={anyBusy} className={btnSecondary}>
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating {progress.done}/{progress.total}…
                </>
              ) : (
                <>
                  <ImageIcon size={14} />
                  {hasImages ? "Regenerate all images" : "Generate images"}
                  <span className="font-normal text-text-dim/80">about {money(estimate)}</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {script.scenes.map((scene, i) => {
            const regensLeft = Math.max(0, FREE_IMAGE_REGENS - (scene.imageRegens ?? 0));
            const isRegenerating = regeneratingIndex === i;
            return (
              <div
                key={`${scene.order}-${i}`}
                className="flex flex-col overflow-hidden rounded-xl border border-hair bg-panel"
              >
                <div className="group relative aspect-square w-full bg-panel-2">
                  {scene.imageUrl ? (
                    <>
                      {isMock ? (
                        <div className="h-full w-full" style={{ background: scene.imageUrl }} />
                      ) : (
                        <RetryImage src={scene.imageUrl} alt={`Scene ${i + 1} reference`} />
                      )}
                      <button
                        type="button"
                        onClick={() => setOpenIndex(i)}
                        aria-label={`Expand scene ${i + 1} image`}
                        className="absolute inset-0 flex cursor-zoom-in items-end justify-end bg-black/0 p-2 transition-colors group-hover:bg-black/20"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white">
                          <Maximize2 size={14} />
                        </span>
                      </button>
                      {!isMock && (
                        <a
                          href={downloadHref(scene.imageUrl, `scene-${i + 1}.png`)}
                          aria-label={`Download scene ${i + 1} image`}
                          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                        >
                          <Download size={14} />
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-dim/40">
                      {isGenerating ? (
                        <Loader2 size={22} className="animate-spin" />
                      ) : (
                        <ImageIcon size={22} />
                      )}
                    </div>
                  )}
                  {isRegenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 size={24} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col px-3.5 py-3">
                  <p className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-text">
                    <span className="font-mono text-accent">{String(i + 1).padStart(2, "0")}</span>
                    {scene.shotType || "Scene"}
                  </p>
                  <AutoTextarea
                    value={scene.description}
                    onChange={(e) => onUpdateScene(i, "description", e.target.value)}
                    disabled={locked || anyBusy}
                    rows={3}
                    maxHeight={200}
                    aria-label={`Scene ${i + 1} description`}
                    placeholder="What's happening in this shot"
                    className="w-full resize-none overflow-hidden rounded-lg border border-hair bg-bg px-2.5 py-2 text-[12.5px] leading-[1.5] text-text outline-none transition-colors placeholder:text-text-dim/60 focus:border-accent disabled:opacity-60"
                  />
                  <ContentNotice text={scene.description} compact />

                  {scene.imageUrl && !locked && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => onRegenerate(i)}
                        disabled={anyBusy || regensLeft === 0 || !scene.description.trim()}
                        className={`${btnSecondary} w-full !py-2 text-[12.5px]`}
                      >
                        {isRegenerating ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} />
                        )}
                        {isRegenerating
                          ? "Regenerating…"
                          : regensLeft > 0
                            ? "Regenerate this image"
                            : "Regeneration used"}
                      </button>
                      <p className="mt-1.5 text-[11.5px] leading-[1.4] text-text-dim">
                        {regensLeft > 0
                          ? "1 free regeneration for this scene."
                          : "More regenerations will cost tokens, coming soon."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasFinalVideo && !hasReferencePhotos && (
          <p className="mt-4 text-[12.5px] leading-[1.5] text-text-dim">
            Photos you uploaded are deleted once your video is finished. If you regenerate an
            image now, it is made from the description alone.
          </p>
        )}
      </Panel>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack} disabled={anyBusy} className={btnSecondary}>
          <ArrowLeft size={14} />
          Back
        </button>
        <button type="button" onClick={onNext} disabled={anyBusy} className={btnPrimary}>
          {hasImages ? "Continue to video" : "Skip to video"}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {open && open.imageUrl && (
        <Lightbox
          src={open.imageUrl}
          alt={`Scene ${(openIndex ?? 0) + 1} reference image`}
          downloadName={`scene-${(openIndex ?? 0) + 1}.png`}
          isMock={isMock}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}
