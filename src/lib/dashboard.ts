import { prisma } from "@/lib/prisma";

export async function getDashboard(days: 7 | 30 | null) {
  const where = days ? { createdAt: { gte: new Date(Date.now() - days * 86400000) } } : {};
  const { activities, wordCount, emptyLists, outcomes, usage, recent } = await prisma.$transaction(async (db) => {
    const activities = await db.activity.groupBy({ by: ["type"], _count: { _all: true } });
    const wordCount = await db.word.count();
    const emptyLists = await db.activity.count({ where: { words: { none: {} } } });
    const outcomes = await db.generationEvent.groupBy({ by: ["successful"], where, _count: { _all: true } });
    const usage = await db.generationEvent.groupBy({ by: ["activityType"], where: { ...where, successful: true, activityType: { not: null } }, _count: { _all: true } });
    const recent = await db.generationEvent.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20 });
    return { activities, wordCount, emptyLists, outcomes, usage, recent };
  });
  const count = (type: "WORDLE" | "WORD_SEARCH") => activities.find((row) => row.type === type)?._count._all ?? 0;
  const successful = outcomes.find((row) => row.successful)?._count._all ?? 0;
  const failed = outcomes.find((row) => !row.successful)?._count._all ?? 0;
  const maximum = Math.max(0, ...usage.map((row) => row._count._all));
  const mostUsed = usage.filter((row) => row._count._all === maximum).map((row) => row.activityType);
  return { wordle: count("WORDLE"), wordSearch: count("WORD_SEARCH"), wordCount, emptyLists, successful, failed, mostUsed, recent, checkedAt: new Date().toISOString() };
}

export function dashboardDays(value: string | null | undefined): 7 | 30 | null {
  return value === "all" ? null : value === "7" ? 7 : 30;
}


