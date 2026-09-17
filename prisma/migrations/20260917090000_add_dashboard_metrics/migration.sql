CREATE TABLE "GenerationEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activityType" TEXT,
    "successful" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "GenerationEvent_successful_idx" ON "GenerationEvent"("successful");

CREATE TABLE "PageVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityType" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PageVisit_activityType_idx" ON "PageVisit"("activityType");
