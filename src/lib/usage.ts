import { z } from "zod";

export const MAX_VISIT_DURATION_MS = 24 * 60 * 60 * 1000;

export const pageVisitSchema = z.object({
  id: z.uuid(),
  activityType: z.enum(["WORDLE", "WORD_SEARCH"]),
  durationMs: z.number().int().min(0).max(MAX_VISIT_DURATION_MS),
}).strict();
