import { notFound } from "next/navigation";
import { ActivityEditor } from "@/components/ActivityEditor";
import { SiteShell } from "@/components/SiteShell";

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  return <SiteShell><ActivityEditor activityId={id} /></SiteShell>;
}
