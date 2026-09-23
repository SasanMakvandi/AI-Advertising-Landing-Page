# ReelSimple

Marketing site for **ReelSimple**, an AI-engineered, humanly-directed production studio that helps cut the cost of photo and video shoots — for ad campaigns, real estate listing photos, product shots, and more. Built with Next.js and Tailwind CSS.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Framer Motion](https://www.framer.com/motion/) for scroll and interaction animations
- [Lucide](https://lucide.dev) for icons
- [Auth.js (next-auth v5)](https://authjs.dev) + [Prisma](https://www.prisma.io) + SQLite for accounts

## Pages

| Route | Description |
| --- | --- |
| `/` | Home — hero with a draggable before/after reveal, capability strip, work showcase, client logos, phone/reel feed, pricing, and the interactive generation-flow demo |
| `/about` | Studio story, working principles, and team |
| `/what-we-do` | Step-by-step process, from brief to launch |
| `/contact` | Contact form, wired to `/api/contact` |
| `/signup` | Create an account (name, email, password, occupation, company, branding) |
| `/login` | Log in to an existing account |
| `/dashboard` | Protected — redirects to `/login` if signed out. Shows the user's content gallery. |

## Getting started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root (not committed) with:

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<random string — generate with: openssl rand -base64 32>"
```

Set up the database (creates `prisma/dev.db` from the committed migrations):

```bash
npx prisma migrate deploy
```

Then start the dev server:

```bash
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

## Accounts & database

Real signup/login, backed by Prisma + a local SQLite file (`prisma/dev.db`, not committed — only the migrations under `prisma/migrations/` are):

- `prisma/schema.prisma` — `User` (name, email, hashed password, occupation, company, branding) and `GalleryItem` models
- `src/auth.ts` — Auth.js config (Credentials provider, JWT sessions, bcrypt password check)
- `src/app/api/signup/route.ts` — creates a user (bcrypt-hashes the password, rejects duplicate emails)
- `src/app/dashboard/page.tsx` — server-rendered, redirects to `/login` if there's no session; lists the signed-in user's `GalleryItem` rows

**Not done yet:** actual content generation (the homepage demo is still a static walkthrough), so the gallery has nothing to show until that's wired up. Before deploying anywhere beyond local dev, swap SQLite for a hosted Postgres (e.g. Supabase or Neon) — a SQLite file doesn't survive serverless deploys (Vercel) or multiple instances.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Deployment

The easiest path is [Vercel](https://vercel.com/new), the creators of Next.js — connect this repo and it deploys on every push to `main`.
