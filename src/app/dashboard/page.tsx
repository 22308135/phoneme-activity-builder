import { Dashboard } from "@/components/Dashboard";
import { SiteShell } from "@/components/SiteShell";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams;
  const reportDays = days === "7" || days === "30" ? days : "all";
  return <SiteShell><Dashboard reportDays={reportDays} /></SiteShell>;
}
