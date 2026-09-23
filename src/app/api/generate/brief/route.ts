import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { BriefSchema } from "@/lib/generation-schemas";
import { saveUploadedImages } from "@/lib/uploads";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const prompt = form.get("prompt")?.toString().trim();
  const wantsVoiceover = form.get("wantsVoiceover")?.toString() !== "false";
  const wantsSubtitles = wantsVoiceover && form.get("wantsSubtitles")?.toString() === "true";
  const duration = Math.max(1, Number(form.get("duration")) || 20);
  const aspectRatio = form.get("aspectRatio")?.toString() || "9:16";
  const resolution = form.get("resolution")?.toString() || "1080p";
  const negativePrompt = form.get("negativePrompt")?.toString().trim() || null;

  if (!prompt) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
  }

  let assetUrls: string[] = [];
  let toneReferenceUrls: string[] = [];
  try {
    assetUrls = await saveUploadedImages(form.getAll("assets") as File[], "assets");
    toneReferenceUrls = await saveUploadedImages(form.getAll("toneRefs") as File[], "tone-refs");
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Couldn't save uploaded images" }),
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      prompt,
      wantsVoiceover,
      wantsSubtitles,
      duration,
      aspectRatio,
      resolution,
      negativePrompt,
      assetUrls: JSON.stringify(assetUrls),
      toneReferenceUrls: JSON.stringify(toneReferenceUrls),
      status: "extracting_brief",
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: object) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }

      try {
        const claudeStream = anthropic.messages.stream({
          model: GENERATION_MODEL,
          max_tokens: 4096,
          thinking: { type: "adaptive", display: "summarized" },
          system:
            "You turn a short, sometimes vague description of an ad request into a structured creative brief. Infer sensible details where the input doesn't spell them out, but don't invent specific facts (like exact prices) that aren't stated or clearly implied." +
            (negativePrompt ? ` The advertiser wants to avoid: ${negativePrompt}.` : ""),
          messages: [{ role: "user", content: prompt }],
          output_config: { format: zodOutputFormat(BriefSchema), effort: "high" },
        });

        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "thinking_delta") {
            send({ type: "thinking", text: event.delta.thinking });
          }
        }

        const finalMessage = await claudeStream.finalMessage();
        const textBlock = finalMessage.content.find((b) => b.type === "text");
        if (!textBlock || textBlock.type !== "text") {
          throw new Error("Claude did not return a parseable brief");
        }
        const brief = BriefSchema.parse(JSON.parse(textBlock.text));

        await prisma.project.update({
          where: { id: project.id },
          data: { briefJson: JSON.stringify(brief), status: "brief_ready" },
        });

        send({ type: "result", projectId: project.id, brief });
      } catch (err) {
        await prisma.project
          .update({ where: { id: project.id }, data: { status: "error" } })
          .catch(() => {});
        console.error("brief extraction failed:", err);
        send({ type: "error", message: "Couldn't generate a brief — please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
