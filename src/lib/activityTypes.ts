export type SavedWord = { id?: number; text: string; phonemes: string[]; hint?: string | null; isTarget: boolean };
export type SavedActivity = {
  id: number; title: string; type: "WORDLE" | "WORD_SEARCH";
  difficulty: "FOUNDATION" | "DEVELOPING" | "EXTENDING";
  gridSize?: number | null; hintEnabled: boolean; words: SavedWord[]; updatedAt: string;
};
