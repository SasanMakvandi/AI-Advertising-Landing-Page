import Image from "next/image";
import { SectionHead } from "./ui/SectionHead";
import { Reveal } from "./ui/Reveal";
import { ShowcaseCarousel } from "./ShowcaseCarousel";
import { projects } from "@/lib/content";

function ProjectCard({
  project,
  index,
}: {
  project: (typeof projects)[number];
  index: number;
}) {
  return (
    <Reveal
      delay={index * 0.08}
      className={`py-14 ${index !== 0 ? "border-t border-hair" : "pt-2"}`}
    >
      <div className="relative mb-7 aspect-video overflow-hidden rounded-[20px] shadow-[0_1px_2px_rgba(33,30,25,0.05),0_16px_36px_rgba(33,30,25,0.08)]">
        {project.video ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={project.video}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : project.images ? (
          <ShowcaseCarousel images={project.images} alt={project.title} />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: "#E4DECF" }} />
            <div
              className="animate-kenburns absolute inset-0"
              style={{ background: project.gradient, animationDelay: `${index * 0.6}s` }}
            />
          </>
        )}
        {project.video && (
          <div className="absolute top-4 right-4 z-[2] flex items-center gap-[7px] rounded-full bg-white/92 px-3 py-1.5 text-[11.5px] font-semibold text-text">
            <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-coral" />
            Playing
          </div>
        )}
      </div>

      <div className="max-w-[660px]">
        <span className="mb-2.5 block text-[13px] font-semibold tracking-wide text-accent uppercase">
          {project.tag}
        </span>
        <Image
          src={project.logo}
          alt={project.title}
          width={project.logoWidth}
          height={project.logoHeight}
          className="mb-4 h-8 w-auto object-contain sm:h-9"
        />
        <p className="max-w-[560px] text-[15.5px] leading-[1.65] text-text-dim">
          {project.description}
        </p>
        <div className="mt-5 text-sm font-semibold text-text">
          {project.result.label}
          <span className="text-coral">{project.result.highlight}</span>
          {project.result.rest}
        </div>
      </div>
    </Reveal>
  );
}

export function Showcase() {
  return (
    <section id="work" className="mx-auto max-w-[1200px] px-6 py-[90px] lg:px-12">
      <SectionHead
        title="Recent work"
        description="Hover a piece to see it before and after a person touches it. That pass is what you're paying for."
      />
      <div>
        {projects.map((project, i) => (
          <ProjectCard key={project.title} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
