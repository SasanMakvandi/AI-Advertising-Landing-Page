import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Project and gallery card always share one status so the gallery can show
// where an unfinished project was left.
export async function setProjectStatus(
  projectId: string,
  status: string,
  extra: Prisma.ProjectUpdateInput = {}
) {
  await prisma.project.update({ where: { id: projectId }, data: { status, ...extra } });
  await prisma.galleryItem.updateMany({ where: { projectId }, data: { status } });
}

export const STATUS_LABELS: Record<string, string> = {
  extracting_brief: "Reading request",
  brief_ready: "Brief ready",
  generating_script: "Writing script",
  script_ready: "Script ready",
  images_ready: "Images ready",
  videos_generating: "Video generating",
  videos_ready: "Clips ready",
  stitched: "Video ready",
  finalized: "Finalized",
  error: "Needs attention",
  draft: "Draft",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function isFinishedStatus(status: string): boolean {
  return status === "stitched" || status === "finalized";
}
