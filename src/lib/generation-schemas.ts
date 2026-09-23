import { z } from "zod";

// Max number of AI-assisted "revise scenes" passes allowed per project,
// to keep API cost bounded — direct manual edits to scene text are free
// and unlimited; only the "revise with Claude" action counts against this.
export const MAX_REVISIONS = 2;

export const BriefSchema = z.object({
  productName: z.string().describe("The product, service, or property being advertised"),
  productDescription: z
    .string()
    .describe("A clear description of what it is and what makes it notable"),
  price: z
    .string()
    .nullable()
    .describe("Price or pricing context, if mentioned or clearly implied; null otherwise"),
  targetAudience: z.string().describe("Who this is being advertised to"),
  tone: z.string().describe("The tone the ad should have, e.g. playful, premium, warm, urgent"),
  keySellingPoints: z.array(z.string()).describe("3-5 short selling points to highlight"),
  ctaIntent: z
    .string()
    .describe("What the viewer should do after watching, e.g. 'Learn more', 'Shop now'"),
});

export type Brief = z.infer<typeof BriefSchema>;

export const SceneSchema = z.object({
  order: z.number().int(),
  shotType: z.string().describe("e.g. Close-up, Wide, Lifestyle, Macro"),
  duration: z.number().int().describe("Duration of this scene in seconds"),
  description: z.string().describe("What's visually happening in this shot"),
  voiceover: z
    .string()
    .nullable()
    .describe("The voiceover line spoken during this scene, or null if the video has no voiceover"),
});

export const ScriptSchema = z.object({
  voiceoverScript: z
    .string()
    .nullable()
    .describe(
      "The full voiceover script, all scenes' lines combined into one flowing read, or null if the video has no voiceover"
    ),
  scenes: z.array(SceneSchema),
});

export type Script = z.infer<typeof ScriptSchema>;
