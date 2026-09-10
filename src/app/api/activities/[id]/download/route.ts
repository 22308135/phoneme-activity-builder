import { NextRequest, NextResponse } from "next/server";
import { createGameHtml } from "@/lib/gameHtml";
import { parsePhonemes } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { generateWordSearch, WordSearchPlacementError } from "@/lib/wordSearch";

const difficultyNames = { FOUNDATION: "Foundation", DEVELOPING: "Developing", EXTENDING: "Extending" } as const;

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 });
  const activity = await prisma.activity.findUnique({ where: { id }, include: { words: { orderBy: { position: "asc" } } } });
  if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  const words = activity.words.map((word) => ({ ...word, sounds: parsePhonemes(word.phonemes) }));
  if (!words.length || words.some((word) => !word.sounds.length)) return NextResponse.json({ error: "The saved activity contains invalid phoneme data" }, { status: 422 });

  const isWordle = activity.type === "WORDLE";
  const target = words.find((word) => word.isTarget) ?? words[0];
  const gridSize = activity.gridSize ?? 7;
  let grid: string[][] | undefined;
  try {
    grid = isWordle ? undefined : generateWordSearch(words.map((word) => word.sounds), gridSize, activity.id);
  } catch (error) {
    if (error instanceof WordSearchPlacementError) return NextResponse.json({ error: error.message }, { status: 422 });
    throw error;
  }
  const html = createGameHtml(isWordle ? "wordle" : "word-search", activity.title, target.sounds.join(" "), activity.hintEnabled ? (target.hint ?? "No hint provided") : "", isWordle ? [target.text] : words.map((word) => word.sounds.join(" ")), difficultyNames[activity.difficulty], grid, gridSize);
  const filename = `${activity.type.toLowerCase().replace("_", "-")}-${activity.id}.html`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
}
