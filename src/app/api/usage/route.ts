import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pageVisitSchema } from "@/lib/usage";

export async function POST(request: Request) {
  try {
    const input = pageVisitSchema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: "Invalid page visit" }, { status: 400 });
    const { id, activityType, durationMs } = input.data;
    await prisma.$transaction(async (database) => {
      await database.pageVisit.upsert({
        where: { id }, create: { id, activityType, durationMs }, update: {},
      });
      // Repeated or out-of-order heartbeats cannot double-count or shorten a visit.
      await database.pageVisit.updateMany({
        where: { id, activityType, durationMs: { lt: durationMs } }, data: { durationMs },
      });
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    console.error("Could not record page visit", error);
    return NextResponse.json({ error: "Usage recording unavailable" }, { status: 503 });
  }
}
