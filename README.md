# adnova

Marketing site for **adnova**, an AI-engineered, humanly-directed advertising studio. Built with Next.js and Tailwind CSS.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Framer Motion](https://www.framer.com/motion/) for scroll and interaction animations
- [Lucide](https://lucide.dev) for icons

## Pages

| Route | Description |
| --- | --- |
| `/` | Home — hero with a draggable before/after reveal, capability strip, work showcase, client logos, phone/reel feed, and pricing |
| `/about` | Studio story, working principles, and team |
| `/what-we-do` | Step-by-step process, from brief to launch |
| `/contact` | Contact form, wired to `/api/contact` |

## Getting started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Project structure

```
src/
├─ app/
│  ├─ page.tsx              # Home
│  ├─ about/page.tsx
│  ├─ contact/page.tsx
│  ├─ what-we-do/page.tsx
│  ├─ api/contact/route.ts  # Contact form submission endpoint
│  └─ layout.tsx            # Shared nav, footer, fonts
├─ components/               # Page sections (Hero, Showcase, Pricing, etc.)
└─ lib/content.ts            # Site copy and structured content
```

Site copy (nav labels, project case studies, pricing tiers, team bios, etc.) lives in [`src/lib/content.ts`](src/lib/content.ts), separate from component markup, so content can be edited without touching layout code.

## Contact form

Submissions POST to `src/app/api/contact/route.ts`, which currently logs the payload. Wire this up to an email or CRM provider (e.g. [Resend](https://resend.com)) before going live.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Deployment

The easiest path is [Vercel](https://vercel.com/new), the creators of Next.js — connect this repo and it deploys on every push to `main`.
