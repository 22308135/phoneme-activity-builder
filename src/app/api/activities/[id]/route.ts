import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { activityInputSchema, prismaActivityData, serializeActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";

function idFrom(params: Promise<{ id: string }>) {
  return params.then(({ id }) => Number(id));
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await idFrom(params);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 });
  const activity = await prisma.activity.findUnique({ where: { id }, include: { words: { orderBy: { position: "asc" } } } });
  return activity ? NextResponse.json(serializeActivity(activity)) : NextResponse.json({ error: "Activity not found" }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await idFrom(params);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 });
  try {
    const input = activityInputSchema.parse(await request.json());
    const exists = await prisma.activity.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    const data = prismaActivityData(input);
    const activity = await prisma.$transaction(async (database) => {
      await database.word.deleteMany({ where: { activityId: id } });
      return database.activity.update({ where: { id }, data, include: { words: { orderBy: { position: "asc" } } } });
    });
    return NextResponse.json(serializeActivity(activity));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Malformed JSON request" }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Could not update activity" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await idFrom(params);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 });
  const result = await prisma.activity.deleteMany({ where: { id } });
  return result.count ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Activity not found" }, { status: 404 });
}
