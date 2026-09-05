import { describe, expect, it } from "vitest";
import { buildWordleKeys } from "@/lib/wordleKeys";

describe("Wordle keyboard", () => {
  it("includes every answer sound among the requested number of keys", () => {
    const keys = buildWordleKeys(["tʃ", "eə"], 9, "chair-Developing");
    expect(keys).toHaveLength(9);
    expect(keys).toContain("tʃ");
    expect(keys).toContain("eə");
  });

  it("does not expose the answer as the first sequence of keys", () => {
    const target = ["tʃ", "eə"];
    expect(buildWordleKeys(target, 9, "chair-Developing").slice(0, target.length)).not.toEqual(target);
  });

  it("keeps the order stable for the same activity settings", () => {
    expect(buildWordleKeys(["θ", "ɪ", "n"], 6, "thin-Foundation")).toEqual(buildWordleKeys(["θ", "ɪ", "n"], 6, "thin-Foundation"));
  });
});
