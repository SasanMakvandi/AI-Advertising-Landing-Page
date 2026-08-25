"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "./ui/Reveal";

type Status = "idle" | "submitting" | "success" | "error";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-[1200px] px-6 py-[90px] lg:px-12">
      <Reveal className="mx-auto max-w-2xl rounded-[28px] border border-hair bg-panel p-8 shadow-[0_1px_2px_rgba(33,30,25,0.05),0_16px_36px_rgba(33,30,25,0.08)] sm:p-12">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
          <span className="h-[7px] w-[7px] rounded-full bg-coral" />
          Get in touch
        </div>
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Tell us about your next campaign
        </h2>
        <p className="mt-4 text-base leading-relaxed text-text-dim">
          Share a bit about your brand and what you&apos;re looking to launch
          — we&apos;ll follow up within a couple of days.
        </p>

        {status === "success" ? (
          <Reveal className="mt-10 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
              <Check size={22} className="text-accent" />
            </div>
            <p className="text-base font-medium text-text">Message sent</p>
            <p className="text-sm text-text-dim">
              Thanks for reaching out — we&apos;ll be in touch soon.
            </p>
          </Reveal>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                required
                name="name"
                placeholder="Your name"
                className="rounded-xl border border-hair bg-bg px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-text-dim focus:border-accent"
              />
              <input
                required
                type="email"
                name="email"
                placeholder="Email address"
                className="rounded-xl border border-hair bg-bg px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-text-dim focus:border-accent"
              />
            </div>
            <input
              name="company"
              placeholder="Company (optional)"
              className="rounded-xl border border-hair bg-bg px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-text-dim focus:border-accent"
            />
            <textarea
              required
              name="message"
              rows={4}
              placeholder="What are you looking to launch?"
              className="resize-none rounded-xl border border-hair bg-bg px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-text-dim focus:border-accent"
            />

            <button
              type="submit"
              disabled={status === "submitting"}
              className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-text px-6 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
            >
              {status === "submitting" ? "Sending..." : "Send message"}
              {status !== "submitting" && (
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              )}
            </button>

            {status === "error" && (
              <p className="text-center text-sm text-coral">
                Something went wrong — please try again.
              </p>
            )}
          </form>
        )}
      </Reveal>
    </section>
  );
}
