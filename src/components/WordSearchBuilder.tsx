"use client";

import { useMemo, useState } from "react";
import { DownloadButton } from "./DownloadButton";
import { generateWordSearch, WORD_SEARCH_HINTS } from "@/lib/wordSearch";

const phonemeWords = [
  { id: "thin", sounds: ["θ", "ɪ", "n"] },
  { id: "ship", sounds: ["ʃ", "ɪ", "p"] },
  { id: "chip", sounds: ["tʃ", "ɪ", "p"] },
  { id: "jam", sounds: ["dʒ", "æ", "m"] },
  { id: "sing", sounds: ["s", "ɪ", "ŋ"] },
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
  const [enabled, setEnabled] = useState(phonemeWords.map((word) => word.id));
  const [gridSize, setGridSize] = useState(7);
  const [puzzleSeed, setPuzzleSeed] = useState(1);
  const grid = useMemo(() => generateWordSearch(phonemeWords.map((word) => word.sounds), gridSize, puzzleSeed), [gridSize, puzzleSeed]);
  const [start, setStart] = useState<number | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<number[]>([]);
  const [message, setMessage] = useState("Click the first and last sound in a word.");
  const activeWords = phonemeWords.filter((word) => enabled.includes(word.id));

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

  const resetGame = () => { setStart(null); setFound([]); setFoundCells([]); setPuzzleSeed((seed) => seed + 1); setMessage("New puzzle generated. Click the first and last sound in a word."); };
  const toggleWord = (id: string) => {
    setEnabled((current) => current.includes(id) && current.length > 1 ? current.filter((word) => word !== id) : current.includes(id) ? current : [...current, id]);
    setFound([]); setFoundCells([]); setStart(null); setMessage("Click the first and last sound in a word.");
  };

  return <section className="builder-grid">
    <aside className="control-panel" aria-label="Word Search settings">
      <p className="eyebrow">Activity settings</p><h1>Build a phoneme Word Search</h1>
      <label>Grid size<select value={gridSize} onChange={(event) => { setGridSize(Number(event.target.value)); setPuzzleSeed((seed) => seed + 1); setStart(null); setFound([]); setFoundCells([]); setMessage("New grid generated. Click the first and last sound in a word."); }}><option value="7">7 × 7</option><option value="8">8 × 8</option><option value="9">9 × 9</option></select></label>
      <fieldset><legend>Target words</legend>{phonemeWords.map((word) => <label className="check-row" key={word.id}><input type="checkbox" checked={enabled.includes(word.id)} disabled={enabled.includes(word.id) && enabled.length === 1} onChange={() => toggleWord(word.id)} /> {displaySounds(word.sounds)} · {word.id}</label>)}</fieldset>
      <div className="tip"><strong>Mixed directions</strong><br />Words run horizontally, vertically, diagonally and backwards. Click the first and last sound to select one.</div>
      <DownloadButton activity="word-search" answer="" hint="Find each phoneme word" words={activeWords.map((word) => word.sounds.join(" "))} searchGrid={grid} searchSize={gridSize} />
    </aside>
    <section className="preview-card" aria-label="Live Word Search preview"><div className="preview-bar"><span>Live playable preview</span><span className="status-dot">● {found.length === activeWords.length && activeWords.length > 0 ? "Complete" : `${found.length} of ${activeWords.length} found`}</span></div><div className="game-preview">
      <p className="game-label">Phoneme Word Search</p><h2>Find the sound patterns</h2><p className="hint">Search across, down, diagonally and backwards. Click the first and last sound in each word.</p>
      <div className="search-grid" role="grid" aria-label={`${gridSize} by ${gridSize} phoneme word search`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>{grid.flat().map((sound, index) => <button type="button" role="gridcell" title={`/${sound}/ — ${WORD_SEARCH_HINTS[sound]}`} aria-label={`/${sound}/, ${WORD_SEARCH_HINTS[sound]}`} aria-selected={start === index || foundCells.includes(index)} className={`${start === index ? "selected" : ""} ${foundCells.includes(index) ? "found" : ""}`} key={`${sound}-${index}`} onClick={() => selectCell(index)}>/{sound}/</button>)}</div>
      <p className={`instruction ${found.length === activeWords.length && activeWords.length > 0 ? "completion-status complete" : ""}`} role="status">{message}</p><h3>Words to find</h3>
      <ul className="word-list">{activeWords.map((word) => <li className={found.includes(word.id) ? "found-word" : ""} key={word.id}>{displaySounds(word.sounds)} <small>{word.id}</small></li>)}</ul>
      <button type="button" className="button secondary reset-button" onClick={resetGame}>Reset activity</button>
    </div></section>
  </section>;
}
