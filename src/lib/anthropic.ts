import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

// Sonnet 5 — 2.5x cheaper than Opus 5 and plenty capable for structured
// extraction + short-form ad copywriting. Bump back to claude-opus-5 if
// quality ever falls short.
export const GENERATION_MODEL = "claude-sonnet-5";
