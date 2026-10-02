import { randomUUID } from "crypto";
import path from "path";
import { put } from "@vercel/blob";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

// Uploads images to Vercel Blob storage under <category>/ and returns their
// public URLs. Throws on an oversized or wrong-type file. Blob storage (not
// the local filesystem) is required because Vercel's serverless functions
// have a read-only filesystem in production.
export async function saveUploadedImages(files: File[], category: string): Promise<string[]> {
  const real = files.filter((f) => f instanceof File && f.size > 0);
  if (real.length === 0) return [];

  const urls: string[] = [];
  for (const file of real) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`${file.name} is over 8MB`);
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`${file.name} must be PNG, JPEG, or WebP`);
    }
    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const blob = await put(`${category}/${randomUUID()}${ext}`, file, {
      access: "public",
      contentType: file.type,
    });
    urls.push(blob.url);
  }
  return urls;
}
