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

export function generateWordSearch(words: string[][], size: number, seed: number) {
  const random = seededRandom(seed);
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 300 && !placed; attempt += 1) {
      const [rowStep, columnStep] = DIRECTIONS[Math.floor(random() * DIRECTIONS.length)];
      const row = Math.floor(random() * size);
      const column = Math.floor(random() * size);
      const endRow = row + rowStep * (word.length - 1);
      const endColumn = column + columnStep * (word.length - 1);
      if (endRow < 0 || endRow >= size || endColumn < 0 || endColumn >= size) continue;

      const fits = word.every((sound, index) => {
        const existing = grid[row + rowStep * index][column + columnStep * index];
        return existing === null || existing === sound;
      });
      if (!fits) continue;

      word.forEach((sound, index) => {
        grid[row + rowStep * index][column + columnStep * index] = sound;
      });
      placed = true;
    }
  }

  return grid.map((row) => row.map((sound) => sound ?? FILLER_SOUNDS[Math.floor(random() * FILLER_SOUNDS.length)]));
}
