import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BriefSchema, ScriptWithImagesSchema } from "@/lib/generation-schemas";
import { parseStoredScript, sanitizeScriptAssets } from "@/lib/blob-assets";

// Autosave for edits made in the brief and script steps, so a project can be
// picked back up from the gallery exactly where it was left. Costs nothing
// (no AI calls), so it isn't behind the AI flag.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  if (!projectId) {
    return new Response(JSON.stringify({ error: "Missing project" }), { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }
  if (project.status === "finalized") {
    return new Response(JSON.stringify({ ok: true, skipped: "finalized" }));
  }

  const data: { briefJson?: string; scriptJson?: string } = {};

  if (body.brief !== undefined) {
    const brief = BriefSchema.safeParse(body.brief);
    if (!brief.success) {
      return new Response(JSON.stringify({ error: "Invalid brief" }), { status: 400 });
    }
    data.briefJson = JSON.stringify(brief.data);
    if (brief.data.productName.trim()) {
      await prisma.galleryItem.updateMany({
        where: { projectId },
        data: { title: brief.data.productName.trim() },
      });
    }
  }

  if (body.script !== undefined) {
    const script = ScriptWithImagesSchema.safeParse(body.script);
    if (!script.success) {
      return new Response(JSON.stringify({ error: "Invalid script" }), { status: 400 });
    }
    data.scriptJson = JSON.stringify(
      sanitizeScriptAssets(script.data, parseStoredScript(project.scriptJson))
    );
  }

  if (Object.keys(data).length > 0) {
    await prisma.project.update({ where: { id: projectId }, data });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
