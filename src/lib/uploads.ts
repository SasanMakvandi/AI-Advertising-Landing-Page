import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

// Saves uploaded images to public/uploads/<category>/ and returns their
// public URLs. Throws on an oversized or wrong-type file.
export async function saveUploadedImages(files: File[], category: string): Promise<string[]> {
  const real = files.filter((f) => f instanceof File && f.size > 0);
  if (real.length === 0) return [];

  const uploadDir = path.join(process.cwd(), "public", "uploads", category);
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const file of real) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`${file.name} is over 8MB`);
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`${file.name} must be PNG, JPEG, or WebP`);
    }
    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    urls.push(`/uploads/${category}/${filename}`);
  }
  return urls;
}
