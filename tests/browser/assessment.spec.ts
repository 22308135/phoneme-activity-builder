import { expect, test } from "@playwright/test";
import axe from "axe-core";

test("Word Search limits grow with grid size and preserve selection when shrinking", async ({ page }) => {
  await page.goto("/word-search");
  const boxes = page.locator(".word-picker-list input[type=checkbox]");
  await expect(boxes).toHaveCount(26);
  for (let index = 5; index < 10; index++) await boxes.nth(index).check();
  await expect(boxes.nth(10)).toBeDisabled();
  await page.getByLabel("Grid size").selectOption("8");
  for (let index = 10; index < 15; index++) await boxes.nth(index).check();
  await expect(boxes.nth(15)).toBeDisabled();
  await page.getByLabel("Grid size").selectOption("9");
  for (let index = 15; index < 20; index++) await boxes.nth(index).check();
  await expect(boxes.nth(20)).toBeDisabled();
  await expect(page.locator(".search-grid button")).toHaveCount(81);
  await page.getByLabel("Grid size").selectOption("7");
  await expect(page.locator(".word-picker-list input:checked")).toHaveCount(20);
  await expect(page.locator(".control-panel [role=alert]")).toContainText("Deselect 10 words");
  await expect(page.getByRole("button", { name: /Generate & download/ })).toBeDisabled();
});

test("Word Search rebuilds from checked words and blocks words that cannot fit", async ({ page }) => {
  const entries = Array.from({ length: 6 }, (_, index) => ({ word: `word${index}`, phonemes: [String(index), String(index)], hint: "Test word" }));
  entries.push({ word: "oversized", phonemes: Array(10).fill("long"), hint: "Too long" });
  await page.route("**/api/dictionary", (route) => route.fulfill({ json: entries }));
  await page.goto("/word-search");
  const cells = page.locator(".search-grid button");
  await expect(cells).toHaveCount(49);
  await expect(page.getByRole("checkbox", { name: /word5/ })).not.toBeChecked();
  await expect(page.locator(".search-grid")).not.toContainText("/5/");
  await page.getByRole("checkbox", { name: /word5/ }).check();
  await expect(page.locator(".search-grid")).toContainText("/5/");
  await page.getByRole("checkbox", { name: /word5/ }).uncheck();
  await expect(page.locator(".search-grid")).not.toContainText("/5/");
  await page.getByRole("checkbox", { name: /oversized/ }).check();
  await expect(page.locator(".control-panel").getByRole("alert")).toContainText("too long");
  await expect(cells).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Generate & download/ })).toBeDisabled();
  await page.getByRole("checkbox", { name: /oversized/ }).uncheck();
  await expect(cells).toHaveCount(49);
});

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

test("teacher can create, edit, and delete through the interface", async ({ page, request }) => {
  const updatedTitle = `UI walkthrough updated ${Date.now()}`;
  const existing = await (await request.get("/api/activities?type=WORDLE")).json();
  for (const activity of existing.filter((item: { title: string }) => ["Zap phoneme Wordle", "UI walkthrough activity"].includes(item.title))) await request.delete(`/api/activities/${activity.id}`);
  await page.goto("/dictionary");
  await page.getByLabel("Written word").fill("zap");
  await page.getByLabel("Ordered phonemes").fill("z, æ, p");
  await page.getByLabel("Child-friendly hint").fill("A quick burst of energy");
  await page.getByRole("button", { name: "Add to dictionary" }).click();
  await expect(page.getByRole("status")).toContainText("zap added");
  await page.goto("/wordle");
  await page.getByLabel("Target phoneme word").selectOption({ label: "/z/ /æ/ /p/ · zap" });
  await page.getByRole("button", { name: "Save Wordle to Activities" }).click();
  await expect(page.getByLabel("Activity name")).toHaveValue("Zap phoneme Wordle");
  await page.getByLabel("Activity name").fill("UI walkthrough activity");
  await page.getByRole("button", { name: "Confirm save" }).click();
  await expect(page.locator(".save-message")).toContainText("UI walkthrough activity");
  await page.goto("/activities");
  const card = page.locator(".saved-list article").filter({ hasText: "UI walkthrough activity" }).first();
  await card.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/activities\/\d+\/edit$/);
  await page.getByLabel("Activity title").fill(updatedTitle);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/activities$/);
  const updated = page.locator(".saved-list article").filter({ hasText: updatedTitle });
  page.once("dialog", (dialog) => dialog.accept());
  await updated.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("status")).toContainText("Activity deleted");
  await page.goto("/dictionary");
  const customWord = page.locator(".dictionary-grid article").filter({ hasText: "zap" });
  page.once("dialog", (dialog) => dialog.accept());
  await customWord.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("status")).toContainText("zap removed");
});

test("generating Wordle HTML also saves it to Activities", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-edge", "Download workflow only needs one browser project");
  const activityTitle = "Automated downloaded Wordle";
  const existing = await (await request.get("/api/activities?type=WORDLE")).json();
  for (const activity of existing.filter((item: { title: string }) => item.title === activityTitle)) await request.delete(`/api/activities/${activity.id}`);
  await page.goto("/wordle");
  await page.getByLabel("Target phoneme word").selectOption({ label: "/tʃ/ /ɪ/ /p/ · chip" });
  await page.getByRole("button", { name: /Generate & download HTML/ }).click();
  await page.getByLabel("Activity name").fill(activityTitle);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save & download" }).click();
  await download;
  await expect(page.locator(".save-message")).toContainText(activityTitle);
  const saved = await (await request.get("/api/activities?type=WORDLE")).json();
  const created = saved.find((item: { title: string }) => item.title === activityTitle);
  expect(created).toBeTruthy();
  await request.delete(`/api/activities/${created.id}`);
});

test("Word Search uses the dictionary and saves before download", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-edge", "Download workflow only needs one browser project");
  const activityTitle = "Automated dictionary Word Search";
  const existing = await (await request.get("/api/activities?type=WORD_SEARCH")).json();
  for (const activity of existing.filter((item: { title: string }) => item.title === activityTitle)) await request.delete(`/api/activities/${activity.id}`);
  await page.goto("/word-search");
  await page.getByLabel("Find a word").fill("train");
  await page.getByRole("checkbox", { name: /train/ }).check();
  await page.getByRole("button", { name: /Generate & download HTML/ }).click();
  await page.getByLabel("Activity name").fill(activityTitle);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save & download" }).click();
  await download;
  await expect(page.locator(".save-message")).toContainText(activityTitle);
  const saved = await (await request.get("/api/activities?type=WORD_SEARCH")).json();
  const created = saved.find((item: { title: string }) => item.title === activityTitle);
  expect(created.words).toHaveLength(6);
  await request.delete(`/api/activities/${created.id}`);
});

test("key pages have no serious automated accessibility violations", async ({ page }) => {
  for (const route of ["/", "/about", "/settings", "/activities", "/dictionary", "/wordle", "/word-search"]) {
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
