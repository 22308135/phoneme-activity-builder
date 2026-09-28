-- Extend the earlier generation history without discarding recorded outcomes.
ALTER TABLE "GenerationEvent" RENAME COLUMN "success" TO "successful";
CREATE INDEX "GenerationEvent_successful_idx" ON "GenerationEvent"("successful");

CREATE TABLE "PageVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityType" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PageVisit_activityType_idx" ON "PageVisit"("activityType");
