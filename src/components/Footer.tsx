import { ArrowRight } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { footer } from "@/lib/content";

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1120px] px-6 pt-[70px] pb-14 lg:px-8">
      <Reveal className="rounded-[28px] bg-text px-8 py-14 sm:px-14 sm:py-16">
        <div className="flex items-center gap-2 text-sm font-semibold text-coral">
          <span className="h-[7px] w-[7px] rounded-full bg-coral" />
          {footer.eyebrow}
        </div>

        <h2 className="mt-6 max-w-[680px] font-serif text-[clamp(30px,4.4vw,50px)] leading-[1.1] font-medium tracking-tight text-bg italic">
          {footer.headline}
        </h2>

        <div className="mt-8">
          <a
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-full bg-coral px-[26px] py-[15px] text-[15px] font-semibold text-white transition-colors hover:bg-[#ff7455]"
          >
            Start your project
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-[22px] text-[13px] text-white/50">
          <span>reelsimple © {new Date().getFullYear()}</span>
          <span>{footer.location}</span>
          <span>{footer.email}</span>
        </div>
      </Reveal>
    </footer>
  );
}
