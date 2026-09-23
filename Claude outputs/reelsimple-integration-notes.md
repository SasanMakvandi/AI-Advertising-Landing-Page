# ReelSimple: AI Integration Planning Notes

Summary of what we've gone through so far, for handoff to wherever you continue this (Claude Code, a dev, etc).

## The project

ReelSimple: marketing site for an AI-engineered, humanly-directed production studio (photo/video content for ad campaigns, real estate listings, product shots). Next.js 15 (App Router) + TypeScript, Tailwind, Framer Motion, Auth.js (next-auth v5 beta) + Prisma + SQLite for accounts.

Currently working: signup, login, dashboard (protected, lists a user's `GalleryItem` rows).

Currently fake: the homepage's "here's how a video gets made" walkthrough (`PromptDemo.tsx`) is a static, scripted UI demo with placeholder providers (Claude for scripting, Seedance/Cling for video, ElevenLabs for audio). Nothing is actually generated yet. The dashboard's "Create" panel just simulates a 3.2s delay then writes a placeholder row.

Known pre-launch gaps already flagged in the README: contact form isn't wired to email/CRM, SQLite won't survive a serverless deploy or multiple instances (needs hosted Postgres before going live).

## Core concept for the integration

"Training Claude" isn't the right frame, there's no fine-tuning involved. What's actually needed is prompt design plus structured output, using the Anthropic API's tool use (function calling) feature: define a JSON schema for what you want back (e.g. a script's scenes), force Claude to return data matching it via `tool_choice`, and parse `tool_use.input` directly instead of parsing prose.

Example request/response shapes were worked out for:
- Script generation (`return_script` tool: `voiceoverScript` + `scenes[]` with order/shotType/duration/description/voiceover), matching the existing `Scene` shape already in `content.ts`.
- Brief extraction from a messy paragraph (`extract_brief` tool: productName, productDescription, price, targetAudience, tone, keySellingPoints, ctaIntent).

All of this happens server-side, via a Next.js API route (e.g. `src/app/api/generate/script/route.ts`), never from client components. `ANTHROPIC_API_KEY` goes in `.env`, same place as `DATABASE_URL` and `AUTH_SECRET`.

Note on multi-step calls: don't chain a "parse" call into a "write" call just to have Claude understand its own input better, that's redundant, one well-designed call already parses and writes in the same pass. A second call is only worth it when a human needs to see and correct the extracted brief before generation runs, that's a UX checkpoint, not a technical necessity.

## The two intake flows

**Flow 1, client knows what they want:** free-text brief in, Claude extracts/categorizes it into a structured brief object, client confirms or edits, script gets generated from there, rest of the pipeline follows.

**Flow 2, client has no creative direction:** only rough advertising needs given. Claude does a mix of web research (Anthropic API's web search tool, for grounding in current trends/comparable brands) and brainstorming, returns a few short concept pitches (not full scripts, just tag/title/one-line direction/tone, to avoid burning generation cost on throwaway options). Client picks a favorite or asks for more (previous ideas get passed back in context so Claude doesn't repeat itself). Once picked, the concept should route through the *same* confirm/edit gate as flow 1, not straight to scripting, since picking a direction isn't the same as confirming every detail.

**Key design point:** both flows should converge on the same structured "brief" schema (product, audience, tone, key selling points, CTA intent) before hitting script generation. Write the script-generation logic once; both flows just populate that object differently.

## Gaps and improvements identified in the flows themselves

- No human-in-the-loop checkpoint anywhere in either flow. This conflicts with ReelSimple's own stated brand promise ("nothing ships until a person has actually looked at it," "we're a creative team that happens to use AI well"). Worth adding at least a lightweight internal review step before a script reaches the client, if that positioning matters.
- Flow 2 needs a minimum floor of inputs (business type, what's being advertised, roughly who for) before ideation starts, otherwise both brainstorming and search have nothing real to work from.
- Both flows should auto-pull existing brand info (organization, slogan, logo, eventually a stored brand profile: tone words, colors, style refs) rather than asking the client to restate their business every project.
- The hard binary between the two flows may not match reality. Consider always offering a lighter version of the other path (e.g. "want to see a couple other directions too?" inside flow 1) rather than forcing a strict fork.
- No defined limit on regeneration/iteration loops (redoing a script, asking for "more ideas" repeatedly). Given pricing is per-piece-of-content, not per-attempt, this needs a flow-level decision even before any metering gets built.
- Pricing tier is "2 pieces of content" per package, but neither flow currently accounts for a client wanting a variant of an already-approved piece (same script, different aspect ratio/platform cut) rather than starting from scratch. Natural upsell/flow addition once a script's approved.

## Broader infrastructure gaps (flagged, not yet built)

- Data model is too thin for a multi-step, stateful flow. Currently only `User` and `GalleryItem` (title + status string) exist. Needs something like a `Project` model holding: userId, flow type, current status/step, brief JSON, concepts JSON, script JSON, timestamps.
- Real generation isn't instant. Script generation with web search could take 15 to 30 seconds; video generation (Seedance/Cling) takes minutes. The current synchronous request/response pattern in `CreatePanel.tsx` won't hold up, this needs to become async (kick off job, poll or push status, update UI when done).
- No usage/credit metering. Pricing promises "$600 for 2 pieces of content" but nothing enforces that once real (costly) generation is wired up.
- No prompt-to-provider translation layer yet, Claude's scene descriptions need to become whatever format Seedance/Cling/etc actually expect, plus handling their individual constraints (e.g. Cling's 15s clip cap).
- Visual consistency across scenes (same product/brand looking consistent scene to scene) is a real, nontrivial problem, this is why the demo has an explicit "reference images as visual anchor" step.
- Worth a lightweight content/legal guardrail check on client briefs (trademark issues, unsubstantiated claims) given this produces ads for other businesses.

## Where we left off (mid-build)

Started wiring the first real piece: a `Project` model in `prisma/schema.prisma` and a `src/app/api/generate/script/route.ts` using `@anthropic-ai/sdk` with the `return_script` tool schema. Not finished yet.

One session note: the connected device here doesn't expose a shell tool, so file edits can be made directly, but commands (`npm install`, `npx prisma migrate dev`, etc) need to be run locally rather than remotely.

Next concrete steps: finish the `Project` model, install the Anthropic SDK, write and test the script-generation route with a real API key, then wire it into `CreatePanel.tsx` in place of the fake 3.2s delay.
