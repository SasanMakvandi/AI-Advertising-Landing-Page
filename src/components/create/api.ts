export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function downloadHref(url: string, filename: string) {
  return `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
}

// Reads an NDJSON stream of {type:"thinking"} / {type:"progress"} /
// {type:"result"} / {type:"error"} lines, forwarding thinking and progress
// live and resolving with the final result event.
export async function streamGenerate<T extends { type: "result" }>(
  url: string,
  body: unknown,
  onThinking: (chunk: string) => void,
  onProgress?: (event: Record<string, unknown>) => void
): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(url, {
    method: "POST",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | null = null;

  function consumeLine(line: string) {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "thinking") {
      onThinking(event.text);
    } else if (event.type === "progress") {
      onProgress?.(event);
    } else if (event.type === "error") {
      throw new Error(event.message);
    } else {
      result = event;
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      consumeLine(line);
    }
  }
  if (buffer.trim()) consumeLine(buffer);

  if (!result) throw new Error("Stream ended unexpectedly");
  return result;
}
