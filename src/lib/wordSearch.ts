import { PHONEME_HINTS } from "@/lib/wordleKeys";

export const WORD_SEARCH_SIZE = 7;

export const WORD_SEARCH_GRID = [
  ["æ", "θ", "ɪ", "n", "ʃ", "k", "m"],
  ["p", "t", "ŋ", "æ", "k", "dʒ", "ʃ"],
  ["ɪ", "n", "m", "æ", "dʒ", "θ", "ɪ"],
  ["tʃ", "s", "k", "p", "n", "æ", "p"],
  ["tʃ", "θ", "m", "k", "ŋ", "p", "dʒ"],
  ["n", "ɪ", "æ", "s", "k", "ɪ", "θ"],
  ["p", "m", "p", "ŋ", "dʒ", "t", "s"],
];

export const WORD_SEARCH_HINTS = PHONEME_HINTS;

const DIRECTIONS = [
  [0, 1], [1, 0], [1, 1], [1, -1],
  [0, -1], [-1, 0], [-1, -1], [-1, 1],
] as const;

const FILLER_SOUNDS = Object.keys(WORD_SEARCH_HINTS);

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export class WordSearchPlacementError extends Error {}

export function generateWordSearch(words: string[][], size: number, seed: number) {
  if (!Number.isInteger(size) || size < 1 || size > 12 || !words.length || words.some((word) => !word.length || word.some((sound) => !sound.trim()))) {
    throw new WordSearchPlacementError("Choose valid words and a grid size from 1 to 12.");
  }
  if (words.some((word) => word.length > size)) {
    throw new WordSearchPlacementError("A selected word is too long for this grid. Choose a larger grid or remove that word.");
  }
  const random = seededRandom(seed);
  const orderedWords = [...words].sort((a, b) => b.length - a.length);
  for (let restart = 0; restart < 80; restart++) {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  let complete = true;
  for (const word of orderedWords) {
    const candidates: Array<{ row: number; column: number; rowStep: number; columnStep: number }> = [];
    for (const [rowStep, columnStep] of DIRECTIONS) {
      for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
      const endRow = row + rowStep * (word.length - 1);
      const endColumn = column + columnStep * (word.length - 1);
      if (endRow < 0 || endRow >= size || endColumn < 0 || endColumn >= size) continue;

      const fits = word.every((sound, index) => {
        const existing = grid[row + rowStep * index][column + columnStep * index];
        return existing === null || existing === sound;
      });
      if (!fits) continue;

      candidates.push({ row, column, rowStep, columnStep });
      }
    }
    if (!candidates.length) { complete = false; break; }
    const { row, column, rowStep, columnStep } = candidates[Math.floor(random() * candidates.length)];
    word.forEach((sound, index) => { grid[row + rowStep * index][column + columnStep * index] = sound; });
  }
  if (complete) return grid.map((row) => row.map((sound) => sound ?? FILLER_SOUNDS[Math.floor(random() * FILLER_SOUNDS.length)]));
  }
  throw new WordSearchPlacementError("Could not fit every selected word. Choose a larger grid or fewer words, then try again.");
}
