"use client";

import { useState } from "react";
import { DownloadButton } from "./DownloadButton";

const phonemeWords = [
  { id: "thin", sounds: ["θ", "ɪ", "n"] },
  { id: "ship", sounds: ["ʃ", "ɪ", "p"] },
  { id: "chip", sounds: ["tʃ", "ɪ", "p"] },
  { id: "jam", sounds: ["dʒ", "æ", "m"] },
  { id: "sing", sounds: ["s", "ɪ", "ŋ"] },
];
const grid = [
  ["θ", "ɪ", "n", "k", "æ"], ["ʃ", "ɪ", "p", "m", "t"], ["tʃ", "ɪ", "p", "ŋ", "æ"],
  ["dʒ", "æ", "m", "θ", "n"], ["s", "ɪ", "ŋ", "p", "k"],
];
const soundHints: Record<string, string> = { θ: "TH as in thin", ʃ: "SH as in ship", tʃ: "CH as in chip", dʒ: "J as in jam", ŋ: "NG as in sing", ɪ: "I as in sit", æ: "A as in cat", n: "N as in nose", p: "P as in pen", m: "M as in map", t: "T as in top", k: "K as in kite", s: "S as in sun" };
const displaySounds = (sounds: string[]) => sounds.map((sound) => `/${sound}/`).join(" ");

function cellsBetween(start: number, end: number) {
  const startRow = Math.floor(start / 5), startColumn = start % 5, endRow = Math.floor(end / 5), endColumn = end % 5;
  const rowDistance = endRow - startRow, columnDistance = endColumn - startColumn;
  if (rowDistance !== 0 && columnDistance !== 0 && Math.abs(rowDistance) !== Math.abs(columnDistance)) return [];
  const length = Math.max(Math.abs(rowDistance), Math.abs(columnDistance)) + 1;
  return Array.from({ length }, (_, offset) => (startRow + Math.sign(rowDistance) * offset) * 5 + startColumn + Math.sign(columnDistance) * offset);
}

export function WordSearchBuilder() {
  const [enabled, setEnabled] = useState(phonemeWords.map((word) => word.id));
  const [start, setStart] = useState<number | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<number[]>([]);
  const [message, setMessage] = useState("Click the first and last sound in a word.");
  const activeWords = phonemeWords.filter((word) => enabled.includes(word.id));

  const selectCell = (index: number) => {
    if (start === null) { setStart(index); setMessage("Now click the last sound in the word."); return; }
    const path = cellsBetween(start, index);
    const sounds = path.map((cell) => grid[Math.floor(cell / 5)][cell % 5]);
    const match = activeWords.find((word) => !found.includes(word.id) && [sounds.join("|"), [...sounds].reverse().join("|")].includes(word.sounds.join("|")));
    setStart(null);
    if (!match) { setMessage("That is not one of the target words. Try again."); return; }
    const nextFound = [...found, match.id];
    setFound(nextFound); setFoundCells([...new Set([...foundCells, ...path])]);
    setMessage(nextFound.length === activeWords.length ? "Excellent — you found every phoneme word!" : `Found ${displaySounds(match.sounds)} — ${match.id}.`);
  };

  const resetGame = () => { setStart(null); setFound([]); setFoundCells([]); setMessage("Click the first and last sound in a word."); };
  const toggleWord = (id: string) => {
    setEnabled((current) => current.includes(id) ? current.filter((word) => word !== id) : [...current, id]);
    setFound([]); setFoundCells([]); setStart(null); setMessage("Click the first and last sound in a word.");
  };

  return <section className="builder-grid">
    <aside className="control-panel" aria-label="Word Search settings">
      <p className="eyebrow">Activity settings</p><h1>Build a phoneme Word Search</h1>
      <label>Grid size<select value="5" disabled><option value="5">5 × 5</option></select></label>
      <fieldset><legend>Target words</legend>{phonemeWords.map((word) => <label className="check-row" key={word.id}><input type="checkbox" checked={enabled.includes(word.id)} onChange={() => toggleWord(word.id)} /> {displaySounds(word.sounds)} · {word.id}</label>)}</fieldset>
      <div className="tip"><strong>How students play</strong><br />Click the first sound and then the last sound of each phoneme word.</div>
      <DownloadButton activity="word-search" answer="" hint="Find each phoneme word" words={activeWords.map((word) => word.sounds.join(" "))} />
    </aside>
    <section className="preview-card" aria-label="Live Word Search preview"><div className="preview-bar"><span>Live playable preview</span><span className="status-dot">● {found.length === activeWords.length && activeWords.length > 0 ? "Complete" : `${found.length} of ${activeWords.length} found`}</span></div><div className="game-preview">
      <p className="game-label">Phoneme Word Search</p><h2>Find the sound patterns</h2><p className="hint">Click the first and last sound in each word.</p>
      <div className="search-grid" role="grid" aria-label="Phoneme word search">{grid.flat().map((sound, index) => <button type="button" role="gridcell" title={`/${sound}/ — ${soundHints[sound]}`} aria-label={`/${sound}/, ${soundHints[sound]}`} aria-selected={start === index || foundCells.includes(index)} className={`${start === index ? "selected" : ""} ${foundCells.includes(index) ? "found" : ""}`} key={`${sound}-${index}`} onClick={() => selectCell(index)}>/{sound}/</button>)}</div>
      <p className={`instruction ${found.length === activeWords.length && activeWords.length > 0 ? "completion-status complete" : ""}`} role="status">{message}</p><h3>Words to find</h3>
      <ul className="word-list">{activeWords.map((word) => <li className={found.includes(word.id) ? "found-word" : ""} key={word.id}>{displaySounds(word.sounds)} <small>{word.id}</small></li>)}</ul>
      <button type="button" className="button secondary reset-button" onClick={resetGame}>Reset activity</button>
    </div></section>
  </section>;
}
