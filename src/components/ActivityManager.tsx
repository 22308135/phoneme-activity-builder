"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SavedActivity } from "@/lib/activityTypes";

export function ActivityManager() {
  const [activities, setActivities] = useState<SavedActivity[]>([]);
  const [message, setMessage] = useState("Loading saved activities…");

  const load = async () => {
    const response = await fetch("/api/activities", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load saved activities");
    setActivities(await response.json());
    setMessage("");
  };

  useEffect(() => {
    fetch("/api/activities", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Could not load saved activities")))
      .then((saved) => { setActivities(saved); setMessage(""); })
      .catch((error) => setMessage(error.message));
  }, []);

  const remove = async (activity: SavedActivity) => {
    if (!window.confirm(`Delete “${activity.title}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
    if (!response.ok) { setMessage("Could not delete activity"); return; }
    await load();
    setMessage("Activity deleted.");
  };

  return <section className="library-page">
    <div className="page-heading"><div><p className="eyebrow">Your teaching resources</p><h1>Saved puzzles</h1><p className="lead">Open, download, edit or delete your reusable phoneme activities.</p></div><div className="page-heading-actions"><Link className="button primary" href="/wordle#custom-activity">Build Wordle</Link><Link className="button secondary" href="/word-search#custom-activity">Build Word Search</Link></div></div>
    <p role="status" className="form-message">{message}</p>
    {!message && activities.length === 0 ? <div className="empty-state"><h2>No saved puzzles yet</h2><p>Build a phoneme Wordle or Word Search to begin your library.</p><div className="card-actions"><Link className="button primary" href="/wordle#custom-activity">Build Wordle</Link><Link className="button secondary" href="/word-search#custom-activity">Build Word Search</Link></div></div> : null}
    <section className="saved-list activity-library" aria-label="Saved puzzles"><h2>{activities.length} saved {activities.length === 1 ? "puzzle" : "puzzles"}</h2><div className="activity-card-grid">{activities.map((activity) => <article key={activity.id}><p className="eyebrow">{activity.type === "WORDLE" ? "Wordle" : "Word Search"}</p><h3>{activity.title}</h3><p>{activity.words.length} {activity.words.length === 1 ? "word" : "words"} · {activity.type === "WORDLE" ? activity.difficulty.toLowerCase() : `${activity.gridSize} × ${activity.gridSize}`}</p><div className="card-actions"><Link className="button primary" href={activity.type === "WORDLE" ? `/wordle?activity=${activity.id}` : `/word-search?activity=${activity.id}`}>Open</Link><a className="button secondary" href={`/api/activities/${activity.id}/download`}>Download HTML</a><Link className="button secondary" href={`/activities/${activity.id}/edit`}>Edit</Link><button className="danger-link" type="button" onClick={() => remove(activity)}>Delete</button></div></article>)}</div></section>
  </section>;
}
