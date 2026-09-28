import type { ActivityType } from "@prisma/client";
import { recordGeneration as recordEvent } from "@/lib/generationEvents";

export async function recordGeneration(activityType: ActivityType | null, successful: boolean) {
  await recordEvent({ activityType, successful, error: successful ? null : "Invalid activity file" });
}
