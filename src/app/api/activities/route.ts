import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { activityInputSchema, prismaActivityData, serializeActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  if (type && type !== "WORDLE" && type !== "WORD_SEARCH") {
    return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
  }
  const activities = await prisma.activity.findMany({
    where: type ? { type: type as "WORDLE" | "WORD_SEARCH" } : undefined,
    include: { words: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(activities.map(serializeActivity));
}

export async function POST(request: NextRequest) {
  try {
    const input = activityInputSchema.parse(await request.json());
    const activity = await prisma.activity.create({ data: prismaActivityData(input), include: { words: { orderBy: { position: "asc" } } } });
    return NextResponse.json(serializeActivity(activity), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Malformed JSON request" }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Could not create activity" }, { status: 500 });
  }
}
