import { describe, expect, it } from "vitest";
import { createGameHtml } from "@/lib/gameHtml";
import { generateWordSearch } from "@/lib/wordSearch";
import { dictionaryEntries } from "@/lib/phonemeDictionary";

function containsWord(grid: string[][], word: string[]) {
  const directions = [-1, 0, 1].flatMap((row) => [-1, 0, 1].map((column) => [row, column])).filter(([row, column]) => row || column);
  return grid.some((row, rowIndex) => row.some((_, columnIndex) => directions.some(([rowStep, columnStep]) => word.every((sound, index) => grid[rowIndex + rowStep * index]?.[columnIndex + columnStep * index] === sound))));
}

describe("activity generation", () => {
  it("never drops selected words across classroom sizes and seeds", () => {
    const entries = dictionaryEntries();
    for (const size of [7, 8, 9]) for (let seed = 0; seed < 40; seed++) {
      const words = Array.from({ length: 10 }, (_, offset) => entries[(seed + offset) % entries.length].phonemes);
      expect(words.every((word) => containsWord(generateWordSearch(words, size, seed), word))).toBe(true);
    }
  });

  it("rejects oversized and impossible selections instead of returning an incomplete grid", () => {
    expect(() => generateWordSearch([["a", "b", "c"]], 2, 1)).toThrow(/too long/);
    expect(() => generateWordSearch([["a", "a"], ["b", "b"], ["c", "c"]], 2, 1)).toThrow(/Could not fit every/);
  });
  it("places each phoneme word in a deterministic search grid", () => {
    const words = [["θ", "ɪ", "n"], ["tʃ", "ɪ", "p"]];
    const first = generateWordSearch(words, 7, 42);
    expect(first).toEqual(generateWordSearch(words, 7, 42));
    expect(words.every((word) => containsWord(first, word))).toBe(true);
  });

  it("places a larger classroom word selection in the grid", () => {
    const words = [["b", "aː", "θ"], ["b", "ʊ", "k"], ["k", "æ", "t"], ["tʃ", "eə"], ["tʃ", "iː", "z"], ["t", "r", "eɪ", "n"]];
    const grid = generateWordSearch(words, 7, 1);
    expect(words.every((word) => containsWord(grid, word))).toBe(true);
  });

  it("generates escaped, standalone Wordle HTML", () => {
    const html = createGameHtml("wordle", "Sounds < Level 1", "tʃ ɪ p", "A <small> piece", ["chip"], "Foundation");
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Sounds &lt; Level 1");
    expect(html).toContain("A &lt;small&gt; piece");
    expect(html).toContain('const target=["tʃ","ɪ","p"]');
    expect(html).toContain("button.dataset.hint");
    expect(html).not.toContain("undefined");
    expect(html).toContain('"tʃ":"CH as in chip"');
    expect(html).toContain(":focus-visible)::after");
  });
});
