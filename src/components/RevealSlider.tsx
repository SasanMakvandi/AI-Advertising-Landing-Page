"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function RevealSlider() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const handle = handleRef.current;
    if (!wrap || !handle) return;

    let dragging = false;
    let auto = true;

    const setPos = (clientX: number) => {
      const rect = wrap.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(4, Math.min(96, pct));
      wrap.style.setProperty("--scan", `${pct}%`);
    };

    const onPointerDown = () => {
      dragging = true;
      auto = false;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragging) setPos(e.clientX);
    };

    handle.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    const driftTimeout = setTimeout(() => {
      let t = 0;
      const drift = setInterval(() => {
        if (!auto) {
          clearInterval(drift);
          return;
        }
        t += 0.02;
        const pct = 38 + Math.sin(t) * 14;
        wrap.style.setProperty("--scan", `${pct}%`);
      }, 30);
    }, 600);

    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      clearTimeout(driftTimeout);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mt-14 h-[420px] overflow-hidden rounded-[20px] bg-panel shadow-[0_1px_2px_rgba(33,30,25,0.06),0_12px_32px_rgba(33,30,25,0.08)]"
      style={{ "--scan": "38%" } as React.CSSProperties}
    >
      <div className="absolute inset-0">
        <Image
          src="/images/reveal-before.webp"
          alt="AI-engineered first draft"
          fill
          priority
          sizes="(min-width: 1120px) 1120px, 100vw"
          className="object-cover"
        />
      </div>
      <div
        className="absolute inset-0"
        style={{ clipPath: "inset(0 0 0 var(--scan, 38%))" }}
      >
        <Image
          src="/images/reveal-after.webp"
          alt="Finished, humanly-directed result"
          fill
          priority
          sizes="(min-width: 1120px) 1120px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="absolute top-[18px] left-[18px] z-[2] rounded-full bg-panel-2 px-3 py-1.5 text-[12.5px] font-semibold text-text-dim">
        AI-engineered
      </div>
      <div className="absolute top-[18px] right-[18px] z-[2] rounded-full bg-accent-soft px-3 py-1.5 text-[12.5px] font-semibold text-accent">
        Humanly directed
      </div>

      <div
        ref={handleRef}
        className="absolute top-0 bottom-0 z-[3] w-0 -translate-x-1/2 cursor-ew-resize touch-none"
        style={{ left: "var(--scan, 38%)" }}
      >
        <div className="absolute top-0 bottom-0 left-1/2 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_0_1px_var(--hair)]" />
        <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 rounded-full bg-white shadow-[0_4px_14px_rgba(33,30,25,0.18)]">
          <span className="h-3.5 w-0.5 rounded-sm bg-text-dim" />
          <span className="h-3.5 w-0.5 rounded-sm bg-text-dim" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-white/92 to-white/0 px-[22px] py-4 text-[13px] text-text-dim">
        <span>Alpéire Skincare</span>
        <span>Drag to compare</span>
      </div>
    </div>
  );
}
