import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreatePanel } from "@/components/CreatePanel";
import { Gallery, type GalleryCard } from "@/components/Gallery";
import type { InitialProject } from "@/components/create/types";
import { isAiEnabled } from "@/lib/features";
import { BriefSchema } from "@/lib/generation-schemas";
import { parseStoredScript } from "@/lib/blob-assets";
import { isFinishedStatus, statusLabel } from "@/lib/project-status";

export const metadata: Metadata = {
  title: "Dashboard | ReelSimple",
};

function parseUrlList(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string") : [];
  } catch {
    return [];
  }
}

function parseBrief(json: string | null) {
  if (!json) return null;
  try {
    const parsed = BriefSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { project: projectParam } = await searchParams;
  const aiEnabled = isAiEnabled();
  const userId = session.user.id;

  const [items, selected] = await Promise.all([
    prisma.galleryItem.findMany({
      where: { userId },
      include: {
        project: { select: { prompt: true, briefJson: true, scriptJson: true, updatedAt: true } },
      },
    }),
    aiEnabled && projectParam
      ? prisma.project.findFirst({ where: { id: projectParam, userId } })
      : null,
  ]);

  const initialProject: InitialProject | null = selected
    ? {
        id: selected.id,
        prompt: selected.prompt,
        wantsVoiceover: selected.wantsVoiceover,
        wantsSubtitles: selected.wantsSubtitles,
        duration: selected.duration,
        aspectRatio: selected.aspectRatio,
        resolution: selected.resolution,
        negativePrompt: selected.negativePrompt,
        assetUrls: parseUrlList(selected.assetUrls),
        toneReferenceUrls: parseUrlList(selected.toneReferenceUrls),
        brief: parseBrief(selected.briefJson),
        script: parseStoredScript(selected.scriptJson),
        revisionCount: selected.revisionCount,
        status: selected.status,
      }
    : null;

  const cards: GalleryCard[] = items
    .map((item) => {
      const script = parseStoredScript(item.project?.scriptJson);
      const images = (script?.scenes ?? [])
        .map((s) => s.imageUrl)
        .filter((u): u is string => !!u);
      const brief = parseBrief(item.project?.briefJson ?? null);
      const updatedAt = (item.project?.updatedAt ?? item.createdAt).toISOString();
      return {
        id: item.id,
        projectId: item.projectId,
        title: item.title,
        statusLabel: statusLabel(item.status),
        finished: isFinishedStatus(item.status),
        // A different scene image every time the page loads.
        thumbImageUrl: images.length ? images[Math.floor(Math.random() * images.length)] : null,
        videoUrl: script?.finalVideoUrl ?? null,
        updatedAt,
        searchText: [item.title, item.project?.prompt, brief?.productDescription, brief?.tone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const firstName = session.user.name?.split(" ")[0];

  return (
    <div className="pt-[70px] pb-[90px]">
      <div className="mx-auto mb-10 flex max-w-[1200px] flex-wrap items-center justify-between gap-4 border-b border-hair px-6 pb-6 lg:px-12">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
            <span className="h-[7px] w-[7px] rounded-full bg-coral" />
            Dashboard
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="text-sm font-semibold text-text-dim hover:text-text">
            Sign out
          </button>
        </form>
      </div>

      <section className="mx-auto mb-12 max-w-[1200px] px-6 lg:px-12">
        {aiEnabled ? (
          <CreatePanel key={initialProject?.id ?? "new"} initialProject={initialProject} />
        ) : (
          <div className="rounded-[28px] border border-hair bg-panel p-8 shadow-[0_1px_2px_rgba(33,30,25,0.05),0_16px_36px_rgba(33,30,25,0.08)] sm:p-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[12px] font-semibold text-accent">
              Coming soon
            </span>
            <h2 className="mt-5 mb-2 font-serif text-[clamp(22px,2.6vw,28px)] font-semibold tracking-tight text-text">
              AI video creation is on its way
            </h2>
            <p className="max-w-[560px] text-[15px] leading-[1.5] text-text-dim">
              Your account is set up and ready. We&apos;re putting the finishing touches on the
              creation tools. You&apos;ll be able to describe a video here and watch it come to life
              very soon.
            </p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1200px] px-6 lg:px-12">
        <Gallery
          cards={cards}
          canResume={aiEnabled}
          emptyText={
            aiEnabled
              ? "Start a project above and it will show up here, ready to pick back up any time."
              : "Your videos will show up here once creation opens up."
          }
        />
      </section>
    </div>
  );
}
