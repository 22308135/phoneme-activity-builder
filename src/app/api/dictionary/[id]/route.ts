import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid word id" }, { status: 400 });
  const result = await prisma.dictionaryWord.deleteMany({ where: { id } });
  if (!result.count) return NextResponse.json({ error: "Dictionary word not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
