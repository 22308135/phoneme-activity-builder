import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

const fixture = vi.hoisted(() => ({ directory: "" }));
vi.mock("@/lib/prisma", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  fixture.directory = mkdtempSync(join(tmpdir(), "phoneme-dashboard-test-"));
  return { prisma: new PrismaClient({ datasourceUrl: `file:${join(fixture.directory, "test.db").replaceAll("\\", "/")}` }) };
});

import { prisma } from "@/lib/prisma";
import { GET as dashboard } from "@/app/api/dashboard/route";
import { POST as recordVisit } from "@/app/api/usage/route";
import { GET as download } from "@/app/api/activities/[id]/download/route";
import { POST as previewDownload } from "@/app/api/download/route";
import { MAX_VISIT_DURATION_MS } from "@/lib/usage";

const visitId = "10000000-0000-4000-8000-000000000001";
const requestVisit = (input: unknown) => recordVisit(new Request("http://localhost/api/usage", {
  method: "POST", body: JSON.stringify(input), headers: { "Content-Type": "application/json" },
}));
const getData = async () => {
  const response = await dashboard();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  return response.json();
};
const createActivity = () => prisma.activity.create({ data: {
  title: "Dashboard test Wordle", type: "WORDLE",
  words: { create: [{ text: "chip", phonemes: JSON.stringify(["tʃ", "ɪ", "p"]), isTarget: true }] },
} });

beforeAll(async () => {
  // Exercise the actual committed migrations against a disposable SQLite database.
  const root = join(process.cwd(), "prisma", "migrations");
  for (const folder of readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const sql = readFileSync(join(root, folder.name, "migration.sql"), "utf8");
    for (const statement of sql.split(";").filter((statement) => statement.trim())) await prisma.$executeRawUnsafe(statement);
  }
});

beforeEach(async () => {
  await prisma.generationEvent.deleteMany();
  await prisma.pageVisit.deleteMany();
  await prisma.word.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.dictionaryWord.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  if (fixture.directory) rmSync(fixture.directory, { recursive: true, force: true });
});

describe("database-backed dashboard", () => {
  it("shows truthful empty metrics without inventing usage", async () => {
    const data = await getData();
    expect(data.library).toMatchObject({ totalActivities: 0, wordEntries: 0, dictionaryWords: 26, customDictionaryWords: 0 });
    expect(data.usage).toMatchObject({ totalVisits: 0, averageTimeMs: null, mostUsed: null, since: null, successfulGenerations: 0, failedGenerations: 0 });
    expect(data.recentActivities).toEqual([]);
  });

  it("summarises saved settings and deduplicates curated dictionary overrides", async () => {
    const activity = await createActivity();
    await prisma.activity.create({ data: { title: "Search", type: "WORD_SEARCH", gridSize: 8 } });
    await prisma.dictionaryWord.create({ data: { text: "chip", phonemes: '["tʃ","ɪ","p"]', hint: "Custom hint" } });
    const data = await getData();
    expect(data.library).toMatchObject({ totalActivities: 2, wordle: 1, wordSearch: 1, wordEntries: 1, dictionaryWords: 26, customDictionaryWords: 1 });
    expect(data.library.difficulties[0]).toEqual({ label: "Foundation", count: 2 });
    expect(data.recentActivities.find((item: { id: number }) => item.id === activity.id)).toMatchObject({ wordCount: 1, hintEnabled: true });
  });

  it("deduplicates heartbeats, resists late updates and computes mean visible time", async () => {
    for (const durationMs of [0, 60000, 60000, 1000]) {
      expect((await requestVisit({ id: visitId, activityType: "WORDLE", durationMs })).status).toBe(204);
    }
    await requestVisit({ id: "10000000-0000-4000-8000-000000000002", activityType: "WORD_SEARCH", durationMs: 30000 });
    let data = await getData();
    expect(data.usage).toMatchObject({ totalVisits: 2, wordleVisits: 1, wordSearchVisits: 1, averageTimeMs: 45000, mostUsed: "Equal usage" });
    await requestVisit({ id: "10000000-0000-4000-8000-000000000003", activityType: "WORDLE", durationMs: 30000 });
    data = await getData();
    expect(data.usage).toMatchObject({ totalVisits: 3, averageTimeMs: 40000, mostUsed: "Wordle" });
  });

  it.each([-1, 1.5, MAX_VISIT_DURATION_MS + 1, "1000"])("rejects invalid timing %s", async (durationMs) => {
    expect((await requestVisit({ id: visitId, activityType: "WORDLE", durationMs })).status).toBe(400);
    expect(await prisma.pageVisit.count()).toBe(0);
  });

  it("rejects malformed input and unknown activity types", async () => {
    expect((await requestVisit({ id: visitId, activityType: "UNKNOWN", durationMs: 0 })).status).toBe(400);
    expect((await recordVisit(new Request("http://localhost/api/usage", { method: "POST", body: "{" }))).status).toBe(400);
  });

  it("records real generation success and failure, preserving history after deletion", async () => {
    const activity = await createActivity();
    const response = await download(new NextRequest(`http://localhost/api/activities/${activity.id}/download`), { params: Promise.resolve({ id: String(activity.id) }) });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("const target=");
    expect((await download(new NextRequest("http://localhost/api/activities/missing/download"), { params: Promise.resolve({ id: "missing" }) })).status).toBe(400);
    await prisma.activity.delete({ where: { id: activity.id } });
    const data = await getData();
    expect(data.library.totalActivities).toBe(0);
    expect(data.usage).toMatchObject({ successfulGenerations: 1, failedGenerations: 1 });
  });

  it("records invalid saved phonemes as a failed generation", async () => {
    const activity = await createActivity();
    await prisma.word.updateMany({ where: { activityId: activity.id }, data: { phonemes: "invalid" } });
    expect((await download(new NextRequest("http://localhost/download"), { params: Promise.resolve({ id: String(activity.id) }) })).status).toBe(422);
    expect((await getData()).usage.failedGenerations).toBe(1);
  });

  it("also counts preview download responses", async () => {
    const body = new FormData();
    body.set("html", "<!doctype html><title>Preview</title>");
    const response = await previewDownload(new NextRequest("http://localhost/api/download?filename=wordle-phoneme-activity.html", { method: "POST", body }));
    expect(response.status).toBe(200);
    expect((await getData()).usage.successfulGenerations).toBe(1);
  });

  it("returns an unavailable state instead of misleading zeros on database failure", async () => {
    const failure = vi.spyOn(prisma, "$transaction").mockRejectedValueOnce(new Error("Database unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect((await dashboard()).status).toBe(503);
    } finally { failure.mockRestore(); log.mockRestore(); }
  });

  it("still delivers an output if recording its metric fails", async () => {
    const activity = await createActivity();
    const failure = vi.spyOn(prisma.generationEvent, "create").mockRejectedValueOnce(new Error("Metrics unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect((await download(new NextRequest("http://localhost/download"), { params: Promise.resolve({ id: String(activity.id) }) })).status).toBe(200);
    } finally { failure.mockRestore(); log.mockRestore(); }
  });
});
