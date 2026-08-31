import { ActivityEditor } from "@/components/ActivityEditor";
import { SiteShell } from "@/components/SiteShell";

export default async function NewActivityPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const initialType = (await searchParams).type === "WORD_SEARCH" ? "WORD_SEARCH" : "WORDLE";
  return <SiteShell><ActivityEditor initialType={initialType} /></SiteShell>;
}
