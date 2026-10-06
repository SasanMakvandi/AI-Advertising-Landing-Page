// Em/en dashes read as machine-written, so AI output is cleaned before it is
// shown or stored. Number ranges become "to", everything else a comma.
export function deDash(text: string): string {
  return text
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 to $2")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/,\s*,/g, ",");
}

export function deDashDeep<T>(value: T): T {
  if (typeof value === "string") return deDash(value) as T;
  if (Array.isArray(value)) return value.map((v) => deDashDeep(v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deDashDeep(v)])
    ) as T;
  }
  return value;
}

export const NO_DASHES_RULE =
  "Never use em dashes or en dashes in any text you write; use commas, periods, or colons instead.";

// Seedance and the image model refuse some content outright, and a refused
// scene still costs a retry. Steering Claude away from it up front is free.
export const SAFE_CONTENT_RULE =
  "Keep every scene safe for AI image and video generators, which reject some content: no nudity or sexual content, graphic violence or gore, hate, drugs, self-harm, real or famous people, copyrighted characters, or trademarked logos. Avoid close-ups of realistic human faces; favor product-focused shots, hands, silhouettes, or stylized figures instead. If the request asks for something like that, write the closest safe alternative without mentioning the change.";
