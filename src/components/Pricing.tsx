import { Check } from "lucide-react";
import { SectionHead } from "./ui/SectionHead";
import { Reveal } from "./ui/Reveal";
import { pricing } from "@/lib/content";

export function Pricing({ align = "left" }: { align?: "left" | "center" }) {
  const centered = align === "center";

  return (
    <section id="packages" className="mx-auto max-w-[1200px] px-6 py-[90px] lg:px-12">
      <SectionHead
        title="Packages"
        description="Three ways to work with us, from AI creative on its own to a fully run campaign."
        align={align}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {pricing.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 0.08}>
            <div
              className={`relative flex h-full flex-col rounded-[20px] border bg-panel p-8 ${
                centered ? "items-center text-center" : ""
              } ${
                tier.featured
                  ? "border-accent shadow-[0_1px_2px_rgba(33,30,25,0.05),0_16px_36px_rgba(75,78,255,0.14)]"
                  : "border-hair"
              }`}
            >
              {tier.badge && (
                <span
                  className={`absolute -top-[13px] rounded-full bg-accent px-3 py-[5px] text-[11.5px] font-semibold text-white ${
                    centered ? "left-1/2 -translate-x-1/2" : "left-7"
                  }`}
                >
                  {tier.badge}
                </span>
              )}

              <h3 className="mb-2 font-serif text-[22px] font-semibold text-text">
                {tier.name}
              </h3>

              {tier.price && (
                <div className="mb-3.5 text-[26px] font-semibold text-text">
                  {tier.price}{" "}
                  <span className="text-[13.5px] font-medium text-text-dim">
                    {tier.priceSuffix}
                  </span>
                </div>
              )}

              <p className="mb-[22px] min-h-[66px] text-[14.5px] leading-[1.55] text-text-dim">
                {tier.description}
              </p>

              <ul className="mb-7 flex-1">
                {tier.features.map((feature, fi) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-2.5 py-[9px] text-sm text-text ${
                      centered ? "justify-center" : ""
                    } ${fi !== 0 ? "border-t border-hair" : ""}`}
                  >
                    <Check size={15} className="mt-0.5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="/contact"
                className={`rounded-full border-[1.5px] border-text py-[13px] text-center text-[14.5px] font-semibold transition-colors hover:bg-text hover:text-bg ${
                  tier.featured ? "bg-text text-bg" : "text-text"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
