"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { SavedActivity, SavedWord } from "@/lib/activityTypes";

type EditableWord = SavedWord & { phonemeText: string };
type Editor = { id?: number; title: string; type: "WORDLE" | "WORD_SEARCH"; difficulty: "FOUNDATION" | "DEVELOPING" | "EXTENDING"; gridSize: number; hintEnabled: boolean; words: EditableWord[] };
const blankWord = (target = false): EditableWord => ({ text: "", phonemes: [], phonemeText: "", hint: "", isTarget: target });
const blankEditor = (): Editor => ({ title: "", type: "WORDLE", difficulty: "FOUNDATION", gridSize: 7, hintEnabled: true, words: [blankWord(true)] });

export function ActivityManager() {
  const [activities, setActivities] = useState<SavedActivity[]>([]);
  const [editor, setEditor] = useState<Editor>(blankEditor);
  const [message, setMessage] = useState("Loading saved activities…");
  const [busy, setBusy] = useState(false);
  const load = async () => { const response = await fetch("/api/activities", { cache: "no-store" }); if (!response.ok) throw new Error("Could not load saved activities"); setActivities(await response.json()); setMessage(""); };
  useEffect(() => { fetch("/api/activities", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject(new Error("Could not load saved activities"))).then((saved) => { setActivities(saved); setMessage(""); }).catch((error) => setMessage(error.message)); }, []);
  const updateWord = (index: number, patch: Partial<EditableWord>) => setEditor((current) => ({ ...current, words: current.words.map((word, wordIndex) => wordIndex === index ? { ...word, ...patch } : word) }));
  const edit = (activity: SavedActivity) => setEditor({ id: activity.id, title: activity.title, type: activity.type, difficulty: activity.difficulty, gridSize: activity.gridSize ?? 7, hintEnabled: activity.hintEnabled, words: activity.words.map((word) => ({ ...word, phonemeText: word.phonemes.join(", ") })) });
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("Saving…");
    const payload = { ...editor, gridSize: editor.type === "WORD_SEARCH" ? editor.gridSize : null, words: editor.words.map(({ text, phonemeText, hint, isTarget }) => ({ text, hint, isTarget: editor.type === "WORDLE" && isTarget, phonemes: phonemeText.split(/[,\s]+/u).map((sound) => sound.trim()).filter(Boolean) })) };
    const response = await fetch(editor.id ? `/api/activities/${editor.id}` : "/api/activities", { method: editor.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setMessage(result?.issues?.[0]?.message ?? result?.error ?? "Could not save activity"); setBusy(false); return; }
    const wasEdit = Boolean(editor.id); setEditor(blankEditor()); await load(); setMessage(wasEdit ? "Activity updated." : "Activity created."); setBusy(false);
  };
  const remove = async (activity: SavedActivity) => { if (!window.confirm(`Delete “${activity.title}”? This cannot be undone.`)) return; const response = await fetch(`/api/activities/${activity.id}`, { method: "DELETE" }); if (!response.ok) { setMessage("Could not delete activity"); return; } if (editor.id === activity.id) setEditor(blankEditor()); await load(); setMessage("Activity deleted."); };

  return <section className="library-page">
    <div className="page-heading"><div><p className="eyebrow">Database-backed workflow</p><h1>Saved activities</h1><p className="lead">Create and manage reusable phoneme word lists and activity settings.</p></div><button className="button secondary" type="button" onClick={() => setEditor(blankEditor())}>New activity</button></div>
    <div className="library-grid"><form className="editor-card" onSubmit={save}><h2>{editor.id ? "Edit activity" : "Create activity"}</h2>
      <label>Activity title<input required maxLength={120} value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></label>
      <div className="form-row"><label>Activity type<select value={editor.type} onChange={(event) => { const type = event.target.value as Editor["type"]; setEditor({ ...editor, type, words: editor.words.map((word, index) => ({ ...word, isTarget: type === "WORDLE" && index === 0 })) }); }}><option value="WORDLE">Wordle</option><option value="WORD_SEARCH">Word Search</option></select></label>
      {editor.type === "WORDLE" ? <label>Difficulty<select value={editor.difficulty} onChange={(event) => setEditor({ ...editor, difficulty: event.target.value as Editor["difficulty"] })}><option value="FOUNDATION">Foundation</option><option value="DEVELOPING">Developing</option><option value="EXTENDING">Extending</option></select></label> : <label>Grid size<select value={editor.gridSize} onChange={(event) => setEditor({ ...editor, gridSize: Number(event.target.value) })}><option value="7">7 × 7</option><option value="8">8 × 8</option><option value="9">9 × 9</option></select></label>}</div>
      <label className="check-row"><input type="checkbox" checked={editor.hintEnabled} onChange={(event) => setEditor({ ...editor, hintEnabled: event.target.checked })} /> Enable hints</label>
      <div className="word-editor-heading"><h3>Words and phonemes</h3><button type="button" className="text-button" onClick={() => setEditor({ ...editor, words: [...editor.words, blankWord()] })}>+ Add word</button></div><p className="field-help">Separate phonemes with spaces or commas. A sound such as tʃ remains one token.</p>
      {editor.words.map((word, index) => <fieldset className="word-editor" key={index}><legend>Word {index + 1}</legend><label>Written word<input required value={word.text} onChange={(event) => updateWord(index, { text: event.target.value })} /></label><label>Ordered phonemes<input required placeholder="tʃ, ɪ, p" value={word.phonemeText} onChange={(event) => updateWord(index, { phonemeText: event.target.value })} /></label><label>Hint<input value={word.hint ?? ""} onChange={(event) => updateWord(index, { hint: event.target.value })} /></label><div className="word-actions">{editor.type === "WORDLE" && <label className="check-row"><input type="radio" name="target" checked={word.isTarget} onChange={() => setEditor({ ...editor, words: editor.words.map((item, itemIndex) => ({ ...item, isTarget: itemIndex === index })) })} /> Target word</label>}<button type="button" className="danger-link" disabled={editor.words.length === 1} onClick={() => setEditor({ ...editor, words: editor.words.filter((_, wordIndex) => wordIndex !== index) })}>Remove</button></div></fieldset>)}
      <div className="form-actions"><button disabled={busy} className="button primary" type="submit">{editor.id ? "Save changes" : "Create activity"}</button>{editor.id && <button className="button secondary" type="button" onClick={() => setEditor(blankEditor())}>Cancel</button>}</div><p role="status" className="form-message">{message}</p></form>
      <section className="saved-list" aria-label="Saved activities"><h2>{activities.length} saved {activities.length === 1 ? "activity" : "activities"}</h2>{activities.map((activity) => <article key={activity.id}><p className="eyebrow">{activity.type === "WORDLE" ? "Wordle" : "Word Search"}</p><h3>{activity.title}</h3><p>{activity.words.length} {activity.words.length === 1 ? "word" : "words"} · {activity.type === "WORDLE" ? activity.difficulty.toLowerCase() : `${activity.gridSize} × ${activity.gridSize}`}</p><div className="card-actions"><Link className="button primary" href={activity.type === "WORDLE" ? `/wordle?activity=${activity.id}` : `/word-search?activity=${activity.id}`}>Open builder</Link><button className="button secondary" type="button" onClick={() => edit(activity)}>Edit</button><button className="danger-link" type="button" onClick={() => remove(activity)}>Delete</button></div></article>)}</section>
    </div>
  </section>;
}
