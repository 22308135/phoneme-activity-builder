import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordGeneration(data: Prisma.GenerationEventCreateInput) {
  try {
    await prisma.generationEvent.create({ data });
  } catch (error) {
    // Monitoring failure must not prevent a teacher downloading a valid activity.
    console.error("Could not persist generation event", error);
  }
}
