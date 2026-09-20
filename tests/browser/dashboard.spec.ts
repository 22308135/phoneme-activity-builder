import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import axe from "axe-core";

test("dashboard records downloads and failures, retains history, and filters dates", async ({ page, request }) => {
  const prisma = new PrismaClient();
  const title = `Dashboard check ${Date.now()}`;
  let activityId: number | undefined;
  let historicalId: number | undefined;
  try {
    const before = await (await request.get("/api/dashboard?days=7")).json();
    const created = await request.post("/api/activities", { data: {
      title, type: "WORDLE", words: [{ text: "cat", phonemes: ["k", "a", "t"], isTarget: true }],
    } });
    expect(created.status()).toBe(201);
    activityId = (await created.json()).id;
    expect((await request.get(`/api/activities/${activityId}/download`)).status()).toBe(200);
    expect((await request.delete(`/api/activities/${activityId}`)).status()).toBe(204);
    expect((await request.get(`/api/activities/${activityId}/download`)).status()).toBe(404);
    const after = await (await request.get("/api/dashboard?days=7")).json();
    expect(after.successful).toBe(before.successful + 1);
    expect(after.failed).toBe(before.failed + 1);
    expect(after.wordle).toBe(before.wordle);
    expect(after.recent).toEqual(expect.arrayContaining([expect.objectContaining({ activityTitle: title, success: true })]));

    const historical = await prisma.generationEvent.create({ data: { success: true, activityType: "WORD_SEARCH", activityTitle: title, createdAt: new Date(Date.now() - 40 * 86400000) } });
    historicalId = historical.id;
    const week = await (await request.get("/api/dashboard?days=7")).json();
    const all = await (await request.get("/api/dashboard?days=all")).json();
    expect(week.successful).toBe(after.successful);
    expect(all.successful).toBeGreaterThan(week.successful);

    await page.goto("/dashboard?days=7");
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Database connected");
    await expect(page.getByTestId("generation-success")).toHaveText(String(after.successful));
    await expect(page.getByTestId("generation-failure")).toHaveText(String(after.failed));
    await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
    await expect(page.getByRole("cell", { name: title, exact: true })).toBeVisible();
    await page.getByLabel("Generation reporting period").selectOption("all");
    await page.getByRole("button", { name: "Refresh report" }).click();
    await expect(page).toHaveURL(/days=all/);
    await expect(page.getByTestId("generation-success")).toHaveText(String(all.successful));
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => {
      const result = await (window as typeof window & { axe: typeof axe }).axe.run();
      return result.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
    });
    expect(violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  } finally {
    if (activityId) {
      await prisma.generationEvent.deleteMany({ where: { activityId } });
      await prisma.activity.deleteMany({ where: { id: activityId } });
    }
    if (historicalId) await prisma.generationEvent.deleteMany({ where: { id: historicalId } });
    await prisma.$disconnect();
  }
});
