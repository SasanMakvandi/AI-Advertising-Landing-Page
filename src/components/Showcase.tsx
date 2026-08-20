import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { projects } from "@/lib/content";

export function Showcase() {
  return (
    <section id="work" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="Selected work"
          title="A few things we've shipped"
          description="A snapshot of recent campaigns — real briefs, real constraints, real results."
        />

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.title} delay={i * 0.1}>
              <div className="card-surface group h-full overflow-hidden rounded-2xl transition-colors hover:border-border-strong">
                <div
                  className={`relative h-48 overflow-hidden bg-gradient-to-br ${project.gradient}`}
                >
                  <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-black/0" />
                  <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-2">{project.client}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {project.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
