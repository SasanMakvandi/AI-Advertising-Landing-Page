import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ScriptWithImagesSchema } from "@/lib/generation-schemas";
import {
  deleteUploadedReferences,
  parseStoredScript,
  sanitizeScriptAssets,
} from "@/lib/blob-assets";
import { setProjectStatus } from "@/lib/project-status";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  const scriptInput = ScriptWithImagesSchema.safeParse(body?.script);

  if (!projectId || !scriptInput.success) {
    return new Response(JSON.stringify({ error: "Missing or invalid project or script" }), {
      status: 400,
    });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  const script = sanitizeScriptAssets(scriptInput.data, parseStoredScript(project.scriptJson));
  await setProjectStatus(projectId, "finalized", { scriptJson: JSON.stringify(script) });
  const uploadsCleared = await deleteUploadedReferences(projectId).catch((err) => {
    console.error("couldn't clean up uploaded references:", err);
    return false;
  });

  return new Response(JSON.stringify({ ok: true, uploadsCleared }), {
    headers: { "Content-Type": "application/json" },
  });
}
