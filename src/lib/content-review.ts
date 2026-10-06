// A quick, free check for wording that the image and video models tend to
// reject. It is a heuristic, not a guarantee: it only flags obvious terms so
// people can adjust before paying for a generation that would be refused.

export type ReviewFlag = {
  severity: "caution" | "tip";
  label: string;
  matches: string[];
};

const RULES: { severity: ReviewFlag["severity"]; label: string; pattern: RegExp }[] = [
  {
    severity: "caution",
    label: "Sexual or nude content",
    pattern: /\b(nude|naked|nsfw|porn\w*|erotic\w*|sexual\w*|sexy|topless|lingerie|fetish)\b/gi,
  },
  {
    severity: "caution",
    label: "Graphic violence",
    pattern: /\b(gore|gory|blood\w*|murder\w*|corpse\w*|dead bod\w+|decapitat\w*|tortur\w*|massacre|mutilat\w*)\b/gi,
  },
  {
    severity: "caution",
    label: "Weapons or drugs",
    pattern: /\b(gun|guns|firearm\w*|rifle|pistol|bomb|explosive\w*|cocaine|heroin|meth|overdose)\b/gi,
  },
  {
    severity: "caution",
    label: "Self-harm or hate",
    pattern: /\b(suicide|self[- ]harm|racist|nazi|terroris\w*)\b/gi,
  },
  {
    severity: "caution",
    label: "Real or famous people",
    pattern: /\b(celebrit\w*|famous (person|actor|singer|athlete)|lookalike|politician\w*|president)\b/gi,
  },
  {
    severity: "caution",
    label: "Copyrighted characters or brands",
    pattern:
      /\b(disney|marvel|pixar|pokemon|mickey mouse|spider-?man|batman|superman|harry potter|star wars|barbie|hello kitty)\b/gi,
  },
  {
    severity: "tip",
    label: "Realistic people",
    pattern:
      /\b(person|people|man|men|woman|women|girl|boy|child|children|kid|kids|baby|model|portrait|selfie|face|faces|customer|customers|family|couple)\b/gi,
  },
];

export function reviewText(text: string | null | undefined): ReviewFlag[] {
  if (!text) return [];
  const flags: ReviewFlag[] = [];
  for (const rule of RULES) {
    const found = text.match(rule.pattern);
    if (found) {
      flags.push({
        severity: rule.severity,
        label: rule.label,
        matches: [...new Set(found.map((m) => m.toLowerCase()))],
      });
    }
  }
  return flags;
}

export const PEOPLE_TIP =
  "The video model rejects reference images with realistic faces, so scenes with people are the most likely to fail. Product shots, hands, or stylized figures are safer.";
