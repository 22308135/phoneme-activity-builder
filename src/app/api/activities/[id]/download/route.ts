import { NextRequest, NextResponse } from "next/server";
import { createGameHtml } from "@/lib/gameHtml";
import { parsePhonemes } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { recordGeneration } from "@/lib/generationEvents";
import { generateWordSearch, WordSearchPlacementError } from "@/lib/wordSearch";

const difficultyNames = { FOUNDATION: "Foundation", DEVELOPING: "Developing", EXTENDING: "Extending" } as const;

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  let snapshot: { activityId?: number; activityTitle?: string; activityType?: "WORDLE" | "WORD_SEARCH" } = {};
  const fail = async (error: string, status: number) => {
    await recordGeneration({ ...snapshot, successful: false, error });
    return NextResponse.json({ error }, { status });
  };
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) return fail("Invalid activity ID", 400);
  snapshot = { activityId: id };
  try {
    const activity = await prisma.activity.findUnique({ where: { id }, include: { words: { orderBy: { position: "asc" } } } });
    if (!activity) return fail("Activity not found", 404);
    snapshot = { activityId: id, activityTitle: activity.title, activityType: activity.type };
    const words = activity.words.map((word) => ({ ...word, sounds: parsePhonemes(word.phonemes) }));
    if (!words.length || words.some((word) => !word.sounds.length || word.sounds.some((sound) => !sound.trim()))) return fail("The saved activity contains empty or invalid phoneme data", 422);

    const isWordle = activity.type === "WORDLE";
    const target = words.find((word) => word.isTarget) ?? words[0];
    const gridSize = activity.gridSize ?? 7;
    let grid: string[][] | undefined;
    try {
      grid = isWordle ? undefined : generateWordSearch(words.map((word) => word.sounds), gridSize, activity.id);
    } catch (error) {
      if (error instanceof WordSearchPlacementError) return fail(error.message, 422);
      throw error;
    }
    const html = createGameHtml(isWordle ? "wordle" : "word-search", activity.title, target.sounds.join(" "), activity.hintEnabled ? (target.hint ?? "No hint provided") : "", isWordle ? [target.text] : words.map((word) => word.sounds.join(" ")), difficultyNames[activity.difficulty], grid, gridSize);
    const filename = `${activity.type.toLowerCase().replace("_", "-")}-${activity.id}.html`;
    await recordGeneration({ ...snapshot, successful: true });
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Activity generation failed", error);
    return fail("Could not generate activity", 500);
  }
}
