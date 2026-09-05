import { expect, test } from "@playwright/test";
import axe from "axe-core";

test("health, CRUD, phonemes, and stored download work", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-edge", "API workflow only needs one browser project");
  const health = await request.get("/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: "ok", database: "connected" });
  const created = await request.post("/api/activities", { data: {
    title: "Automated browser check", type: "WORDLE", difficulty: "FOUNDATION", hintEnabled: true, gridSize: null,
    words: [{ text: "chip", phonemes: ["tʃ", "ɪ", "p"], hint: "A small piece", isTarget: true }],
  } });
  expect(created.status()).toBe(201);
  const activity = await created.json();
  try {
    const read = await request.get(`/api/activities/${activity.id}`);
    expect((await read.json()).words[0].phonemes).toEqual(["tʃ", "ɪ", "p"]);
    const download = await request.get(`/api/activities/${activity.id}/download`);
    expect(download.status()).toBe(200);
    expect(download.headers()["content-disposition"]).toContain(`wordle-${activity.id}.html`);
    expect(await download.text()).toContain("const target=");
  } finally {
    expect((await request.delete(`/api/activities/${activity.id}`)).status()).toBe(204);
  }
});

test("teacher can create, edit, and delete through the interface", async ({ page }) => {
  await page.goto("/activities");
  await page.getByRole("link", { name: "New activity" }).click();
  await expect(page).toHaveURL(/\/activities\/new$/);
  await page.getByLabel("Activity title").fill("UI walkthrough activity");
  await page.getByLabel("Written word").fill("chip");
  await page.getByLabel("Written word").press("Tab");
  await expect(page.getByLabel("Ordered phonemes")).toHaveValue("tʃ, ɪ, p");
  await expect(page.getByLabel("Hint", { exact: true })).toHaveValue("A small piece");
  await page.getByRole("button", { name: "Create activity" }).click();
  await expect(page).toHaveURL(/\/activities$/);
  const card = page.locator(".saved-list article").filter({ hasText: "UI walkthrough activity" });
  await card.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/activities\/\d+\/edit$/);
  await page.getByLabel("Activity title").fill("UI walkthrough updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/activities$/);
  const updated = page.locator(".saved-list article").filter({ hasText: "UI walkthrough updated" });
  page.on("dialog", (dialog) => dialog.accept());
  await updated.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("status")).toContainText("Activity deleted");
});

test("key pages have no serious automated accessibility violations", async ({ page }) => {
  for (const route of ["/", "/about", "/settings", "/activities", "/activities/new", "/wordle", "/word-search"]) {
    await page.goto(route);
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => await (window as typeof window & { axe: { run: () => Promise<{ violations: Array<{ impact: string | null; id: string }> }> } }).axe.run());
    expect(results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), route).toEqual([]);
  }
});

test("system theme and layout preferences persist in cookies", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Light").check();
  await page.getByLabel("System").check();
  await page.getByLabel("Compact").check();
  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "phoneme-theme")?.value).toBe("system");
  expect(cookies.find((cookie) => cookie.name === "phoneme-layout")?.value).toBe("compact");
});
