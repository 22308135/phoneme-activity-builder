import { NextRequest, NextResponse } from "next/server";
import { dashboardDays, getDashboard } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { dictionaryEntries } from "@/lib/phonemeDictionary";
import type { DashboardData } from "@/lib/dashboardTypes";

export const dynamic = "force-dynamic";

export async function GET(request?: NextRequest) {
  try {
    const { types, difficulties, wordEntries, customWords, generations, visits, time, firstGeneration, firstVisit, recent } = await prisma.$transaction(async (database) => {
      const types = await database.activity.groupBy({ by: ["type"], orderBy: { type: "asc" }, _count: { _all: true } });
      const difficulties = await database.activity.groupBy({ by: ["difficulty"], orderBy: { difficulty: "asc" }, _count: { _all: true } });
      const wordEntries = await database.word.count();
      const customWords = await database.dictionaryWord.findMany({ select: { text: true } });
      const generations = await database.generationEvent.groupBy({ by: ["successful"], orderBy: { successful: "asc" }, _count: { _all: true } });
      const visits = await database.pageVisit.groupBy({ by: ["activityType"], orderBy: { activityType: "asc" }, _count: { _all: true } });
      const time = await database.pageVisit.aggregate({ _avg: { durationMs: true } });
      const firstGeneration = await database.generationEvent.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } });
      const firstVisit = await database.pageVisit.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } });
      const recent = await database.activity.findMany({
        take: 6, orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: { id: true, title: true, type: true, difficulty: true, gridSize: true, hintEnabled: true, updatedAt: true, _count: { select: { words: true } } },
      });
      return { types, difficulties, wordEntries, customWords, generations, visits, time, firstGeneration, firstVisit, recent };
    });
    const wordle = types.find((item) => item.type === "WORDLE")?._count._all ?? 0;
    const wordSearch = types.find((item) => item.type === "WORD_SEARCH")?._count._all ?? 0;
    const wordleVisits = visits.find((item) => item.activityType === "WORDLE")?._count._all ?? 0;
    const wordSearchVisits = visits.find((item) => item.activityType === "WORD_SEARCH")?._count._all ?? 0;
    const dates = [firstGeneration?.createdAt, firstVisit?.createdAt].filter((date): date is Date => Boolean(date));
    const report = await getDashboard(dashboardDays(request?.nextUrl.searchParams.get("days") ?? "all"));
    const data: DashboardData = {
      generationReport: { ...report, recent: report.recent.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })) },
      updatedAt: new Date().toISOString(),
      library: {
        totalActivities: wordle + wordSearch, wordle, wordSearch, wordEntries,
        dictionaryWords: new Set([...dictionaryEntries().map((word) => word.word), ...customWords.map((word) => word.text)]).size,
        customDictionaryWords: customWords.length,
        difficulties: ["FOUNDATION", "DEVELOPING", "EXTENDING"].map((difficulty) => ({
          label: difficulty[0] + difficulty.slice(1).toLowerCase(),
          count: difficulties.find((item) => item.difficulty === difficulty)?._count._all ?? 0,
        })),
      },
      usage: {
        successfulGenerations: generations.find((item) => item.successful)?._count._all ?? 0,
        failedGenerations: generations.find((item) => !item.successful)?._count._all ?? 0,
        totalVisits: wordleVisits + wordSearchVisits, wordleVisits, wordSearchVisits,
        averageTimeMs: time._avg.durationMs,
        mostUsed: wordleVisits + wordSearchVisits === 0 ? null : wordleVisits === wordSearchVisits ? "Equal usage" : wordleVisits > wordSearchVisits ? "Wordle" : "Word Search",
        since: dates.length ? new Date(Math.min(...dates.map((date) => date.getTime()))).toISOString() : null,
      },
      recentActivities: recent.map(({ _count, updatedAt, ...activity }) => ({ ...activity, wordCount: _count.words, updatedAt: updatedAt.toISOString() })),
    };
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load dashboard", error);
    return NextResponse.json({ error: "Dashboard data is unavailable. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
