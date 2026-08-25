import { Reveal } from "./Reveal";

export function SectionHead({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Reveal className="mb-11 flex flex-wrap items-end justify-between gap-6">
      <h2 className="font-serif text-[clamp(26px,3.2vw,38px)] font-semibold tracking-tight text-text">
        {title}
      </h2>
      {description && (
        <p className="max-w-[340px] text-[15px] leading-[1.5] text-text-dim">
          {description}
        </p>
      )}
    </Reveal>
  );
}
