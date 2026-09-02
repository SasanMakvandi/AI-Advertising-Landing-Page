"use client";

import { motion } from "framer-motion";
import { Reveal } from "./ui/Reveal";
import { SectionHead } from "./ui/SectionHead";
import { costBreakdown } from "@/lib/content";

const rowVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const strikeVariants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1 },
};

function StrikeText({
  children,
  delay,
  className = "",
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <motion.span
        variants={strikeVariants}
        transition={{ duration: 0.4, delay, ease: [0.65, 0, 0.35, 1] }}
        className="absolute left-0 top-1/2 h-px w-full origin-left bg-text"
      />
    </span>
  );
}

export function CostBreakdown() {
  const punchlineDelay = costBreakdown.items.length * 0.12 + 0.45;

  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-[90px] lg:px-12">
      <SectionHead
        title={costBreakdown.headline}
        description={costBreakdown.description}
        align="center"
      />

      <div className="mx-auto max-w-[720px] rounded-[20px] border border-hair bg-panel px-6 sm:px-9">
        {costBreakdown.items.map((item, i) => (
          <motion.div
            key={item.label}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={rowVariants}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="border-b border-hair py-5 text-center last:border-b-0"
          >
            <span className="text-[15.5px] font-medium text-text">{item.label}</span>
            <span className="mx-2 text-text-dim">—</span>
            <StrikeText delay={i * 0.12 + 0.35} className="font-mono text-sm text-text-dim">
              {item.cost}
            </StrikeText>
          </motion.div>
        ))}
      </div>

      <Reveal delay={punchlineDelay} className="mx-auto mt-9 max-w-[560px] text-center">
        <p className="font-serif text-[clamp(20px,2.6vw,28px)] leading-[1.4] font-medium text-text">
          {costBreakdown.punchlineStart}
          <em className="font-medium text-accent italic">{costBreakdown.punchlineEm}</em>
          {costBreakdown.punchlineEnd}
        </p>
      </Reveal>
    </section>
  );
}
