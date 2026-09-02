"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "./ui/Container";
import { RevealSlider } from "./RevealSlider";

export function Hero() {
  return (
    <section id="top" className="pt-[90px] pb-[70px]">
      <Container className="max-w-[1120px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-[22px] flex items-center gap-2 text-sm font-semibold text-accent"
        >
          <span className="h-[7px] w-[7px] rounded-full bg-coral" />
          AI-engineered, humanly directed
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-[820px] font-serif text-[clamp(38px,5.6vw,68px)] leading-[1.06] font-semibold tracking-tight text-text"
        >
          Content that looks pro,
          <br />
          made for <em className="font-medium text-accent italic">a fraction</em> of the cost.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-[520px] text-lg leading-[1.6] text-text-dim"
        >
          We use AI to cut what a full shoot costs, then a real creative
          director shapes it until it looks professionally made — for ads,
          listing photos, or whatever you need shot.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center gap-[18px]"
        >
          <a
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-full bg-text px-[26px] py-[15px] text-[15px] font-semibold text-bg transition-colors hover:bg-accent"
          >
            Start your project
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
          <a
            href="#work"
            className="border-b-2 border-coral pb-[3px] text-[15px] font-semibold text-text"
          >
            See the work
          </a>
        </motion.div>

        <RevealSlider />
      </Container>
    </section>
  );
}
