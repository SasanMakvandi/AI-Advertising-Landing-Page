"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { reels } from "@/lib/content";

export function AutoScrollPhone() {
  const screenRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;

    const id = setInterval(() => {
      setActiveIndex((i) => {
        const next = (i + 1) % reels.length;
        el.scrollTo({ top: next * el.clientHeight, behavior: "smooth" });
        return next;
      });
    }, 4000);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-[280px] shrink-0 rounded-[44px] bg-text p-3.5 shadow-[0_24px_60px_rgba(33,30,25,0.22)]">
      <div className="absolute top-3.5 left-1/2 z-[6] h-5 w-[90px] -translate-x-1/2 rounded-b-[14px] bg-text" />

      <div className="absolute top-1/2 right-[22px] z-[7] flex -translate-y-1/2 flex-col gap-2">
        {reels.map((_, i) => (
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
        className="h-[560px] overflow-y-hidden rounded-[30px] bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reels.map((reel, i) => (
          <div key={i} className="relative flex h-[560px] items-end overflow-hidden">
            {reel.video ? (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={reel.video}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div
                className="animate-reelshift absolute -inset-[10%]"
                style={{ background: reel.gradient }}
              />
            )}
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/75 via-black/10 via-45% to-transparent to-65%" />
            <div className="relative z-[2] flex w-full items-end justify-between gap-3.5 px-4 pb-6">
              <div className="max-w-[170px] text-left text-white">
                <div className="mb-1.5 text-[13.5px] font-semibold">{reel.handle}</div>
                <div className="text-[12.5px] leading-[1.45] text-white/85">{reel.caption}</div>
              </div>
              <div className="flex flex-col items-center gap-4 text-white">
                <div className="flex flex-col items-center gap-1">
                  <Heart size={20} />
                  <span className="text-[11px] font-semibold">{reel.likes}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <MessageCircle size={20} />
                  <span className="text-[11px] font-semibold">{reel.comments}</span>
                </div>
                <Send size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
