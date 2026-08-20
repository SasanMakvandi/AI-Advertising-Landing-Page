import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { services } from "@/lib/content";

export function Services() {
  return (
    <section id="services" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="What we do"
          title="Everything you need to ship creative that performs"
          description="From first concept to a fully tested campaign, our pipeline blends AI speed with the judgment that keeps ads on-brand."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.08}>
              <div className="card-surface h-full rounded-2xl p-8 transition-colors hover:border-border-strong">
                <span className="font-display text-sm text-muted-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {service.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
