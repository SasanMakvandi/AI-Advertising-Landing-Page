import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { BriefSchema, ScriptSchema, MAX_REVISIONS } from "@/lib/generation-schemas";
import { isAiEnabled, aiDisabledResponse } from "@/lib/features";
import { deDashDeep, NO_DASHES_RULE, SAFE_CONTENT_RULE } from "@/lib/text";
import { setProjectStatus } from "@/lib/project-status";
import { assetUrlsOf, deleteBlobs, parseStoredScript } from "@/lib/blob-assets";

export async function POST(request: Request) {
  if (!isAiEnabled()) return aiDisabledResponse();

  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  const briefInput = BriefSchema.safeParse(body?.brief);

  if (!projectId || !briefInput.success) {
    return new Response(JSON.stringify({ error: "Missing or invalid project or brief" }), {
      status: 400,
    });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  const brief = briefInput.data;

  await setProjectStatus(projectId, "generating_script", { briefJson: JSON.stringify(brief) });

  const voiceoverInstruction = project.wantsVoiceover
    ? project.wantsSubtitles
      ? "This video needs a voiceover, and its captions/subtitles will be burned in matching the voiceover word-for-word, so keep lines short and easy to read on screen."
      : "This video needs a voiceover (no on-screen subtitles)."
    : "This video has NO voiceover. It's visual-only. Set voiceoverScript and every scene's voiceover to null, and lean on the visual descriptions to carry the story.";

  const targetScenes = Math.max(2, Math.round(project.duration / 5));
  const negativeInstruction = project.negativePrompt
    ? ` Avoid the following in every scene's visuals: ${project.negativePrompt}.`
    : "";

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
            `You write short-form video ad scripts, framed for a ${project.aspectRatio} video. Given a creative brief, return a scene-by-scene shot list whose durations sum to approximately ${project.duration} seconds total, in roughly ${targetScenes} scenes, unless the brief clearly calls for something else. ${voiceoverInstruction} When there is a voiceover, each scene's voiceover line should be a slice of the full voiceoverScript, in order, covering it exactly with no gaps or repeats.${negativeInstruction} ${NO_DASHES_RULE} ${SAFE_CONTENT_RULE}`,
          messages: [
            { role: "user", content: `Creative brief:\n${JSON.stringify(brief, null, 2)}` },
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
        const script = deDashDeep(ScriptSchema.parse(JSON.parse(textBlock.text)));

        await setProjectStatus(projectId, "script_ready", {
          scriptJson: JSON.stringify(script),
        });
        await prisma.galleryItem.upsert({
          where: { projectId },
          create: {
            userId: session.user!.id,
            title: brief.productName,
            status: "script_ready",
            projectId,
          },
          update: { title: brief.productName },
        });

        // A regenerated script replaces everything built from the old one.
        await deleteBlobs(assetUrlsOf(parseStoredScript(project.scriptJson)));

        send({
          type: "result",
          projectId,
          script,
          revisionsLeft: Math.max(0, MAX_REVISIONS - project.revisionCount),
        });
      } catch (err) {
        // Fall back to the last good state so the project stays resumable.
        await setProjectStatus(projectId, project.scriptJson ? "script_ready" : "brief_ready").catch(
          () => {}
        );
        console.error("script generation failed:", err);
        send({ type: "error", message: "Couldn't generate a script. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
