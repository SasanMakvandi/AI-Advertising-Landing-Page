import Image from "next/image";
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
          {items.map((client, i) => (
            <div key={i} className="flex shrink-0 items-center px-[46px]">
              <Image
                src={client.logo}
                alt={client.name}
                width={client.width}
                height={client.height}
                className={`h-7 w-auto object-contain opacity-55 grayscale transition-all duration-300 hover:opacity-90 ${
                  client.invert ? "invert" : "hover:grayscale-0"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
