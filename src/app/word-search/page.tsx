import { SiteShell } from "@/components/SiteShell"; import { WordSearchBuilder } from "@/components/WordSearchBuilder";
export default async function WordSearchPage({ searchParams }: { searchParams: Promise<{ activity?: string }> }) { const activity = (await searchParams).activity ?? "example"; return <SiteShell><WordSearchBuilder key={activity} /></SiteShell>; }
