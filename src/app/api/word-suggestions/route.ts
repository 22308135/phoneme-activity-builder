import { NextRequest, NextResponse } from "next/server";
import { findWordSuggestion } from "@/lib/phonemeDictionary";

export function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get("word")?.trim() ?? "";
  if (!word || word.length > 80) {
    return NextResponse.json({ error: "Enter a valid word" }, { status: 400 });
  }

  const suggestion = findWordSuggestion(word);
  if (!suggestion) {
    return NextResponse.json({ error: "No curated suggestion is available for this word" }, { status: 404 });
  }

  return NextResponse.json({ word, ...suggestion, source: "curated-local" });
}
