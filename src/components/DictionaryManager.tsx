"use client";

import { FormEvent, useEffect, useState } from "react";

type Entry = { id?: number; word: string; phonemes: string[]; hint: string; source: "curated" | "custom" };

export function DictionaryManager() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const [phonemes, setPhonemes] = useState("");
  const [hint, setHint] = useState("");
  const [message, setMessage] = useState("Loading dictionary…");

  const load = () => fetch("/api/dictionary", { cache: "no-store" }).then((response) => response.json()).then((words: Entry[]) => { setEntries(words); setMessage(""); });
  useEffect(() => { load().catch(() => setMessage("Could not load the dictionary.")); }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/dictionary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, phonemes: phonemes.split(/[ ,]+/).filter(Boolean), hint }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result?.issues?.[0]?.message ?? result.error); return; }
    setText(""); setPhonemes(""); setHint(""); await load(); setMessage(`${result.word} added to the dictionary.`);
  };

  const remove = async (entry: Entry) => {
    if (!entry.id || !window.confirm(`Remove ${entry.word} from the custom dictionary?`)) return;
    const response = await fetch(`/api/dictionary/${entry.id}`, { method: "DELETE" });
    if (response.ok) { await load(); setMessage(`${entry.word} removed.`); }
  };

  return <section className="library-page">
    <div className="page-heading"><div><p className="eyebrow">Reusable teaching vocabulary</p><h1>Word dictionary</h1><p className="lead">Browse the built-in phoneme words or add your own. Every entry becomes available in the Wordle target selector.</p></div></div>
    <form className="editor-card dictionary-form" onSubmit={save}>
      <h2>Add or update a word</h2>
      <div className="dictionary-form-grid"><label>Written word<input required value={text} onChange={(event) => setText(event.target.value)} /></label><label>Ordered phonemes<input required placeholder="tʃ, ɪ, p" value={phonemes} onChange={(event) => setPhonemes(event.target.value)} /></label><label>Child-friendly hint<input required value={hint} onChange={(event) => setHint(event.target.value)} /></label></div>
      <button className="button primary" type="submit">Add to dictionary</button>
    </form>
    <p className="form-message" role="status">{message}</p>
    <div className="dictionary-grid" aria-label="Dictionary words">{entries.map((entry) => <article key={`${entry.source}-${entry.word}`}><div><p className="eyebrow">{entry.source === "curated" ? "Built in" : "Custom"}</p><h2>{entry.word}</h2><p className="dictionary-phonemes">/{entry.phonemes.join("/ /")}/</p><p>{entry.hint}</p></div>{entry.source === "custom" && <button type="button" className="danger-link" onClick={() => remove(entry)}>Remove</button>}</article>)}</div>
  </section>;
}
