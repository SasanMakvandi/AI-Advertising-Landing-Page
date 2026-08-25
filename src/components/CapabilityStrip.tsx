import { capabilities } from "@/lib/content";

export function CapabilityStrip() {
  const items = [...capabilities, ...capabilities];

  return (
    <section id="capabilities" className="overflow-hidden border-y border-hair py-5">
      <div className="animate-marquee flex w-max whitespace-nowrap">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-[30px] px-[30px] text-[15px] font-medium text-text-dim after:content-['•'] after:text-coral"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
