import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, message } = body ?? {};

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // TODO: wire this up to email/CRM/DB. Logging for now so the form works end-to-end.
  console.log("New contact submission:", body);

  return NextResponse.json({ ok: true });
}
