import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = (body?.title as string | undefined)?.trim();

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const item = await prisma.galleryItem.create({
    data: {
      userId: session.user.id,
      title,
      status: "ready",
    },
  });

  return NextResponse.json({ item });
}
