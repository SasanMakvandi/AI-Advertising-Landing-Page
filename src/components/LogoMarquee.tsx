import { clients } from "@/lib/content";

export function LogoMarquee() {
  const items = [...clients, ...clients];

  return (
    <section id="clients" className="mx-auto max-w-[1200px] px-6 pt-5 pb-[90px] lg:px-12">
      <p className="mb-[30px] text-center text-[13px] font-semibold tracking-wide text-text-dim uppercase">
        Recent clients
      </p>
      <div className="overflow-hidden border-y border-hair py-[34px]">
        <div className="animate-marquee-slow flex w-max items-center whitespace-nowrap">
          {items.map((name, i) => (
            <span
              key={i}
              className="px-[46px] font-serif text-xl font-semibold text-text-dim opacity-55"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
