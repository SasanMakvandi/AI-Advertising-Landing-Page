import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { CostBreakdown } from "@/components/CostBreakdown";
import { Pricing } from "@/components/Pricing";
import { processSteps, services } from "@/lib/content";

export const metadata: Metadata = {
  title: "What we do — ReelSimple",
  description: "How ReelSimple content actually gets made, from brief to launch.",
};

export default function WhatWeDoPage() {
  return (
    <>
      <section className="mx-auto max-w-[1120px] px-6 pt-[90px] pb-20 lg:px-8">
        <Reveal className="mx-auto max-w-[780px] text-center">
          <div className="mb-[22px] flex items-center justify-center gap-2 text-sm font-semibold text-accent">
            <span className="h-[7px] w-[7px] rounded-full bg-coral" />
            What we do
          </div>
          <h1 className="font-serif text-[clamp(32px,4.6vw,54px)] leading-[1.1] font-semibold tracking-tight text-text">
            How we <em className="font-medium text-accent italic">actually</em> make your content.
          </h1>
          <p className="mx-auto mt-8 max-w-[600px] text-lg leading-[1.65] text-text-dim">
            No black box. Here&apos;s the process behind everything we ship —
            ad campaigns, listing photos, product shots — where AI does the
            heavy lifting, and where a person takes over.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-[90px] lg:px-12">
        <div>
          {processSteps.map((step, i) => (
            <Reveal
              key={step.index}
              delay={i * 0.06}
              className={`flex flex-col items-center gap-3 py-9 text-center ${
                i !== 0 ? "border-t border-hair" : "pt-0"
              }`}
            >
              <span className="font-mono text-2xl font-medium text-accent">{step.index}</span>
              <div className="max-w-[640px]">
                <h3 className="mb-2 font-serif text-[22px] font-semibold text-text">
                  {step.title}
                </h3>
                <p className="text-[15.5px] leading-[1.65] text-text-dim">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <CostBreakdown />

      <Pricing align="center" />

      <section className="mx-auto max-w-[1200px] px-6 pb-[90px] lg:px-12">
        <SectionHead
          title="What that covers"
          description="The disciplines we work across on any given project."
          align="center"
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.06}>
              <div className="h-full rounded-[20px] border border-hair bg-panel p-7 text-center">
                <h3 className="mb-2.5 font-serif text-[19px] font-semibold text-text">
                  {service.title}
                </h3>
                <p className="text-[14.5px] leading-[1.6] text-text-dim">{service.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
