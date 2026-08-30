export const brand = {
  name: "adnova",
  tagline: "AI-engineered, humanly directed",
};

export const navLinks = [
  { label: "Work", href: "/#work" },
  { label: "What we do", href: "/what-we-do" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const capabilities = [
  "Social ads",
  "Brand identity",
  "Video & motion",
  "Website & landing pages",
  "Copywriting",
];

type Project = {
  tag: string;
  title: string;
  description: string;
  result: { label: string; highlight: string; rest: string };
  video?: string;
  gradient?: string;
};

export const projects: Project[] = [
  {
    tag: "Social ads",
    title: "Alpéire",
    description:
      "Alpéire needed scroll-stopping product content without a full studio shoot for every SKU. We generated dozens of concept directions with AI, then finished the strongest ones until they looked shelf-ready.",
    result: { label: "Result: ", highlight: "3x", rest: " more ad variations tested per month" },
    video: "/videos/showcase-2.mp4",
  },
  {
    tag: "Brand launch",
    title: "Technos Fight Gear",
    description:
      "A new combat-sports apparel line needed a full product launch in three weeks. AI got the first concepts moving fast — our creative director shaped it into something that actually felt premium.",
    result: { label: "Result: full brand and launch campaign in ", highlight: "18 days", rest: "" },
    video: "/videos/showcase-1.mp4",
  },
  {
    tag: "Video & motion",
    title: "Hearth Insurance",
    description:
      "Insurance ads are usually forgettable. We used AI to storyboard and rough-cut a dozen concepts, then shot and finished the strongest one with a real production pass.",
    result: { label: "Result: production time cut by ", highlight: "60%", rest: "" },
    video: "/videos/showcase-3.mp4",
  },
];

export const clients = ["Northlight", "Vantage", "Hearth", "Foundry", "Basin", "Lumen"];

type Reel = {
  handle: string;
  caption: string;
  likes: string;
  comments: string;
  note: { index: string; title: string; body: string };
  video?: string;
  gradient?: string;
  /** Video already has its own baked-in post UI — skip our overlay so they don't stack. */
  hideOverlay?: boolean;
};

export const reels: Reel[] = [
  {
    video: "/videos/reel-1.mp4",
    handle: "@adnova",
    caption: "Alpéire, on location — shooting the beach concept for Super Hydrating Cream",
    likes: "1.2k",
    comments: "84",
    note: {
      index: "01 — Alpéire, on location",
      title: "Taking the concept to a real shoot",
      body: "The AI-generated concept nailed the mood, so we brought it to an actual coastal shoot — real product, real light, real texture. That pass is what separates an ad that looks generated from one that looks intentional.",
    },
  },
  {
    video: "/videos/reel-3.mp4",
    handle: "@adnova",
    caption: "Sourcing the story — the alpine rose fields behind Alpéire's hero ingredient",
    likes: "2.4k",
    comments: "112",
    note: {
      index: "02 — The ingredient story",
      title: "Where the rose extract actually comes from",
      body: "Every Alpéire product leans on its ingredient story. We shot the sourcing itself — not a stock photo of a flower — so the claim on the label has something real behind it.",
    },
  },
  {
    video: "/videos/reel-2.mp4",
    handle: "@adnova",
    caption: "Built to pass as organic — a sponsored post that doesn't read as one",
    likes: "—",
    comments: "—",
    hideOverlay: true,
    note: {
      index: "03 — The ad that didn't look like one",
      title: "Built to pass as organic",
      body: "Sometimes the win is when nobody can tell it's sponsored. We designed this one to sit indistinguishable from the feed around it — verified badge, native caption, the whole format — baked directly into the creative.",
    },
  },
];

export const pricing = [
  {
    name: "Promotional video",
    price: "$600",
    priceSuffix: "/ 2 pieces of content",
    description: "AI-generated promotional video content, ready to run on your platforms.",
    features: [
      "AI-generated video concepts and edits",
      "Sized for the platforms you run on",
      "Matched to your existing brand",
      "Delivered within a few days",
    ],
    cta: "Get started",
    featured: false,
  },
  {
    name: "AI + Shoot",
    badge: "Most popular",
    description:
      "Everything in Promotional video, plus a real photo or video shoot and a full human art-direction pass.",
    features: [
      "Everything in Promotional video",
      "On-location photo or video shoot",
      "Art-directed by our team",
      "Multiple formats for every platform",
    ],
    cta: "Talk to us",
    featured: true,
  },
  {
    name: "Full Campaign",
    description:
      "A complete campaign we help run for you — strategy, creative, and ongoing social support.",
    features: [
      "Everything in AI + Shoot",
      "Strategy consultation",
      "Social media management",
      "Ongoing optimization",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

export const about = {
  eyebrow: "About us",
  headline: "We started adnova because good ads were taking ",
  headlineEm: "too long",
  headlineEnd: " to make.",
  paragraphs: [
    "Most agencies either move fast and it shows, or they take their time and it costs a fortune. We didn't think you should have to choose. So we built a process that uses AI to do the slow, repetitive part of creative production — and kept a real creative director on every project to make sure it never looks like it.",
    "We're a small team based in Toronto, working with brands who'd rather spend their budget on media than on production overhead.",
  ],
};

export const values = [
  {
    title: "Speed without slop",
    description:
      "AI gets a first draft moving in hours, not weeks — but nothing ships until a person has actually looked at it.",
  },
  {
    title: "Direction, not automation",
    description:
      "We're not a tool you rent. We're a creative team that happens to use AI well.",
  },
  {
    title: "Small team, real accountability",
    description:
      "No account managers relaying messages. You talk directly to the people making your work.",
  },
];

export const team = [
  {
    name: "Founder Name",
    role: "Creative Direction",
    bio: "Leads brand and art direction, keeping AI output on-brand and on-message.",
  },
  {
    name: "Founder Name",
    role: "Engineering",
    bio: "Builds the pipelines and tooling that turn AI generation into production-ready creative.",
  },
  {
    name: "Founder Name",
    role: "Strategy & Growth",
    bio: "Owns campaign strategy, media buying, and the performance data that feeds every iteration.",
  },
];

export const processSteps = [
  {
    index: "01",
    title: "Brief & discovery",
    body: "We start with a short call to understand your brand, your audience, and what 'good' actually looks like for you — not just the deliverable list.",
  },
  {
    index: "02",
    title: "AI-assisted concepting",
    body: "We generate a wide spread of directions fast — dozens of headlines, visual concepts, and angles — so we're picking from real options, not guessing at the first idea.",
  },
  {
    index: "03",
    title: "Creative direction",
    body: "A real creative director throws out most of it and shapes what's left until it actually sounds and looks like your brand, not a generic AI output.",
  },
  {
    index: "04",
    title: "Production, when it's warranted",
    body: "If the concept calls for it, we bring in a real shoot — photo, video, or both — to finish what AI could only sketch.",
  },
  {
    index: "05",
    title: "Testing & iteration",
    body: "We ship variants, watch what performs, and feed that back into the next round instead of guessing what to make next.",
  },
  {
    index: "06",
    title: "Launch & handoff",
    body: "You get finished assets sized for every platform you're running on, plus the reasoning behind why we made the choices we did.",
  },
];

export const services = [
  {
    title: "Social ads",
    description: "Scroll-stopping creative sized and paced for the feed it's actually running in.",
  },
  {
    title: "Brand identity",
    description: "Logo, palette, type, and tone — built to hold up across every surface you'll use it on.",
  },
  {
    title: "Video & motion",
    description: "From AI-assisted rough cuts to fully produced spots.",
  },
  {
    title: "Website & landing pages",
    description: "Fast, on-brand pages built to convert the traffic your ads send.",
  },
  {
    title: "Copywriting",
    description: "Headlines and body copy tuned per platform, not copy-pasted across all of them.",
  },
];

export const footer = {
  eyebrow: "Launch your campaign",
  headline:
    "Tell us what you sell. We'll have a real campaign back to you before your next coffee runs out.",
  location: "Toronto, ON",
  email: "hello@adnova.ai",
};
