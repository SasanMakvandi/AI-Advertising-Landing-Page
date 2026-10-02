import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function POST(request: Request) {
  const form = await request.formData();

  const firstName = form.get("firstName")?.toString().trim();
  const lastName = form.get("lastName")?.toString().trim();
  const email = form.get("email")?.toString().trim().toLowerCase();
  const password = form.get("password")?.toString();
  const confirmPassword = form.get("confirmPassword")?.toString();
  const organization = form.get("organization")?.toString().trim() || null;
  const role = form.get("role")?.toString().trim() || null;
  const slogan = form.get("slogan")?.toString().trim() || null;
  const logo = form.get("logo");

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords don't match" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  let logoUrl: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: "Logo must be under 5MB" }, { status: 400 });
    }
    if (!ALLOWED_LOGO_TYPES.includes(logo.type)) {
      return NextResponse.json({ error: "Logo must be a PNG, JPEG, WebP, or SVG image" }, { status: 400 });
    }

    const ext = path.extname(logo.name) || `.${logo.type.split("/")[1]}`;
    const blob = await put(`logos/${randomUUID()}${ext}`, logo, {
      access: "public",
      contentType: logo.type,
    });
    logoUrl = blob.url;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      organization,
      role,
      slogan,
      logoUrl,
    },
  });

  return NextResponse.json({ ok: true });
}
