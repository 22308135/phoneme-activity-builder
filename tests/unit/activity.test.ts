import { describe, expect, it } from "vitest";
import { activityInputSchema, parsePhonemes, prismaActivityData, serializeActivity } from "@/lib/activity";

const validWordle = {
  title: "Initial sounds", type: "WORDLE" as const, difficulty: "FOUNDATION" as const, hintEnabled: true, gridSize: null,
  words: [{ text: "chip", phonemes: ["tʃ", "ɪ", "p"], hint: "A small piece", isTarget: true }],
};

describe("activity validation", () => {
  it("accepts ordered multi-character phonemes", () => {
    expect(activityInputSchema.parse(validWordle).words[0].phonemes).toEqual(["tʃ", "ɪ", "p"]);
  });

  it.each([
    [{ ...validWordle, title: "" }, "Enter an activity title"],
    [{ ...validWordle, words: [] }, "Add at least one word"],
    [{ ...validWordle, words: [{ ...validWordle.words[0], isTarget: false }] }, "exactly one target"],
    [{ ...validWordle, type: "WORD_SEARCH", words: validWordle.words }, "at least two words"],
  ])("rejects invalid input", (input, expectedMessage) => {
    const result = activityInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.message.includes(expectedMessage))).toBe(true);
  });

  it("serializes phonemes for Prisma and safely parses them back", () => {
    const data = prismaActivityData(validWordle);
    expect(data.words.create[0].phonemes).toBe('["tʃ","ɪ","p"]');
    expect(parsePhonemes(data.words.create[0].phonemes)).toEqual(["tʃ", "ɪ", "p"]);
    expect(parsePhonemes("not json")).toEqual([]);
    expect(serializeActivity({ words: [{ phonemes: data.words.create[0].phonemes }] }).words[0].phonemes).toEqual(["tʃ", "ɪ", "p"]);
  });
});
