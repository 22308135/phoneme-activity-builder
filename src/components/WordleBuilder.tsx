"use client";

import { useEffect, useState } from "react";
import type { SavedActivity } from "@/lib/activityTypes";
import { buildWordleKeys, phonemeHint } from "@/lib/wordleKeys";

type Difficulty = "Foundation" | "Developing" | "Extending";
type Guess = { sounds: string[]; result: ("correct" | "present" | "absent")[] };
type DictionaryOption = { id?: number; phonemes: string[]; word: string; hint: string; source?: "curated" | "custom" };
const defaultOptions: DictionaryOption[] = [
  { phonemes: ["θ", "ɪ", "n"], word: "thin", hint: "A slim shape or object" },
  { phonemes: ["ʃ", "ɪ", "p"], word: "ship", hint: "It travels on water" },
  { phonemes: ["tʃ", "ɪ", "p"], word: "chip", hint: "A small piece, or a snack" },
];
const settings = { Foundation: { attempts: 6, keyCount: 6, hint: "shown" }, Developing: { attempts: 5, keyCount: 9, hint: "optional" }, Extending: { attempts: 4, keyCount: 12, hint: "hidden" } } as const;

export function WordleBuilder() {
  const [activityId, setActivityId] = useState<number | "">("");
  const [options, setOptions] = useState(defaultOptions);
  const [index, setIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("Foundation");
  const [current, setCurrent] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [message, setMessage] = useState("Choose the phoneme tiles in order.");
  const [showHint, setShowHint] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const choice = options[index], config = settings[difficulty];
  const keys = buildWordleKeys(choice.phonemes, config.keyCount, `${choice.word}-${difficulty}`);
  const won = guesses.some((guess) => guess.result.every((state) => state === "correct"));
  const gameOver = won || guesses.length >= config.attempts;

  const resetGame = () => { setCurrent([]); setGuesses([]); setMessage("Choose the phoneme tiles in order."); setShowHint(difficulty === "Foundation"); };
  const changeTarget = (nextIndex: number) => { setIndex(nextIndex); setActivityId(""); setSaveMessage(""); setCurrent([]); setGuesses([]); setMessage("Choose the phoneme tiles in order."); };
  const changeDifficulty = (next: Difficulty, keepSaved = false) => { setDifficulty(next); if (!keepSaved) setActivityId(""); setSaveMessage(""); setCurrent([]); setGuesses([]); setMessage("Choose the phoneme tiles in order."); setShowHint(next === "Foundation"); };
  const applyActivity = (activity: SavedActivity) => {
    const nextOptions = activity.words.map((word) => ({ phonemes: word.phonemes, word: word.text, hint: word.hint ?? "No hint provided" }));
    if (!nextOptions.length) return;
    const targetIndex = Math.max(0, activity.words.findIndex((word) => word.isTarget));
    setOptions(nextOptions); setIndex(targetIndex);
    changeDifficulty((activity.difficulty.charAt(0) + activity.difficulty.slice(1).toLowerCase()) as Difficulty, true); setActivityId(activity.id);
  };
  useEffect(() => {
    const requested = Number(new URLSearchParams(window.location.search).get("activity"));
    if (requested) { fetch(`/api/activities/${requested}`, { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((saved: SavedActivity) => applyActivity(saved)).catch(() => undefined); return; }
    fetch("/api/dictionary", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((entries: DictionaryOption[]) => {
      if (entries.length) { setOptions(entries); setIndex(Math.max(0, entries.findIndex((entry) => entry.word === "thin"))); }
    }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const saveActivity = async (download: boolean) => {
    setSaving(true); setSaveMessage("Saving to Activities…");
    const payload = { title: `${choice.word[0].toUpperCase()}${choice.word.slice(1)} phoneme Wordle`, type: "WORDLE", difficulty: difficulty.toUpperCase(), gridSize: null, hintEnabled: difficulty !== "Extending", words: [{ text: choice.word, phonemes: choice.phonemes, hint: choice.hint, isTarget: true }] };
    const response = await fetch(activityId ? `/api/activities/${activityId}` : "/api/activities", { method: activityId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json(); setSaving(false);
    if (!response.ok) { setSaveMessage(result?.issues?.[0]?.message ?? result.error ?? "Could not save activity."); return; }
    setActivityId(result.id); setSaveMessage(download ? "Saved to Activities and download started." : "Saved to Activities.");
    if (download) { const link = document.createElement("a"); link.href = `/api/activities/${result.id}/download`; link.click(); }
  };
  const addSound = (sound: string) => { if (!gameOver && current.length < choice.phonemes.length) setCurrent([...current, sound]); };
  const submitGuess = () => {
    if (gameOver) return;
    if (current.length !== choice.phonemes.length) { setMessage(`Choose ${choice.phonemes.length} phonemes first.`); return; }
    const result: Guess["result"] = current.map((sound, position) => sound === choice.phonemes[position] ? "correct" : choice.phonemes.includes(sound) ? "present" : "absent");
    const correct = result.every((state) => state === "correct"), finalAttempt = guesses.length + 1 >= config.attempts;
    setGuesses([...guesses, { sounds: current, result }]); setCurrent([]);
    setMessage(correct ? `Correct — the English word is ${choice.word}.` : finalAttempt ? `No attempts left — the word was ${choice.word}.` : "Not quite. Try another sound sequence.");
  };

  return <section className="builder-grid">
    <aside className="control-panel" aria-label="Wordle settings"><p className="eyebrow">Activity settings</p><h1>Build a phoneme Wordle</h1>
      <label>Target phoneme word<select value={index} onChange={(event) => changeTarget(Number(event.target.value))}>{options.map((option, optionIndex) => <option value={optionIndex} key={option.word}>/{option.phonemes.join("/ /")}/ · {option.word}</option>)}</select></label>
      <label>Difficulty<select value={difficulty} onChange={(event) => changeDifficulty(event.target.value as Difficulty)}><option>Foundation</option><option>Developing</option><option>Extending</option></select></label>
      <div className="tip"><strong>{difficulty}</strong><br />{config.attempts} attempts · {config.keyCount} sound keys · hint {config.hint}.</div>
      <div className="builder-actions"><button type="button" className="button secondary" disabled={saving} onClick={() => saveActivity(false)}>Save Wordle to Activities</button><button type="button" className="button primary" disabled={saving} onClick={() => saveActivity(true)}>Generate &amp; download HTML <span aria-hidden="true">↓</span></button></div>
      <p className="save-message" role="status">{saveMessage}</p>
    </aside>
    <section className="preview-card" aria-label="Live Wordle preview"><div className="preview-bar"><span>Live playable preview</span><span className="status-dot">● {won ? "Complete" : gameOver ? "Finished" : `${guesses.length} of ${config.attempts} attempts`}</span></div><div className="game-preview wordle-game">
      <p className="game-label">Phoneme Wordle</p><h2>Listen. Look. Build the word.</h2>
      {difficulty !== "Extending" && (showHint ? <p className="hint">Hint: {choice.hint}</p> : <button type="button" className="text-button" onClick={() => setShowHint(true)}>Show hint</button>)}
      <div className="wordle-board" role="group" style={{ gridTemplateColumns: `repeat(${choice.phonemes.length}, 64px)` }} aria-label="Phoneme guesses">{Array.from({ length: config.attempts }, (_, row) => Array.from({ length: choice.phonemes.length }, (__, column) => { const guess = guesses[row]; const sound = guess?.sounds[column] ?? (row === guesses.length ? current[column] : ""); const state = guess?.result[column] ?? ""; return <div className={`wordle-cell ${state}`} key={`${row}-${column}`}>{sound && `/${sound}/`}</div>; }))}</div>
      <p className={`instruction ${won ? "completion-status complete" : gameOver ? "completion-status unsuccessful" : ""}`} role="status">{message}</p>
      <div className="phoneme-keyboard" aria-label="Phoneme keyboard">{keys.map((sound) => { const explanation = phonemeHint(sound); return <button type="button" className="phoneme-help" data-hint={explanation} key={sound} aria-label={`/${sound}/, ${explanation}`} disabled={gameOver} onClick={() => addSound(sound)}>/{sound}/</button>; })}<button type="button" className="action-key" disabled={gameOver} onClick={submitGuess}>Enter</button><button type="button" className="action-key" disabled={gameOver} aria-label="Delete last phoneme" onClick={() => setCurrent(current.slice(0, -1))}>⌫</button></div>
      <button type="button" className="button secondary reset-button" onClick={resetGame}>{gameOver ? "Play again" : "Reset game"}</button>
    </div></section>
  </section>;
}
