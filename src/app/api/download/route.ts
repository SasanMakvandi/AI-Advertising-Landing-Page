import { auth } from "@/auth";

// Proxies a Blob file back with Content-Disposition: attachment so the
// browser saves it instead of navigating to it — Vercel Blob doesn't set
// that header itself.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "download";

  if (!url || !url.startsWith("https://") || !url.includes(".public.blob.vercel-storage.com/")) {
    return new Response(JSON.stringify({ error: "Invalid file URL" }), { status: 400 });
  }

  const fileRes = await fetch(url);
  if (!fileRes.ok || !fileRes.body) {
    return new Response(JSON.stringify({ error: "Couldn't fetch the file" }), { status: 502 });
  }

  return new Response(fileRes.body, {
    headers: {
      "Content-Type": fileRes.headers.get("Content-Type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
    },
  });
}
