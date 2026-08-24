import { z } from "zod";

export const activityTypes = ["WORDLE", "WORD_SEARCH"] as const;
export const difficulties = ["FOUNDATION", "DEVELOPING", "EXTENDING"] as const;

export const wordInputSchema = z.object({
  text: z.string().trim().min(1, "Enter the written word").max(80),
  phonemes: z.array(z.string().trim().min(1, "Phonemes cannot be blank").max(20)).min(1, "Add at least one phoneme").max(30),
  hint: z.string().trim().max(300).optional().default(""),
  isTarget: z.boolean().optional().default(false),
});

export const activityInputSchema = z.object({
  title: z.string().trim().min(2, "Enter an activity title").max(120),
  type: z.enum(activityTypes),
  difficulty: z.enum(difficulties).default("FOUNDATION"),
  gridSize: z.number().int().min(7).max(12).nullable().optional(),
  hintEnabled: z.boolean().default(true),
  words: z.array(wordInputSchema).min(1, "Add at least one word").max(30),
}).superRefine((value, context) => {
  if (value.type === "WORDLE" && value.words.filter((word) => word.isTarget).length !== 1) {
    context.addIssue({ code: "custom", path: ["words"], message: "A Wordle activity must have exactly one target word" });
  }
  if (value.type === "WORD_SEARCH" && value.words.length < 2) {
    context.addIssue({ code: "custom", path: ["words"], message: "A Word Search needs at least two words" });
  }
});

export type ActivityInput = z.infer<typeof activityInputSchema>;

export function parsePhonemes(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeActivity<T extends { words: Array<{ phonemes: string }> }>(activity: T) {
  return { ...activity, words: activity.words.map((word) => ({ ...word, phonemes: parsePhonemes(word.phonemes) })) };
}

export function prismaActivityData(input: ActivityInput) {
  return {
    title: input.title,
    type: input.type,
    difficulty: input.difficulty,
    gridSize: input.type === "WORD_SEARCH" ? (input.gridSize ?? 7) : null,
    hintEnabled: input.hintEnabled,
    words: {
      create: input.words.map((word, position) => ({
        text: word.text,
        phonemes: JSON.stringify(word.phonemes),
        hint: word.hint || null,
        isTarget: input.type === "WORDLE" && word.isTarget,
        position,
      })),
    },
  };
}
