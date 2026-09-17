"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardData } from "@/lib/dashboardTypes";

const number = (value: number) => value.toLocaleString("en-AU");
const dateTime = (value: string) => new Date(value).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function duration(value: number | null) {
  if (value === null) return "No visits yet";
  const seconds = Math.round(value / 1000);
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="dashboard-metric"><dt>{label}</dt><dd className="dashboard-metric-value">{value}</dd><dd className="dashboard-metric-description">{detail}</dd></div>;
}

function Breakdown({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total ? Math.round(value / total * 100) : 0;
  return <div className="dashboard-breakdown">
    <div><span>{label}</span><strong>{number(value)} <span className="dashboard-percent">{percent}%</span></strong></div>
    <div className="dashboard-bar" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
  </div>;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [health, setHealth] = useState<"checking" | "healthy" | "unavailable">("checking");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    const [metrics, status] = await Promise.allSettled([
      fetch("/api/dashboard", { cache: "no-store", signal: AbortSignal.timeout(10_000) }).then(async (response) => {
        if (!response.ok) throw new Error("Dashboard data is unavailable. Please try again.");
        return response.json() as Promise<DashboardData>;
      }),
      fetch("/health", { cache: "no-store", signal: AbortSignal.timeout(10_000) }).then((response) => response.ok),
    ]);
    if (metrics.status === "fulfilled") { setData(metrics.value); setError(""); }
    else setError("Dashboard data is unavailable. Please try again.");
    setHealth(status.status === "fulfilled" && status.value ? "healthy" : "unavailable");
    setLoading(false);
    inFlight.current = false;
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30_000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [refresh]);

  return <section className="dashboard-page">
    <div className="page-heading dashboard-heading">
      <div><p className="eyebrow">Your classroom at a glance</p><h1>Dashboard</h1><p className="lead">Teaching resources, activity usage and system health.</p></div>
      <div className="page-heading-actions"><Link className="button secondary" href="/activities">View saved puzzles</Link><button type="button" className="button primary" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh dashboard"}</button></div>
    </div>

    <div className="dashboard-status-strip">
      <span className={`dashboard-health ${health}`} role="status"><span aria-hidden="true">●</span> {health === "healthy" ? "System healthy · database connected" : health === "checking" ? "Checking system health…" : "System health unavailable"}</span>
      <span>{data ? `${error ? "Last successful update" : "Updated"} ${dateTime(data.updatedAt)}` : "Waiting for dashboard data"} · Refreshes every 30s</span>
    </div>

    {error && <p className="dashboard-notice" role="alert">{error}{data ? " The figures below are from the last successful update." : " Use Refresh dashboard to retry."}</p>}
    {!data && !error && <p className="dashboard-loading" role="status">Loading your activity summaries…</p>}

    {data && <>
      <section aria-labelledby="resources-title">
        <div className="dashboard-section-heading"><h2 id="resources-title">Your resources</h2><p>{number(data.library.totalActivities)} saved activities · current library</p></div>
        <dl className="dashboard-metrics">
          <Metric label="Wordle activities" value={number(data.library.wordle)} detail="Saved Wordle configurations" />
          <Metric label="Word Search activities" value={number(data.library.wordSearch)} detail="Saved Word Search configurations" />
          <Metric label="Words in activities" value={number(data.library.wordEntries)} detail="Word entries across saved lists; repeats included" />
          <Metric label="Dictionary words" value={number(data.library.dictionaryWords)} detail={`${number(data.library.customDictionaryWords)} teacher-added or customised entries`} />
        </dl>
        {data.library.totalActivities === 0 && <div className="dashboard-empty"><h3>Your library is ready to grow</h3><p>Save your first activity to see its words and settings here.</p><div className="page-heading-actions"><Link className="button primary" href="/wordle">Build Wordle</Link><Link className="button secondary" href="/word-search">Build Word Search</Link></div></div>}
      </section>

      <section aria-labelledby="usage-title">
        <div className="dashboard-section-heading"><h2 id="usage-title">Activity &amp; generation</h2><p>{data.usage.since ? `Recorded since ${dateTime(data.usage.since)}` : "Usage appears as you build and download"}</p></div>
        <dl className="dashboard-metrics dashboard-usage">
          <Metric label="Successful generations" value={number(data.usage.successfulGenerations)} detail="HTML outputs prepared for download" />
          <Metric label="Failed generations" value={number(data.usage.failedGenerations)} detail="Download requests that returned an error" />
          <Metric label="Average time on page" value={duration(data.usage.averageTimeMs)} detail="Visible time per builder visit; includes ongoing visits" />
          <Metric label="Most-used activity type" value={data.usage.mostUsed ?? "No visits yet"} detail={`Based on ${number(data.usage.totalVisits)} builder page visits`} />
        </dl>
        <p className="dashboard-footnote">Usage starts when tracking is enabled. Builder time updates every 15 seconds and excludes hidden tabs. Offline games and live preview resets are not counted as generated outputs.</p>
      </section>

      <div className="dashboard-panels">
        <section className="dashboard-panel" aria-labelledby="visits-title"><h2 id="visits-title">Builder visits</h2><p>Which activity teachers open most often.</p>
          <Breakdown label="Wordle" value={data.usage.wordleVisits} total={data.usage.totalVisits} />
          <Breakdown label="Word Search" value={data.usage.wordSearchVisits} total={data.usage.totalVisits} />
          {data.usage.totalVisits === 0 && <p className="dashboard-footnote">Open either builder to record the first visit.</p>}
        </section>
        <section className="dashboard-panel" aria-labelledby="difficulty-title"><h2 id="difficulty-title">Saved difficulty levels</h2><p>Settings across your current activities.</p>
          {data.library.difficulties.map((item) => <Breakdown key={item.label} label={item.label} value={item.count} total={data.library.totalActivities} />)}
          <p className="dashboard-footnote">Word Search activities currently use Foundation by default.</p>
        </section>
      </div>

      <section className="dashboard-recent" aria-labelledby="recent-title">
        <div className="dashboard-section-heading"><h2 id="recent-title">Recently saved activities</h2><Link href="/activities">View all activities →</Link></div>
        {data.recentActivities.length ? <div className="dashboard-table-wrap" role="region" aria-label="Recent activity configurations" tabIndex={0}><table className="dashboard-table">
          <caption className="visually-hidden">The six most recently updated activities, with their stored words and settings</caption>
          <thead><tr><th scope="col">Activity</th><th scope="col">Type</th><th scope="col">Words</th><th scope="col">Settings</th><th scope="col">Updated</th></tr></thead>
          <tbody>{data.recentActivities.map((activity) => <tr key={activity.id}>
            <th scope="row"><Link href={`/${activity.type === "WORDLE" ? "wordle" : "word-search"}?activity=${activity.id}`}>{activity.title}</Link></th>
            <td>{activity.type === "WORDLE" ? "Wordle" : "Word Search"}</td><td>{number(activity.wordCount)}</td>
            <td>{activity.type === "WORDLE" ? activity.difficulty[0] + activity.difficulty.slice(1).toLowerCase() : `${activity.gridSize ?? 7} × ${activity.gridSize ?? 7} grid`}<span className="dashboard-table-detail">Hints {activity.hintEnabled ? "enabled" : "disabled"}</span></td>
            <td><time dateTime={activity.updatedAt}>{dateTime(activity.updatedAt)}</time></td>
          </tr>)}</tbody>
        </table></div> : <p className="dashboard-empty">No saved activities yet.</p>}
      </section>
    </>}
  </section>;
}
