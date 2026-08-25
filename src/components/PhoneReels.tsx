"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Send, VolumeX } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { reels } from "@/lib/content";

export function PhoneReels() {
  const screenRef = useRef<HTMLDivElement>(null);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = screenRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
          }
        });
      },
      { root, threshold: 0.6 }
    );

    reelRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mx-auto max-w-[1200px] px-6 pt-5 pb-[90px] lg:px-12">
      <Reveal className="mx-auto mb-11 max-w-md text-center">
        <h2 className="font-serif text-[clamp(26px,3.2vw,38px)] font-semibold tracking-tight text-text">
          Follow along
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-text-dim">
          A running feed of behind-the-scenes clips and finished work — scroll
          it like you would on the app.
        </p>
      </Reveal>

      <div className="mt-11 flex flex-wrap items-start justify-center gap-12">
        <div className="relative w-[300px] rounded-[44px] bg-text p-3.5 shadow-[0_24px_60px_rgba(33,30,25,0.22)]">
          <div className="absolute top-3.5 left-1/2 z-[6] h-5 w-[90px] -translate-x-1/2 rounded-b-[14px] bg-text" />

          <div className="absolute top-1/2 right-[26px] z-[7] flex -translate-y-1/2 flex-col gap-2">
            {[...reels, null].map((_, i) => (
              <span
                key={i}
                className={`rounded-full bg-white/35 transition-all duration-300 ${
                  activeIndex === i ? "h-4 w-[5px] rounded-[3px] bg-white" : "h-[5px] w-[5px]"
                }`}
              />
            ))}
          </div>

          <div
            ref={screenRef}
            className="h-[560px] snap-y snap-mandatory overflow-y-auto rounded-[30px] bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reels.map((reel, i) => (
              <div
                key={i}
                ref={(el) => {
                  reelRefs.current[i] = el;
                }}
                data-index={i}
                className="relative flex h-[560px] snap-start items-end overflow-hidden"
              >
                <div
                  className="animate-reelshift absolute -inset-[10%]"
                  style={{ background: reel.gradient }}
                />
                <div className="absolute top-5 right-4 z-[3] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/18 text-white">
                  <VolumeX size={14} />
                </div>
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/75 via-black/10 via-45% to-transparent to-65%" />
                <div className="relative z-[2] flex w-full items-end justify-between gap-3.5 px-4 pb-6">
                  <div className="max-w-[190px] text-left text-white">
                    <div className="mb-1.5 text-[13.5px] font-semibold">{reel.handle}</div>
                    <div className="text-[12.5px] leading-[1.45] text-white/85">
                      {reel.caption}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-4 text-white">
                    <button type="button" className="flex flex-col items-center gap-1">
                      <Heart size={20} />
                      <span className="text-[11px] font-semibold">{reel.likes}</span>
                    </button>
                    <button type="button" className="flex flex-col items-center gap-1">
                      <MessageCircle size={20} />
                      <span className="text-[11px] font-semibold">{reel.comments}</span>
                    </button>
                    <button type="button" className="flex flex-col items-center gap-1">
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div
              ref={(el) => {
                reelRefs.current[reels.length] = el;
              }}
              data-index={reels.length}
              className="relative flex h-[560px] snap-start items-center justify-center overflow-hidden"
            >
              <div
                className="animate-reelshift absolute -inset-[10%]"
                style={{ background: "linear-gradient(155deg,#4B4EFF,#211E19)" }}
              />
              <div className="relative z-[2] px-[34px] text-center text-white">
                <h4 className="mb-3 font-serif text-[27px] leading-[1.25] font-medium italic">
                  Your campaign belongs here.
                </h4>
                <p className="mb-[22px] text-[13.5px] text-white/85">
                  Send us the brief — we&apos;ll have something back before your
                  next scroll break.
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-[22px] py-3 text-[13.5px] font-semibold text-text"
                >
                  Launch your campaign →
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-[340px] flex-col gap-3.5 pt-1.5">
          {reels.map((reel, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-5 transition-all duration-300 ${
                activeIndex === i
                  ? "scale-100 border-accent opacity-100 shadow-[0_1px_2px_rgba(33,30,25,0.05),0_14px_30px_rgba(75,78,255,0.12)]"
                  : "scale-[0.98] border-hair opacity-40"
              } bg-panel`}
            >
              <span className="mb-2 block text-xs font-semibold text-accent">
                {reel.note.index}
              </span>
              <h4 className="mb-2 font-serif text-[17px] font-semibold text-text">
                {reel.note.title}
              </h4>
              <p className="text-sm leading-[1.55] text-text-dim">{reel.note.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
