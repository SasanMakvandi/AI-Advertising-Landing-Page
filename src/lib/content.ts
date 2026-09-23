export const brand = {
  name: "reelsimple",
  tagline: "AI-engineered, humanly directed production",
};

export const navLinks = [
  { label: "Work", href: "/#work" },
  { label: "What we do", href: "/what-we-do" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const capabilities = [
  "Social ads",
  "Real estate & listing photos",
  "Product photography",
  "Video & motion",
  "Brand identity",
  "Website & landing pages",
  "Copywriting",
];

export const promptDemo = {
  eyebrow: "See it in action",
  headline: "Here's exactly how a video gets made.",
  steps: [
    { id: 1, title: "Scripting", provider: "Claude" },
    { id: 2, title: "Reference images", provider: "Gen-3" },
    { id: 3, title: "Video generation", provider: "Seedance · Cling" },
    { id: 4, title: "Audio", provider: "ElevenLabs · optional" },
    { id: 5, title: "Subtitles", provider: "optional" },
  ],

  // Step 1 — scripting
  placeholderPrompt:
    "A 20-second Instagram Reel for our new ceramic pour-over coffee set — clean, minimal, morning light.",
  brandNote: "Using your brand profile — warm, minimal, coral accent (edit anytime in Settings)",
  campaignTweaks: [
    {
      label: "Tone",
      options: ["Playful", "Premium", "Warm", "Urgent"],
      defaultIndex: 1,
      allowCustom: true,
    },
    {
      label: "After watching",
      options: ["Learn more", "Shop now", "Visit site", "Follow us"],
      defaultIndex: 0,
      allowCustom: true,
    },
  ],
  formatTweaks: [
    {
      label: "Length",
      options: ["10s", "15s", "20s", "25s", "30s"],
      defaultIndex: 2,
    },
    {
      label: "Ratio",
      options: ["9:16", "1:1", "16:9", "4:5"],
      defaultIndex: 0,
    },
  ],
  continueCta: "Continue",
  customOptionLabel: "Or type your own",
  customPlaceholder: "Type your own...",
  generateScriptCta: "Generate script & voiceover",
  voiceoverScript:
    "Some mornings deserve more than instant coffee. Meet the pour-over set built for the ritual — hand-glazed ceramic, a slow bloom, and a cup that tastes like you meant it. Available now.",
  scenes: [
    {
      order: 1,
      shotType: "Close-up",
      duration: 5,
      description:
        "Slow push-in on the pour-over set, steam curling upward, soft morning light through a window.",
      voiceover: "Some mornings deserve more than instant coffee.",
      gradient: "linear-gradient(135deg, #4B4EFF, #211E19)",
    },
    {
      order: 2,
      shotType: "Wide",
      duration: 5,
      description: "Water arcing into the dripper in slow motion, coffee blooming beneath.",
      voiceover: "Meet the pour-over set built for the ritual.",
      gradient: "linear-gradient(135deg, #FF5C39, #4B4EFF)",
    },
    {
      order: 3,
      shotType: "Lifestyle",
      duration: 5,
      description: "Hands wrapped around the finished mug at a sunlit table.",
      voiceover: "A slow bloom. A cup that tastes like you meant it.",
      gradient: "linear-gradient(135deg, #E4DECF, #FF5C39)",
    },
    {
      order: 4,
      shotType: "Macro",
      duration: 5,
      description: "Detail shot of the ceramic glaze and texture, logo subtly in frame.",
      voiceover: "Hand-glazed ceramic. Available now.",
      gradient: "linear-gradient(135deg, #211E19, #4B4EFF)",
    },
  ],

  // Step 2 — reference images
  refImageNote:
    "Physical product? Include a size-reference photo (a coin, a hand) so proportions stay accurate once it's generated.",
  refImageGateQuestion: "Happy with these as the visual anchor for each scene?",
  refImageRedoNote: "Sends you back to review the script (goals, branding, campaign, format) before we try again.",

  // Step 3 — video generation
  videoProviders: [
    { name: "Seedance", limit: "up to 30s per clip — longer videos are stitched from multiple clips" },
    { name: "Cling", limit: "up to 15s per clip" },
  ],
  videoGateQuestion: "Happy with the generated video?",
  videoRedoNote: "Sends you back to the reference images — redoing this step uses additional generation credits.",

  // Step 4 — audio (optional)
  voices: [
    { name: "Aria", style: "Warm & conversational" },
    { name: "Atlas", style: "Confident & bold" },
    { name: "Nova", style: "Upbeat & playful" },
    { name: "Sable", style: "Calm & premium" },
  ],
  audioGateQuestion: "Sound good?",

  // Step 5 — subtitles (optional)
  subtitleStyles: ["Bold & centered", "Minimal lower-third", "Karaoke highlight"],
  subtitleGateQuestion: "Look good?",

  doneHeadline: "Your video is ready.",
  doneNote: "This walkthrough is a preview of the real flow — nothing above was actually generated.",
  finalCta: "Start a real project",

  assetsPanelTitle: "Your assets",
  scriptAssetLabel: "Script",
  picturesAssetLabel: "Pictures",
  videoAssetLabel: "Video",
  notGeneratedYet: "Not generated yet",
};

type Project = {
  tag: string;
  title: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
  description: string;
  result: { label: string; highlight: string; rest: string };
  video?: string;
  images?: string[];
  gradient?: string;
};

export const projects: Project[] = [
  {
    tag: "Flagship product launch",
    title: "Alpéire",
    logo: "/logos/alpeire.svg",
    logoWidth: 605,
    logoHeight: 143,
    description:
      "Alpéire's oxygen-infused, alpine-stem-cell skincare needed product content that felt as premium as the formula. We generated dozens of AI concept directions, then finished the strongest ones until they looked shelf-ready — no full studio shoot required for every SKU.",
    result: { label: "Result: ", highlight: "3x", rest: " more ad variations tested per month" },
    video: "/videos/showcase-2.mp4",
  },
  {
    tag: "Product advertisement",
    title: "Techniques Combat",
    logo: "/logos/techniques-combat.png",
    logoWidth: 400,
    logoHeight: 66,
    description:
      "Techniques Combat needed launch creative that matched their \"Relentless by Design\" ethos — gear built by fighters, for fighters, tested in real camps. AI got the first concepts moving fast; our creative director shaped it into something that felt premium enough to trust in the cage.",
    result: { label: "Result: full brand and launch campaign in ", highlight: "18 days", rest: "" },
    video: "/videos/showcase-1.mp4",
  },
  {
    tag: "Concept modeled and rendered",
    title: "RENNtech",
    logo: "/logos/renntech.png",
    logoWidth: 1240,
    logoHeight: 272,
    description:
      "RENNtech needed cinematic content that matched 35 years of precision Mercedes-Benz engineering — performance without compromise, in frame as well as under the hood. We generated the concept with AI, then art-directed the lighting and composition until it felt like a real campaign shoot.",
    result: { label: "Result: production time cut by ", highlight: "60%", rest: "" },
    images: ["/images/renntech-shop.png", "/images/renntech-driveway.png"],
  },
];

export const clients = [
  { name: "Alpéire", logo: "/logos/alpeire.svg", width: 605, height: 143 },
  { name: "Techniques Combat", logo: "/logos/techniques-combat.png", width: 400, height: 66 },
  { name: "RENNtech", logo: "/logos/renntech.png", width: 1240, height: 272 },
  { name: "GORZ", logo: "/logos/gorz.png", width: 249, height: 23, invert: true },
  { name: "Caspien Kebabs", logo: "/logos/caspien-kebabs.png", width: 120, height: 60, invert: true },
  { name: "Built By Fred", logo: "/logos/built-by-fred.png", width: 158, height: 35 },
];

type Reel = {
  handle: string;
  caption: string;
  likes: string;
  comments: string;
  note: { index: string; title: string; body: string };
  video?: string;
  gradient?: string;
};

export const reels: Reel[] = [
  {
    video: "/videos/reel-1.mp4",
    handle: "@reelsimple",
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
    handle: "@reelsimple",
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
    handle: "@reelsimple",
    caption: "RENNtech — a sponsored post built to pass as organic",
    likes: "3.1k",
    comments: "156",
    note: {
      index: "03 — RENNtech",
      title: "Built to pass as organic",
      body: "For the V12 Sledgehammer launch, sometimes the win is when nobody can tell it's sponsored. We built this one to sit indistinguishable from the feed around it — verified badge, native caption, the whole format baked directly into the creative.",
    },
  },
];

export const pricing = [
  {
    name: "AI Content",
    price: "$600",
    priceSuffix: "/ 2 pieces of content",
    description: "AI-generated photo or video content, ready to use — for ads, listings, or anything else you need.",
    features: [
      "AI-generated photo or video concepts and edits",
      "Sized for the platform or use case you need",
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
      "Everything in AI Content, plus a real photo or video shoot and a full human art-direction pass.",
    features: [
      "Everything in AI Content",
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
  headline: "We started ReelSimple because good photo and video content was costing ",
  headlineEm: "too much",
  headlineEnd: " to make.",
  paragraphs: [
    "Most studios either cut corners to hit a budget, or charge full production rates no matter how small the job is. We didn't think you should have to choose. So we built a process that uses AI to handle the expensive, time-consuming part of a shoot — and kept a real creative director on every project to make sure it never looks like it.",
    "We're a small team based in Toronto, working with small businesses, realtors, and anyone else who needs professional photo or video content without paying for a full production crew every time.",
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
    body: "For campaigns that call for it, we ship variants, watch what performs, and feed that back into the next round instead of guessing what to make next.",
  },
  {
    index: "06",
    title: "Launch & handoff",
    body: "You get finished, ready-to-use assets — sized for every platform or use case — plus the reasoning behind why we made the choices we did.",
  },
];

export const costBreakdown = {
  eyebrow: "Let's talk numbers",
  headline: "Okay, enough talking — let's talk numbers.",
  description:
    "Here's what it usually costs to launch a brand from scratch, piecing it together with a separate freelancer or agency for each part.",
  items: [
    { label: "Brand identity & logo design", cost: "$2,000–$5,000" },
    { label: "A professional ad photo or video shoot", cost: "$1,500–$4,000" },
    { label: "Advertising & marketing consultation", cost: "$150–$300 / hr" },
    { label: "Website design & development", cost: "$3,000–$8,000" },
    { label: "Ongoing site maintenance & hosting", cost: "$100–$300 / mo" },
    { label: "Copywriting for your site and ads", cost: "$500–$1,500" },
    { label: "Coordinating five different freelancers", cost: "Countless hours" },
  ],
  punchlineStart: "With ReelSimple, none of that is separate. ",
  punchlineEm: "One package, one team,",
  punchlineEnd: " tailored to exactly what you need.",
};

export const services = [
  {
    title: "Social ads",
    description: "Scroll-stopping creative sized and paced for the feed it's actually running in.",
  },
  {
    title: "Real estate & listing photos",
    description: "Staged, magazine-ready shots for a listing — without the cost of a full physical staging and shoot.",
  },
  {
    title: "Product photography",
    description: "Clean, shelf-ready product and lifestyle shots, generated and art-directed until they look real.",
  },
  {
    title: "Brand identity",
    description: "Logo, palette, type, and tone — built to hold up across every surface you'll use it on.",
  },
  {
    title: "Video & motion",
    description: "From AI-assisted rough cuts to fully produced spots, for an ad campaign or anything else you need in motion.",
  },
  {
    title: "Website & landing pages",
    description: "Fast, on-brand pages built to convert the traffic you send them.",
  },
  {
    title: "Copywriting",
    description: "Headlines and body copy tuned per platform, not copy-pasted across all of them.",
  },
];

export const footer = {
  eyebrow: "Start your project",
  headline:
    "Tell us what you need shot. We'll have real content back to you before your next coffee runs out.",
  location: "Toronto, ON",
  email: "hello@reelsimple.ai",
};
