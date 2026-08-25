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

export const projects = [
  {
    tag: "Social ads",
    title: "Northlight Coffee",
    description:
      "Northlight needed a steady stream of scroll-stopping ads without hiring a full creative team. We generated dozens of directions with AI, then hand-picked and finished the ones that actually looked like their brand.",
    result: { label: "Result: ", highlight: "3x", rest: " more ad variations tested per month" },
    gradient: "linear-gradient(155deg,#5457FF,#4B4EFF)",
  },
  {
    tag: "Brand launch",
    title: "Vantage Running Co.",
    description:
      "A brand-new running shoe line needed a full identity and launch campaign in three weeks. AI got the first concepts moving fast — our creative director shaped it into something that actually felt premium.",
    result: { label: "Result: full brand and launch campaign in ", highlight: "18 days", rest: "" },
    gradient: "linear-gradient(155deg,#FF7455,#FF5C39)",
  },
  {
    tag: "Video & motion",
    title: "Hearth Insurance",
    description:
      "Insurance ads are usually forgettable. We used AI to storyboard and rough-cut a dozen concepts, then shot and finished the strongest one with a real production pass.",
    result: { label: "Result: production time cut by ", highlight: "60%", rest: "" },
    gradient: "linear-gradient(155deg,#211E19,#4B4EFF)",
  },
];

export const clients = ["Northlight", "Vantage", "Hearth", "Foundry", "Basin", "Lumen"];

export const reels = [
  {
    gradient: "linear-gradient(155deg,#5457FF,#211E19,#4B4EFF)",
    handle: "@adnova",
    caption: "Behind the scan — how we shoot a campaign in half the time",
    likes: "1.2k",
    comments: "84",
    note: {
      index: "01 — Behind the scan",
      title: "How we shoot a campaign in half the time",
      body: "AI drafted twelve directions overnight. Our creative director picked the strongest one and reworked the framing, color, and pacing until it actually looked like ours — not a template.",
    },
  },
  {
    gradient: "linear-gradient(155deg,#FF7455,#211E19,#FF5C39)",
    handle: "@adnova",
    caption: "Vantage Running Co. — from AI draft to finished brand in 18 days",
    likes: "2.4k",
    comments: "112",
    note: {
      index: "02 — Vantage Running Co.",
      title: "From AI draft to finished brand in 18 days",
      body: "A brand-new shoe line needed a full identity fast. AI moved the early concepts along quickly — the logo, palette, and tone you see here were shaped by hand once the direction was clear.",
    },
  },
  {
    gradient: "linear-gradient(155deg,#211E19,#4B4EFF,#8385FF)",
    handle: "@adnova",
    caption: "Hearth Insurance — the concept that made the cut",
    likes: "908",
    comments: "47",
    note: {
      index: "03 — Hearth Insurance",
      title: "The concept that made the cut",
      body: "We storyboarded a dozen ideas with AI and only shot the one that actually landed. Cut the usual back-and-forth, and the production budget, way down.",
    },
  },
  {
    gradient: "linear-gradient(155deg,#FF5C39,#211E19,#4B4EFF)",
    handle: "@adnova",
    caption: "A day in the studio — on-location shoot for Foundry Home Goods",
    likes: "1.6k",
    comments: "63",
    note: {
      index: "04 — Foundry Home Goods",
      title: "A day in the studio, on location",
      body: "Once the AI draft nailed the mood, we brought it into a real shoot — natural light, real product, a crew on site for the day to get it right.",
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
