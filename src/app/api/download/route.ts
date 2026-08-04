import { NextRequest, NextResponse } from "next/server";

const allowedFilenames = new Set([
  "wordle-phoneme-activity.html",
  "word-search-phoneme-activity.html",
]);

export async function POST(request: NextRequest) {
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
