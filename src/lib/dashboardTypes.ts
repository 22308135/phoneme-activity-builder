export type DashboardData = {
  updatedAt: string;
  library: {
    totalActivities: number;
    wordle: number;
    wordSearch: number;
    wordEntries: number;
    dictionaryWords: number;
    customDictionaryWords: number;
    difficulties: { label: string; count: number }[];
  };
  usage: {
    successfulGenerations: number;
    failedGenerations: number;
    totalVisits: number;
    wordleVisits: number;
    wordSearchVisits: number;
    averageTimeMs: number | null;
    mostUsed: "Wordle" | "Word Search" | "Equal usage" | null;
    since: string | null;
  };
  recentActivities: {
    id: number;
    title: string;
    type: "WORDLE" | "WORD_SEARCH";
    difficulty: string;
    gridSize: number | null;
    hintEnabled: boolean;
    wordCount: number;
    updatedAt: string;
  }[];
};
