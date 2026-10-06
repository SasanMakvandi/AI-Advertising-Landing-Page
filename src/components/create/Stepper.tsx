"use client";

import { Check } from "lucide-react";
import { STEPS, type StepId } from "./types";

// Progress bar for the creation flow. Any step that has data behind it can
// be reopened at any time; steps ahead of the user's progress stay disabled.
export function Stepper({
  current,
  maxVisited,
  canReach,
  disabled,
  onSelect,
}: {
  current: StepId;
  maxVisited: StepId;
  canReach: (id: StepId) => boolean;
  disabled: boolean;
  onSelect: (id: StepId) => void;
}) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {STEPS.map((s, i) => {
          const isCurrent = s.id === current;
          const reachable = canReach(s.id);
          const done = !isCurrent && s.id < maxVisited && reachable;
          const clickable = reachable && !isCurrent && !disabled;
          return (
            <li key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
              <button
                type="button"
                onClick={() => clickable && onSelect(s.id)}
                disabled={!clickable}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${s.id}: ${s.label}`}
                className={`group flex items-center gap-2 rounded-full py-1 pr-2 text-left transition-opacity ${
                  clickable ? "cursor-pointer" : "cursor-default"
                } ${!reachable ? "opacity-45" : ""}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold transition-colors ${
                    isCurrent
                      ? "border-text bg-text text-bg"
                      : done
                        ? "border-accent bg-accent-soft text-accent group-hover:bg-accent group-hover:text-white"
                        : "border-hair bg-panel text-text-dim"
                  }`}
                >
                  {done ? <Check size={14} /> : s.id}
                </span>
                <span
                  className={`hidden text-[13px] font-semibold sm:inline ${
                    isCurrent ? "text-text" : "text-text-dim"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`mx-2 h-px flex-1 ${s.id < maxVisited ? "bg-accent/50" : "bg-hair"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
