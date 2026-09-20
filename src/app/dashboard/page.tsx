import { dashboardDays, getDashboard } from "@/lib/dashboard";
import { HealthStatus } from "@/components/HealthStatus";

export const dynamic = "force-dynamic";
const typeName = (type: string | null) => type === "WORDLE" ? "Wordle" : type === "WORD_SEARCH" ? "Word Search" : "Unknown";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = dashboardDays((await searchParams).days);
  let data;
  try { data = await getDashboard(days); } catch (error) { console.error("Dashboard unavailable", error); }
  return <section className="library-page dashboard-page">
    <div className="page-heading"><div><p className="eyebrow">Activity reporting</p><h1>Dashboard</h1><p className="muted">See what is saved and how activity generation is performing.</p></div><HealthStatus /></div>
    <form className="dashboard-filter" action="/dashboard">
      <label htmlFor="report-days">Generation reporting period</label>
      <select id="report-days" name="days" defaultValue={days ?? "all"}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select>
      <button className="button secondary" type="submit">Refresh report</button>
    </form>
    {!data ? <div role="alert" className="dashboard-warning"><h2>Reporting data unavailable</h2><p>Check the database connection and apply pending migrations, then refresh the report.</p></div> : <>
      <h2>Currently saved</h2>
      <div className="dashboard-cards">
        {[["Saved Wordle activities", data.wordle], ["Saved Word Search activities", data.wordSearch], ["Words in saved activities", data.wordCount]].map(([label, value]) => <article key={label}><h3>{label}</h3><p className="metric-value">{value}</p></article>)}
      </div>
      <p className="muted">Current library totals include existing activities. Words are counted per activity, including repeated words.</p>
      <h2>Generation outcomes</h2>
      <div className="dashboard-cards">
        {[["Successful generations", data.successful], ["Failed generations", data.failed], ["Most-used activity type", data.mostUsed.length ? data.mostUsed.map(typeName).join(" / ") + (data.mostUsed.length > 1 ? " (tie)" : "") : "No generations yet"]].map(([label, value]) => <article key={label}><h3>{label}</h3><p className="metric-value" data-testid={label === "Successful generations" ? "generation-success" : label === "Failed generations" ? "generation-failure" : undefined}>{value}</p></article>)}
      </div>
      <p className="muted">Counts cover requests to generate HTML from saved activities since tracking was introduced. Repeat downloads count separately. Most-used type is based on successful generations in the selected period; offline play is not tracked.</p>
      {(data.failed > 0 || data.emptyLists > 0) && <aside className="dashboard-warning" aria-label="Operational warnings"><h2>Needs attention</h2>{data.failed > 0 && <p>{data.failed} generation attempt(s) failed in this period. Review recent events for details.</p>}{data.emptyLists > 0 && <p>{data.emptyLists} saved activity list(s) contain no words. Add words before generating.</p>}</aside>}
      <h2>Recent generation events</h2>
      {data.recent.length === 0 ? <div className="empty-state"><h3>No generation events in this period</h3><p>Generate and download a saved Wordle or Word Search activity, then refresh this report.</p></div> : <div className="dashboard-table-wrap" tabIndex={0} role="region" aria-label="Recent generation events table"><table className="dashboard-table"><caption>Latest 20 attempts in the selected period. Times shown in UTC.</caption><thead><tr><th scope="col">Time (UTC)</th><th scope="col">Activity</th><th scope="col">Type</th><th scope="col">Outcome</th><th scope="col">Details</th></tr></thead><tbody>{data.recent.map((event) => <tr key={event.id}><td><time dateTime={event.createdAt.toISOString()}>{event.createdAt.toISOString().replace("T", " ").slice(0, 19)}</time></td><td>{event.activityTitle ?? (event.activityId ? `Activity #${event.activityId}` : "Invalid activity request")}</td><td>{typeName(event.activityType)}</td><td>{event.success ? "Success" : "Failed"}</td><td>{event.error ?? "HTML generated"}</td></tr>)}</tbody></table></div>}
      <p className="muted">Report updated: {data.checkedAt.replace("T", " ").slice(0, 19)} UTC. Refresh to see new activity. Generation history remains after an activity is deleted.</p>
    </>}
  </section>;
}
