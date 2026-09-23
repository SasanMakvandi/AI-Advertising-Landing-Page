import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ScriptSchema } from "@/lib/generation-schemas";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId as string | undefined;
  const scriptInput = ScriptSchema.safeParse(body?.script);

  if (!projectId || !scriptInput.success) {
    return new Response(JSON.stringify({ error: "Missing or invalid project or script" }), {
      status: 400,
    });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { scriptJson: JSON.stringify(scriptInput.data), status: "finalized" },
  });

  await prisma.galleryItem.update({
    where: { projectId },
    data: { status: "finalized" },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
