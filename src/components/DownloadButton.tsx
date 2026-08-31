"use client";

import { createGameHtml, type Activity, type Difficulty } from "@/lib/gameHtml";
import { WORD_SEARCH_GRID, WORD_SEARCH_SIZE } from "@/lib/wordSearch";

type Props = { activity: Activity; answer: string; hint: string; words: string[]; difficulty?: Difficulty; searchGrid?: string[][]; searchSize?: number; savedActivityId?: number };

export function DownloadButton({ activity, answer, hint, words, difficulty = "Foundation", searchGrid = WORD_SEARCH_GRID, searchSize = WORD_SEARCH_SIZE, savedActivityId }: Props) {
  const download = () => {
    if (savedActivityId) { const link = document.createElement("a"); link.href = `/api/activities/${savedActivityId}/download`; link.click(); return; }
    const html = createGameHtml(activity, activity === "wordle" ? "Phoneme Wordle" : "Phoneme Word Search", answer, hint, words, difficulty, searchGrid, searchSize);
    const form = document.createElement("form"); const htmlField = document.createElement("textarea");
    form.method = "POST"; form.action = `/api/download?filename=${encodeURIComponent(`${activity}-phoneme-activity.html`)}`; form.style.display = "none";
    htmlField.name = "html"; htmlField.value = html; form.appendChild(htmlField); document.body.appendChild(form); form.submit(); window.setTimeout(() => form.remove(), 1000);
  };
  return <button type="button" className="button primary" onClick={download}>{savedActivityId ? "Download saved activity" : "Generate & download HTML"} <span aria-hidden="true">↓</span></button>;
}
