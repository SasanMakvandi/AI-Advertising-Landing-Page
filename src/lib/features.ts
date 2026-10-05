// AI generation (Claude, CometAPI, ApiFrame) costs real money per request, so
// it's off unless AI_FEATURES_ENABLED is explicitly "true". Production leaves
// it unset until a paywall exists; dev/preview environments turn it on.
export function isAiEnabled(): boolean {
  return process.env.AI_FEATURES_ENABLED === "true";
}

export function aiDisabledResponse(): Response {
  return new Response(JSON.stringify({ error: "AI generation isn't available yet." }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
