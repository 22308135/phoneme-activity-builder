import { NextRequest, NextResponse } from "next/server";
import { recordGeneration } from "@/lib/generationMetrics";

const allowedFilenames = new Set([
  "wordle-phoneme-activity.html",
  "word-search-phoneme-activity.html",
]);

export async function POST(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get("filename");
  const activityType = filename === "wordle-phoneme-activity.html" ? "WORDLE" : filename === "word-search-phoneme-activity.html" ? "WORD_SEARCH" : null;
  try {
    const response = await download(request);
    await recordGeneration(activityType, response.ok);
    return response;
  } catch {
    await recordGeneration(activityType, false);
    return NextResponse.json({ error: "Invalid activity file" }, { status: 400 });
  }
}

async function download(request: NextRequest) {
  const formData = await request.formData();
  const html = formData.get("html");
  const requestedFilename = request.nextUrl.searchParams.get("filename") ?? "phoneme-activity.html";
  const filename = allowedFilenames.has(requestedFilename)
    ? requestedFilename
    : "phoneme-activity.html";

  if (typeof html !== "string" || !html.startsWith("<!doctype html>")) {
    return NextResponse.json({ error: "Invalid activity file" }, { status: 400 });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
