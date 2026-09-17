import type { ActivityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordGeneration(activityType: ActivityType | null, successful: boolean) {
  try {
    await prisma.generationEvent.create({ data: { activityType, successful } });
  } catch (error) {
    // A metrics outage must not prevent a teacher from downloading their puzzle.
    console.error("Could not record generation metric", error);
  }
}
