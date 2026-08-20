"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "./ui/Container";

export function Hero() {
  return (
    <section id="top" className="relative pt-40 pb-24 sm:pt-48 sm:pb-32">
      <Container className="flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card-surface mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-muted"
        >
          <Sparkles size={14} className="text-accent-violet" />
          AI-generated. Human art-directed.
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Advertising creative,{" "}
          <span className="text-gradient-accent">reimagined with AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted"
        >
          We pair AI generation with real creative direction to produce ad
          campaigns that convert — in days, not months, and at a fraction of
          the usual production cost.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <a
            href="#contact"
            className="glow-violet group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            Start a project
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
          <a
            href="#work"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-card"
          >
            See our work
          </a>
        </motion.div>
      </Container>
    </section>
  );
}
