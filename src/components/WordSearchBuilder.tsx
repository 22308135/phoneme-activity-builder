"use client";

import { useEffect, useMemo, useState } from "react";
import { generateWordSearch, WORD_SEARCH_HINTS } from "@/lib/wordSearch";
import type { SavedActivity } from "@/lib/activityTypes";

type PhonemeWord = { id: string; sounds: string[]; hint: string };
const defaultPhonemeWords: PhonemeWord[] = [
  { id: "thin", sounds: ["θ", "ɪ", "n"], hint: "Not thick" },
  { id: "ship", sounds: ["ʃ", "ɪ", "p"], hint: "A large boat" },
  { id: "chip", sounds: ["tʃ", "ɪ", "p"], hint: "A small piece" },
  { id: "fish", sounds: ["f", "ɪ", "ʃ"], hint: "An animal that lives in water" },
  { id: "sing", sounds: ["s", "ɪ", "ŋ"], hint: "To make music with your voice" },
];
const displaySounds = (sounds: string[]) => sounds.map((sound) => `/${sound}/`).join(" ");

function cellsBetween(start: number, end: number, size: number) {
  const startRow = Math.floor(start / size), startColumn = start % size, endRow = Math.floor(end / size), endColumn = end % size;
  const rowDistance = endRow - startRow, columnDistance = endColumn - startColumn;
  if (rowDistance !== 0 && columnDistance !== 0 && Math.abs(rowDistance) !== Math.abs(columnDistance)) return [];
  const length = Math.max(Math.abs(rowDistance), Math.abs(columnDistance)) + 1;
  return Array.from({ length }, (_, offset) => (startRow + Math.sign(rowDistance) * offset) * size + startColumn + Math.sign(columnDistance) * offset);
}

export function WordSearchBuilder() {
  const [activityId, setActivityId] = useState<number | "">("");
  const [phonemeWords, setPhonemeWords] = useState(defaultPhonemeWords);
  const [enabled, setEnabled] = useState(phonemeWords.map((word) => word.id));
  const [gridSize, setGridSize] = useState(7);
  const [puzzleSeed, setPuzzleSeed] = useState(1);
  const grid = useMemo(() => generateWordSearch(phonemeWords.map((word) => word.sounds), gridSize, puzzleSeed), [phonemeWords, gridSize, puzzleSeed]);
  const [start, setStart] = useState<number | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<number[]>([]);
  const [message, setMessage] = useState("Click the first and last sound in a word.");
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [pendingAction, setPendingAction] = useState<"save" | "download" | null>(null);
  const activeWords = phonemeWords.filter((word) => enabled.includes(word.id));
  const visibleWords = phonemeWords.filter((word) => word.id.includes(filter.trim().toLocaleLowerCase("en-AU")));
  const resetGame = () => { setStart(null); setFound([]); setFoundCells([]); setPuzzleSeed((seed) => seed + 1); setMessage("New puzzle generated. Click the first and last sound in a word."); };
  const applyActivity = (activity: SavedActivity) => {
    const words = activity.words.map((word) => ({ id: word.text, sounds: word.phonemes, hint: word.hint ?? "No hint provided" }));
    if (!words.length) return;
    setActivityId(activity.id); setActivityTitle(activity.title); setPhonemeWords(words); setEnabled(words.map((word) => word.id)); setGridSize(activity.gridSize ?? 7); resetGame();
  };
  useEffect(() => {
    const requested = Number(new URLSearchParams(window.location.search).get("activity"));
    if (requested) { fetch(`/api/activities/${requested}`, { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((saved: SavedActivity) => applyActivity(saved)).catch(() => undefined); return; }
    fetch("/api/dictionary", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((entries: Array<{ word: string; phonemes: string[]; hint: string }>) => {
      const words = entries.map((entry) => ({ id: entry.word, sounds: entry.phonemes, hint: entry.hint }));
      if (words.length) { setPhonemeWords(words); setEnabled(words.slice(0, 5).map((word) => word.id)); }
    }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCell = (index: number) => {
    if (start === null) { setStart(index); setMessage("Now click the last sound in the word."); return; }
    const path = cellsBetween(start, index, gridSize);
    const sounds = path.map((cell) => grid[Math.floor(cell / gridSize)][cell % gridSize]);
    const match = activeWords.find((word) => !found.includes(word.id) && [sounds.join("|"), [...sounds].reverse().join("|")].includes(word.sounds.join("|")));
    setStart(null);
    if (!match) { setMessage("That is not one of the target words. Try again."); return; }
    const nextFound = [...found, match.id];
    setFound(nextFound); setFoundCells([...new Set([...foundCells, ...path])]);
    setMessage(nextFound.length === activeWords.length ? "Excellent — you found every phoneme word!" : `Found ${displaySounds(match.sounds)} — ${match.id}.`);
  };

  const toggleWord = (id: string) => {
    setEnabled((current) => current.includes(id) && current.length > 2 ? current.filter((word) => word !== id) : current.includes(id) ? current : current.length < 10 ? [...current, id] : current);
    setActivityId(""); setActivityTitle(""); setPendingAction(null); setSaveMessage("");
    setFound([]); setFoundCells([]); setStart(null); setMessage("Click the first and last sound in a word.");
  };

  const beginSave = (action: "save" | "download") => { setPendingAction(action); setSaveMessage(""); if (!activityTitle) setActivityTitle("My phoneme Word Search"); };
  const saveActivity = async () => {
    if (!pendingAction || !activityTitle.trim() || activeWords.length < 2) return;
    const download = pendingAction === "download"; setSaving(true); setSaveMessage("Saving to Activities…");
    const payload = { title: activityTitle.trim(), type: "WORD_SEARCH", difficulty: "FOUNDATION", gridSize, hintEnabled: true, words: activeWords.map((word) => ({ text: word.id, phonemes: word.sounds, hint: word.hint, isTarget: false })) };
    const response = await fetch(activityId ? `/api/activities/${activityId}` : "/api/activities", { method: activityId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json(); setSaving(false);
    if (!response.ok) { setSaveMessage(result?.issues?.[0]?.message ?? result.error ?? "Could not save activity."); return; }
    setActivityId(result.id); setPendingAction(null); setSaveMessage(download ? `Saved “${result.title}” to Activities and started download.` : `Saved “${result.title}” to Activities.`);
    if (download) { const link = document.createElement("a"); link.href = `/api/activities/${result.id}/download`; link.click(); }
  };

  return <section className="builder-grid">
    <aside className="control-panel" aria-label="Word Search settings">
      <p className="eyebrow">Activity settings</p><h1>Build a phoneme Word Search</h1>
      <label>Grid size<select value={gridSize} onChange={(event) => { setGridSize(Number(event.target.value)); setActivityId(""); setActivityTitle(""); setPendingAction(null); setSaveMessage(""); setPuzzleSeed((seed) => seed + 1); setStart(null); setFound([]); setFoundCells([]); setMessage("New grid generated. Click the first and last sound in a word."); }}><option value="7">7 × 7</option><option value="8">8 × 8</option><option value="9">9 × 9</option></select></label>
      <fieldset className="word-picker"><legend>Target words</legend><p className="field-help">Choose 2–10 words. {enabled.length} currently selected.</p><label className="word-filter">Find a word<input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search dictionary…" /></label><div className="word-picker-list">{visibleWords.map((word) => <label className="check-row" key={word.id}><input type="checkbox" checked={enabled.includes(word.id)} disabled={(enabled.includes(word.id) && enabled.length === 2) || (!enabled.includes(word.id) && enabled.length === 10)} onChange={() => toggleWord(word.id)} /> <span>{word.id}<small>{displaySounds(word.sounds)}</small></span></label>)}</div></fieldset>
      <div className="tip"><strong>Mixed directions</strong><br />Words run horizontally, vertically, diagonally and backwards. Click the first and last sound to select one.</div>
      <div className="builder-actions"><button type="button" className="button secondary" disabled={saving} onClick={() => beginSave("save")}>Save Word Search to Activities</button><button type="button" className="button primary" disabled={saving} onClick={() => beginSave("download")}>Generate &amp; download HTML <span aria-hidden="true">↓</span></button></div>
      {pendingAction && <div className="save-panel"><label htmlFor="search-activity-title">Activity name</label><input id="search-activity-title" autoFocus required maxLength={120} value={activityTitle} onChange={(event) => setActivityTitle(event.target.value)} /><div className="save-panel-actions"><button type="button" className="button primary" disabled={saving || activityTitle.trim().length < 2} onClick={saveActivity}>{pendingAction === "download" ? "Save & download" : "Confirm save"}</button><button type="button" className="button secondary" disabled={saving} onClick={() => setPendingAction(null)}>Cancel</button></div></div>}
      <p className="save-message" role="status">{saveMessage}</p>
    </aside>
    <section className="preview-card" aria-label="Live Word Search preview"><div className="preview-bar"><span>Live playable preview</span><span className="status-dot">● {found.length === activeWords.length && activeWords.length > 0 ? "Complete" : `${found.length} of ${activeWords.length} found`}</span></div><div className="game-preview">
      <p className="game-label">Phoneme Word Search</p><h2>Find the sound patterns</h2><p className="hint">Search across, down, diagonally and backwards. Click the first and last sound in each word.</p>
      <div className="search-grid" role="group" aria-label={`${gridSize} by ${gridSize} phoneme word search`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>{grid.flat().map((sound, index) => <button type="button" data-hint={WORD_SEARCH_HINTS[sound]} aria-label={`/${sound}/, ${WORD_SEARCH_HINTS[sound]}`} aria-pressed={start === index || foundCells.includes(index)} className={`phoneme-help ${start === index ? "selected" : ""} ${foundCells.includes(index) ? "found" : ""}`} key={`${sound}-${index}`} onClick={() => selectCell(index)}>/{sound}/</button>)}</div>
      <p className={`instruction ${found.length === activeWords.length && activeWords.length > 0 ? "completion-status complete" : ""}`} role="status">{message}</p><h3>Words to find</h3>
      <ul className="word-list">{activeWords.map((word) => <li className={found.includes(word.id) ? "found-word" : ""} key={word.id}>{displaySounds(word.sounds)} <small>{word.id}</small></li>)}</ul>
      <button type="button" className="button secondary reset-button" onClick={resetGame}>Reset activity</button>
    </div></section>
  </section>;
}
