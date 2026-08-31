import { describe, expect, it } from "vitest";
import { createGameHtml } from "@/lib/gameHtml";
import { generateWordSearch } from "@/lib/wordSearch";

function containsWord(grid: string[][], word: string[]) {
  const directions = [-1, 0, 1].flatMap((row) => [-1, 0, 1].map((column) => [row, column])).filter(([row, column]) => row || column);
  return grid.some((row, rowIndex) => row.some((_, columnIndex) => directions.some(([rowStep, columnStep]) => word.every((sound, index) => grid[rowIndex + rowStep * index]?.[columnIndex + columnStep * index] === sound))));
}

describe("activity generation", () => {
  it("places each phoneme word in a deterministic search grid", () => {
    const words = [["θ", "ɪ", "n"], ["tʃ", "ɪ", "p"]];
    const first = generateWordSearch(words, 7, 42);
    expect(first).toEqual(generateWordSearch(words, 7, 42));
    expect(words.every((word) => containsWord(first, word))).toBe(true);
  });

  it("generates escaped, standalone Wordle HTML", () => {
    const html = createGameHtml("wordle", "Sounds < Level 1", "tʃ ɪ p", "A <small> piece", ["chip"], "Foundation");
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Sounds &lt; Level 1");
    expect(html).toContain("A &lt;small&gt; piece");
    expect(html).toContain('const target=["tʃ","ɪ","p"]');
  });
});
