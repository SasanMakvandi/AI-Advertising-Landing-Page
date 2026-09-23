import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { BriefSchema, ScriptSchema, MAX_REVISIONS } from "@/lib/generation-schemas";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  const briefInput = BriefSchema.safeParse(body?.brief);
  const scriptInput = ScriptSchema.safeParse(body?.script);

  if (!projectId || !briefInput.success || !scriptInput.success) {
    return new Response(JSON.stringify({ error: "Missing or invalid project, brief, or script" }), {
      status: 400,
    });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  if (project.revisionCount >= MAX_REVISIONS) {
    return new Response(
      JSON.stringify({
        error: `You've used all ${MAX_REVISIONS} revisions for this project. Start a new project to keep iterating.`,
      }),
      { status: 429 }
    );
  }

  const brief = briefInput.data;
  const editedScript = scriptInput.data;

  const voiceoverInstruction = project.wantsVoiceover
    ? "This video has a voiceover — keep voiceoverScript and every scene's voiceover populated."
    : "This video has NO voiceover — keep voiceoverScript and every scene's voiceover null.";

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
            `You're refining an existing ad script based on a human editor's changes. The editor has already hand-edited some scene descriptions and/or voiceover lines below — keep their intent and their specific wording where possible, but tighten the overall flow, fix any timing/continuity issues between scenes, and make sure the voiceoverScript still reads as one smooth line combining every scene's voiceover in order. Keep the same number of scenes and roughly the same total duration unless the edits clearly require otherwise. ${voiceoverInstruction}`,
          messages: [
            {
              role: "user",
              content: `Creative brief:\n${JSON.stringify(brief, null, 2)}\n\nCurrent (editor-modified) script:\n${JSON.stringify(editedScript, null, 2)}`,
            },
          ],
          output_config: { format: zodOutputFormat(ScriptSchema), effort: "high" },
        });

        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "thinking_delta") {
            send({ type: "thinking", text: event.delta.thinking });
          }
        }

        const finalMessage = await claudeStream.finalMessage();
        const textBlock = finalMessage.content.find((b) => b.type === "text");
        if (!textBlock || textBlock.type !== "text") {
          throw new Error("Claude did not return a parseable script");
        }
        const script = ScriptSchema.parse(JSON.parse(textBlock.text));

        const updated = await prisma.project.update({
          where: { id: projectId },
          data: {
            scriptJson: JSON.stringify(script),
            revisionCount: { increment: 1 },
          },
        });

        send({
          type: "result",
          projectId,
          script,
          revisionsLeft: MAX_REVISIONS - updated.revisionCount,
        });
      } catch (err) {
        console.error("script revision failed:", err);
        send({ type: "error", message: "Couldn't revise the script — please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
