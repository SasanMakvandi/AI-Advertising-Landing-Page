import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { about, values, team } from "@/lib/content";

export const metadata: Metadata = {
  title: "About — ReelSimple",
  description: "Why ReelSimple exists, how we work, and who's behind it.",
};

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-[1120px] px-6 pt-[90px] pb-20 lg:px-8">
        <Reveal className="max-w-[820px]">
          <div className="mb-[22px] flex items-center gap-2 text-sm font-semibold text-accent">
            <span className="h-[7px] w-[7px] rounded-full bg-coral" />
            {about.eyebrow}
          </div>
          <h1 className="font-serif text-[clamp(32px,4.6vw,54px)] leading-[1.1] font-semibold tracking-tight text-text">
            {about.headline}
            <em className="font-medium text-accent italic">{about.headlineEm}</em>
            {about.headlineEnd}
          </h1>
          <div className="mt-8 flex flex-col gap-5">
            {about.paragraphs.map((p, i) => (
              <p key={i} className="max-w-[640px] text-lg leading-[1.65] text-text-dim">
                {p}
              </p>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-[90px] lg:px-12">
        <SectionHead title="How we work" description="A few things we won't compromise on." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 0.08}>
              <div className="h-full rounded-[20px] border border-hair bg-panel p-7">
                <h3 className="mb-2.5 font-serif text-[19px] font-semibold text-text">
                  {value.title}
                </h3>
                <p className="text-[14.5px] leading-[1.6] text-text-dim">{value.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-[90px] lg:px-12">
        <SectionHead title="The team" description="Small on purpose." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {team.map((member, i) => (
            <Reveal key={member.name + i} delay={i * 0.08}>
              <div className="h-full rounded-[20px] border border-hair bg-panel p-7">
                <div className="mb-4 h-11 w-11 rounded-full bg-gradient-to-br from-accent to-coral" />
                <h3 className="font-serif text-base font-semibold text-text">{member.name}</h3>
                <p className="mb-3 text-sm font-medium text-accent">{member.role}</p>
                <p className="text-[14.5px] leading-[1.6] text-text-dim">{member.bio}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
