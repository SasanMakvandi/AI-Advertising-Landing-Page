"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Download, Link2, Search } from "lucide-react";
import { downloadHref } from "./create/api";
import { RetryImage } from "./create/ui";

export type GalleryCard = {
  id: string;
  projectId: string | null;
  title: string;
  statusLabel: string;
  finished: boolean;
  // One of the project's scene images (picked at random on every page load)
  // for projects that haven't produced a video yet.
  thumbImageUrl: string | null;
  videoUrl: string | null;
  updatedAt: string;
  searchText: string;
};

const GRADIENTS = [
  "linear-gradient(135deg, #4B4EFF, #211E19)",
  "linear-gradient(135deg, #FF5C39, #4B4EFF)",
  "linear-gradient(135deg, #E4DECF, #FF5C39)",
  "linear-gradient(135deg, #211E19, #4B4EFF)",
];

type Filter = "all" | "progress" | "finished";

function fileSafe(name: string) {
  return name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "video";
}

// The video lives at a public link, so sharing is copying that link.
function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link to share your video:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-hair px-3 py-1.5 text-[12px] font-semibold text-text-dim transition-colors hover:border-text/30 hover:text-text"
    >
      {copied ? <Check size={13} /> : <Link2 size={13} />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export function Gallery({
  cards,
  canResume,
  emptyText,
}: {
  cards: GalleryCard[];
  canResume: boolean;
  emptyText: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(
    () => ({
      all: cards.length,
      progress: cards.filter((c) => !c.finished).length,
      finished: cards.filter((c) => c.finished).length,
    }),
    [cards]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (filter === "progress" && c.finished) return false;
      if (filter === "finished" && !c.finished) return false;
      return !q || c.searchText.includes(q);
    });
  }, [cards, query, filter]);

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
      active
        ? "border-text bg-text text-bg"
        : "border-hair bg-panel text-text-dim hover:border-text/30 hover:text-text"
    }`;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-text">Your gallery</h2>
        <span className="text-[13px] text-text-dim">
          {counts.all} {counts.all === 1 ? "project" : "projects"}
        </span>
      </div>

      {cards.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-dim"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your projects"
              aria-label="Search your projects"
              className="w-full rounded-full border border-hair bg-panel py-2.5 pr-4 pl-10 text-[13.5px] text-text outline-none transition-colors placeholder:text-text-dim/70 focus:border-accent"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilter("all")} className={chip(filter === "all")}>
              All {counts.all}
            </button>
            <button
              type="button"
              onClick={() => setFilter("progress")}
              className={chip(filter === "progress")}
            >
              In progress {counts.progress}
            </button>
            <button
              type="button"
              onClick={() => setFilter("finished")}
              className={chip(filter === "finished")}
            >
              Finished {counts.finished}
            </button>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-hair bg-panel p-12 text-center">
          <p className="mb-2 text-lg font-medium text-text">Nothing here yet</p>
          <p className="text-sm text-text-dim">{emptyText}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-hair bg-panel p-10 text-center">
          <p className="text-sm text-text-dim">No projects match that search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((card, i) => {
            const href = canResume && card.projectId ? `/dashboard?project=${card.projectId}` : null;
            // Finished projects show the video itself, not a reference image.
            const showVideo = card.finished && !!card.videoUrl;
            const body = (
              <>
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-panel-2">
                  {showVideo ? (
                    <video
                      src={`${card.videoUrl}#t=0.1`}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0.1;
                      }}
                      className="h-full w-full object-cover"
                    />
                  ) : card.thumbImageUrl ? (
                    <RetryImage src={card.thumbImageUrl} alt="" />
                  ) : (
                    <div className="h-full w-full" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
                  )}
                  <span
                    className={`absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                      card.finished ? "bg-accent text-white" : "bg-black/60 text-white"
                    }`}
                  >
                    {card.statusLabel}
                  </span>
                </div>
                <div className="px-3.5 pt-3.5 pb-3">
                  <p className="truncate text-sm font-medium text-text">{card.title}</p>
                  <p className="mt-0.5 flex items-center justify-between text-xs text-text-dim">
                    <span suppressHydrationWarning>
                      {new Date(card.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {href && (
                      <span className="font-semibold text-accent">
                        {card.finished ? "Open" : "Continue"}
                      </span>
                    )}
                  </p>
                </div>
              </>
            );
            return (
              <div
                key={card.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-hair bg-panel transition-shadow hover:shadow-[0_10px_28px_rgba(33,30,25,0.12)]"
              >
                {href ? (
                  <Link href={href} scroll className="block">
                    {body}
                  </Link>
                ) : (
                  <div>{body}</div>
                )}
                {showVideo && card.videoUrl && (
                  <div className="mt-auto flex items-center gap-2 px-3.5 pb-3.5">
                    <a
                      href={downloadHref(card.videoUrl, `${fileSafe(card.title)}.mp4`)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-hair px-3 py-1.5 text-[12px] font-semibold text-text-dim transition-colors hover:border-text/30 hover:text-text"
                    >
                      <Download size={13} />
                      Download
                    </a>
                    <ShareButton url={card.videoUrl} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
