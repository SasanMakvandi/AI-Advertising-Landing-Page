import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { team } from "@/lib/content";

export function About() {
  return (
    <section id="about" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="Who we are"
          title="A small team of builders and creatives"
          description="We started Adnova because production was the bottleneck holding good marketing back. So we built the pipeline we wished we had."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {team.map((member, i) => (
            <Reveal key={member.name + i} delay={i * 0.08}>
              <div className="card-surface h-full rounded-2xl p-6">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent-violet to-accent-cyan" />
                <h3 className="mt-4 font-display text-base font-semibold">
                  {member.name}
                </h3>
                <p className="text-sm text-accent-violet">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {member.bio}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
