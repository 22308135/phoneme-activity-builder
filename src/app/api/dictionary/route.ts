import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { dictionaryEntries } from "@/lib/phonemeDictionary";
import { prisma } from "@/lib/prisma";

const dictionaryWordSchema = z.object({
  text: z.string().trim().min(1, "Enter a written word").max(80).transform((value) => value.toLocaleLowerCase("en-AU")),
  phonemes: z.array(z.string().trim().min(1).max(20)).min(1, "Add at least one phoneme").max(30),
  hint: z.string().trim().min(1, "Enter a hint").max(300),
});

export async function GET() {
  const custom = await prisma.dictionaryWord.findMany({ orderBy: { text: "asc" } });
  const customWords = custom.map((entry) => ({ id: entry.id, word: entry.text, phonemes: JSON.parse(entry.phonemes) as string[], hint: entry.hint, source: "custom" as const }));
  const customNames = new Set(customWords.map((entry) => entry.word));
  return NextResponse.json([...dictionaryEntries().filter((entry) => !customNames.has(entry.word)), ...customWords].sort((a, b) => a.word.localeCompare(b.word)));
}

export async function POST(request: Request) {
  try {
    const input = dictionaryWordSchema.parse(await request.json());
    const word = await prisma.dictionaryWord.upsert({
      where: { text: input.text },
      update: { phonemes: JSON.stringify(input.phonemes), hint: input.hint },
      create: { text: input.text, phonemes: JSON.stringify(input.phonemes), hint: input.hint },
    });
    return NextResponse.json({ id: word.id, word: word.text, phonemes: input.phonemes, hint: word.hint, source: "custom" }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Could not save dictionary word" }, { status: 500 });
  }
}
