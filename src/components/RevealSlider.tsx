"use client";

import { useEffect, useRef } from "react";

function drawFrame(canvas: HTMLCanvasElement, isAfter: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  canvas.width = cw * 2;
  canvas.height = ch * 2;
  ctx.scale(2, 2);

  if (isAfter) {
    const grad = ctx.createLinearGradient(0, 0, cw, ch);
    grad.addColorStop(0, "#5457FF");
    grad.addColorStop(1, "#4B4EFF");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "#FF5C39";
    ctx.beginPath();
    ctx.arc(cw * 0.8, ch * 0.26, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 32px Fraunces, serif";
    ctx.fillText("Run further.", cw * 0.07, ch * 0.62);
    ctx.font = "500 14px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("Vantage Running Co.", cw * 0.07, ch * 0.7);
  } else {
    ctx.fillStyle = "#EFE9DA";
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "rgba(33,30,25,0.25)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(cw * 0.06, ch * 0.14, cw * 0.3, ch * 0.28);
    ctx.beginPath();
    ctx.arc(cw * 0.8, ch * 0.26, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(33,30,25,0.45)";
    ctx.font = "600 32px Fraunces, serif";
    ctx.fillText("Run further.", cw * 0.07, ch * 0.62);
    ctx.font = "500 14px Inter, sans-serif";
    ctx.fillStyle = "rgba(33,30,25,0.35)";
    ctx.fillText("Layout draft", cw * 0.07, ch * 0.7);
  }
}

export function RevealSlider() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const before = beforeCanvasRef.current;
    const after = afterCanvasRef.current;
    if (!before || !after) return;

    const render = () => {
      drawFrame(before, false);
      drawFrame(after, true);
    };
    render();
    window.addEventListener("resize", render);
    return () => window.removeEventListener("resize", render);
  }, []);

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
        <canvas ref={beforeCanvasRef} className="block h-full w-full" />
      </div>
      <div
        className="absolute inset-0"
        style={{ clipPath: "inset(0 0 0 var(--scan, 38%))" }}
      >
        <canvas ref={afterCanvasRef} className="block h-full w-full" />
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
        <span>Vantage Running Co.</span>
        <span>Drag to compare</span>
      </div>
    </div>
  );
}
