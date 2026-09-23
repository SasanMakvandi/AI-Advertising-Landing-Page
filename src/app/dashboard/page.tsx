import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreatePanel } from "@/components/CreatePanel";

export const metadata: Metadata = {
  title: "Dashboard — ReelSimple",
};

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #4B4EFF, #211E19)",
  "linear-gradient(135deg, #FF5C39, #4B4EFF)",
  "linear-gradient(135deg, #E4DECF, #FF5C39)",
  "linear-gradient(135deg, #211E19, #4B4EFF)",
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await prisma.galleryItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

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
        <CreatePanel />
      </section>

      <section className="mx-auto max-w-[1200px] px-6 lg:px-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-text">Your gallery</h2>
          <span className="text-[13px] text-text-dim">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-hair bg-panel p-12 text-center">
            <p className="mb-2 text-lg font-medium text-text">Nothing here yet</p>
            <p className="text-sm text-text-dim">
              Use the panel above to create your first video.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((item, i) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-hair bg-panel">
                <div
                  className="aspect-[3/4]"
                  style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                />
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-text">{item.title}</p>
                  <p className="text-xs text-text-dim capitalize">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
