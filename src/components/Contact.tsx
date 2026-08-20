"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
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
    <section id="contact" className="py-24 sm:py-32">
      <Container>
        <div className="card-surface glow-violet mx-auto max-w-2xl rounded-3xl p-8 sm:p-12">
          <SectionHeading
            eyebrow="Get in touch"
            title="Tell us about your next campaign"
            description="Share a bit about your brand and what you're looking to launch — we'll follow up within a couple of days."
            align="center"
          />

          {status === "success" ? (
            <Reveal className="mt-10 flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-violet/20">
                <Check size={22} className="text-accent-violet" />
              </div>
              <p className="text-base font-medium">Message sent</p>
              <p className="text-sm text-muted">
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
                  className="rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent-violet"
                />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Email address"
                  className="rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent-violet"
                />
              </div>
              <input
                name="company"
                placeholder="Company (optional)"
                className="rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent-violet"
              />
              <textarea
                required
                name="message"
                rows={4}
                placeholder="What are you looking to launch?"
                className="resize-none rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent-violet"
              />

              <button
                type="submit"
                disabled={status === "submitting"}
                className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.01] disabled:opacity-60"
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
                <p className="text-center text-sm text-accent-pink">
                  Something went wrong — please try again.
                </p>
              )}
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
