"use client";

import { useEffect, useState } from "react";
import { DownloadButton } from "./DownloadButton";
import type { SavedActivity } from "@/lib/activityTypes";

type Difficulty = "Foundation" | "Developing" | "Extending";
type Guess = { sounds: string[]; result: ("correct" | "present" | "absent")[] };
const defaultOptions = [
  { phonemes: ["θ", "ɪ", "n"], word: "thin", hint: "A slim shape or object" },
  { phonemes: ["ʃ", "ɪ", "p"], word: "ship", hint: "It travels on water" },
  { phonemes: ["tʃ", "ɪ", "p"], word: "chip", hint: "A small piece, or a snack" },
];
const allKeys = ["θ", "ʃ", "tʃ", "dʒ", "ŋ", "ɪ", "æ", "n", "p", "m", "t", "k"];
const soundHints: Record<string, string> = { θ: "TH as in thin", ʃ: "SH as in ship", tʃ: "CH as in chip", dʒ: "J as in jam", ŋ: "NG as in sing", ɪ: "I as in sit", æ: "A as in cat", n: "N as in nose", p: "P as in pen", m: "M as in map", t: "T as in top", k: "K as in kite" };
const settings = { Foundation: { attempts: 6, keyCount: 6, hint: "shown" }, Developing: { attempts: 5, keyCount: 9, hint: "optional" }, Extending: { attempts: 4, keyCount: 12, hint: "hidden" } } as const;

export function WordleBuilder() {
  const [activities, setActivities] = useState<SavedActivity[]>([]);
  const [activityId, setActivityId] = useState<number | "">("");
  const [options, setOptions] = useState(defaultOptions);
  const [index, setIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("Foundation");
  const [current, setCurrent] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [message, setMessage] = useState("Choose the phoneme tiles in order.");
  const [showHint, setShowHint] = useState(true);
  const choice = options[index], config = settings[difficulty];
  const keys = [...new Set([...choice.phonemes, ...allKeys])].slice(0, config.keyCount);
  const won = guesses.some((guess) => guess.result.every((state) => state === "correct"));
  const gameOver = won || guesses.length >= config.attempts;

  const resetGame = () => { setCurrent([]); setGuesses([]); setMessage("Choose the phoneme tiles in order."); setShowHint(difficulty === "Foundation"); };
  const changeTarget = (nextIndex: number) => { setIndex(nextIndex); setCurrent([]); setGuesses([]); setMessage("Choose the phoneme tiles in order."); };
  const changeDifficulty = (next: Difficulty) => { setDifficulty(next); setCurrent([]); setGuesses([]); setMessage("Choose the phoneme tiles in order."); setShowHint(next === "Foundation"); };
  const applyActivity = (activity: SavedActivity) => {
    const nextOptions = activity.words.map((word) => ({ phonemes: word.phonemes, word: word.text, hint: word.hint ?? "No hint provided" }));
    if (!nextOptions.length) return;
    const targetIndex = Math.max(0, activity.words.findIndex((word) => word.isTarget));
    setActivityId(activity.id); setOptions(nextOptions); setIndex(targetIndex);
    changeDifficulty((activity.difficulty.charAt(0) + activity.difficulty.slice(1).toLowerCase()) as Difficulty);
  };
  useEffect(() => {
    fetch("/api/activities?type=WORDLE", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((saved: SavedActivity[]) => {
      setActivities(saved);
      const requested = Number(new URLSearchParams(window.location.search).get("activity"));
      const selected = saved.find((activity) => activity.id === requested);
      if (selected) applyActivity(selected);
    }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      <div className="saved-source"><label>Load saved activity<select value={activityId} onChange={(event) => { const activity = activities.find((item) => item.id === Number(event.target.value)); if (activity) applyActivity(activity); }}><option value="">Assessment 1 examples</option>{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title}</option>)}</select></label></div>
      <label>Target phoneme word<select value={index} onChange={(event) => changeTarget(Number(event.target.value))}>{options.map((option, optionIndex) => <option value={optionIndex} key={option.word}>/{option.phonemes.join("/ /")}/ · {option.word}</option>)}</select></label>
      <label>Difficulty<select value={difficulty} onChange={(event) => changeDifficulty(event.target.value as Difficulty)}><option>Foundation</option><option>Developing</option><option>Extending</option></select></label>
      <div className="tip"><strong>{difficulty}</strong><br />{config.attempts} attempts · {config.keyCount} sound keys · hint {config.hint}.</div>
      <DownloadButton activity="wordle" answer={choice.phonemes.join(" ")} hint={choice.hint} words={[choice.word]} difficulty={difficulty} savedActivityId={activityId || undefined} />
    </aside>
    <section className="preview-card" aria-label="Live Wordle preview"><div className="preview-bar"><span>Live playable preview</span><span className="status-dot">● {won ? "Complete" : gameOver ? "Finished" : `${guesses.length} of ${config.attempts} attempts`}</span></div><div className="game-preview wordle-game">
      <p className="game-label">Phoneme Wordle</p><h2>Listen. Look. Build the word.</h2>
      {difficulty !== "Extending" && (showHint ? <p className="hint">Hint: {choice.hint}</p> : <button type="button" className="text-button" onClick={() => setShowHint(true)}>Show hint</button>)}
      <div className="wordle-board" role="group" style={{ gridTemplateColumns: `repeat(${choice.phonemes.length}, 64px)` }} aria-label="Phoneme guesses">{Array.from({ length: config.attempts }, (_, row) => Array.from({ length: choice.phonemes.length }, (__, column) => { const guess = guesses[row]; const sound = guess?.sounds[column] ?? (row === guesses.length ? current[column] : ""); const state = guess?.result[column] ?? ""; return <div className={`wordle-cell ${state}`} key={`${row}-${column}`}>{sound && `/${sound}/`}</div>; }))}</div>
      <p className={`instruction ${won ? "completion-status complete" : gameOver ? "completion-status unsuccessful" : ""}`} role="status">{message}</p>
      <div className="phoneme-keyboard" aria-label="Phoneme keyboard">{keys.map((sound) => <button type="button" key={sound} title={`/${sound}/ — ${soundHints[sound]}`} disabled={gameOver} onClick={() => addSound(sound)}>/{sound}/</button>)}<button type="button" className="action-key" disabled={gameOver} onClick={submitGuess}>Enter</button><button type="button" className="action-key" disabled={gameOver} aria-label="Delete last phoneme" onClick={() => setCurrent(current.slice(0, -1))}>⌫</button></div>
      <button type="button" className="button secondary reset-button" onClick={resetGame}>{gameOver ? "Play again" : "Reset game"}</button>
    </div></section>
  </section>;
}
