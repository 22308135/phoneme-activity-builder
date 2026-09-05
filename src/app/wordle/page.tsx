import { SiteShell } from "@/components/SiteShell"; import { WordleBuilder } from "@/components/WordleBuilder";
export default async function WordlePage({ searchParams }: { searchParams: Promise<{ activity?: string }> }) { const activity = (await searchParams).activity ?? "example"; return <SiteShell><WordleBuilder key={activity} /></SiteShell>; }
