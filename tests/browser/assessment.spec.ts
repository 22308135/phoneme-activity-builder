import { expect, test } from "@playwright/test";
import axe from "axe-core";
import { pathToFileURL } from "node:url";

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

test("health, stored phonemes, and download API work", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "API workflow only needs one browser project");
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

test("learner can open, complete, and reset a generated Wordle", async ({ page, request }, testInfo) => {
  const activityTitle = "Automated downloaded Wordle";
  const existing = await (await request.get("/api/activities?type=WORDLE")).json();
  for (const activity of existing.filter((item: { title: string }) => item.title === activityTitle)) await request.delete(`/api/activities/${activity.id}`);
  await page.goto("/wordle");
  await page.getByLabel("Target phoneme word").selectOption({ label: "/tʃ/ /ɪ/ /p/ · chip" });
  await page.getByRole("button", { name: /Generate & download HTML/ }).click();
  await page.getByLabel("Activity name").fill(activityTitle);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save & download" }).click();
  const file = testInfo.outputPath("wordle.html");
  await (await download).saveAs(file);
  await testInfo.attach("Generated Wordle", { path: file, contentType: "text/html" });
  await expect(page.locator(".save-message")).toContainText(activityTitle);
  const saved = await (await request.get("/api/activities?type=WORDLE")).json();
  const created = saved.find((item: { title: string }) => item.title === activityTitle);
  expect(created).toBeTruthy();
  await page.context().setOffline(true);
  await page.goto(pathToFileURL(file).href);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(activityTitle);
  for (const sound of ["tʃ", "ɪ", "p"]) await page.getByRole("button", { name: new RegExp(`^/${sound}/,`) }).click();
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.locator("#message")).toHaveText("Completed — the English word is chip.");
  await page.getByRole("button", { name: "Reset activity" }).click();
  await expect(page.locator("#message")).toHaveText("Choose the phonemes in order.");
  await page.context().setOffline(false);
  await request.delete(`/api/activities/${created.id}`);
});

test("learner can open, complete, and reset a generated Word Search", async ({ page, request }, testInfo) => {
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
  const file = testInfo.outputPath("word-search.html");
  await (await download).saveAs(file);
  await testInfo.attach("Generated Word Search", { path: file, contentType: "text/html" });
  await expect(page.locator(".save-message")).toContainText(activityTitle);
  const saved = await (await request.get("/api/activities?type=WORD_SEARCH")).json();
  const created = saved.find((item: { title: string }) => item.title === activityTitle);
  expect(created.words).toHaveLength(6);
  await page.context().setOffline(true);
  await page.goto(pathToFileURL(file).href);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(activityTitle);
  const cells = page.locator("#search-grid button");
  const sounds = (await cells.allTextContents()).map((text) => text.slice(1, -1));
  const size = Math.sqrt(sounds.length);
  for (const word of created.words as Array<{ phonemes: string[] }>) {
    let endpoints: number[] | undefined;
    for (let start = 0; start < sounds.length && !endpoints; start++) {
      for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
        if (dx === 0 && dy === 0) continue;
        const indices = word.phonemes.map((_, offset) => {
          const x = start % size + dx * offset;
          const y = Math.floor(start / size) + dy * offset;
          return x >= 0 && x < size && y >= 0 && y < size ? y * size + x : -1;
        });
        if (indices.every((index, offset) => index >= 0 && sounds[index] === word.phonemes[offset])) endpoints = [indices[0], indices.at(-1)!];
      }
    }
    expect(endpoints, `Visible grid must contain ${word.phonemes.join(" ")}`).toBeDefined();
    await cells.nth(endpoints![0]).click();
    await cells.nth(endpoints![1]).click();
  }
  await expect(page.locator("#message")).toHaveText("Completed — you found every phoneme word!");
  await expect(page.locator("#targets .found-word")).toHaveCount(6);
  await page.getByRole("button", { name: "Reset activity" }).click();
  await expect(page.locator("#targets .found-word")).toHaveCount(0);
  await page.context().setOffline(false);
  await request.delete(`/api/activities/${created.id}`);
});

test("key pages have no serious automated accessibility violations", async ({ page }) => {
  for (const route of ["/", "/dashboard", "/about", "/settings", "/activities", "/dictionary", "/wordle", "/word-search"]) {
    await page.goto(route);
    if (route === "/dashboard") await expect(page.getByRole("button", { name: "Refresh dashboard" })).toBeEnabled();
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => await (window as typeof window & { axe: { run: () => Promise<{ violations: Array<{ impact: string | null; id: string }> }> } }).axe.run());
    expect(results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), route).toEqual([]);
  }
});

test("Home opens the dashboard and refresh shows persisted generation metrics", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "View dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".dashboard-health")).toContainText("System healthy");
  const baseline = await (await request.get("/api/dashboard")).json();
  const metric = (label: string) => page.locator(".dashboard-metric").filter({ has: page.locator("dt", { hasText: label }) }).locator(".dashboard-metric-value");
  const response = await request.post("/api/activities", { data: {
    title: "Dashboard browser evidence", type: "WORDLE", difficulty: "FOUNDATION", hintEnabled: true, gridSize: null,
    words: [{ text: "chip", phonemes: ["tʃ", "ɪ", "p"], hint: "A small piece", isTarget: true }],
  } });
  expect(response.status()).toBe(201);
  const created = await response.json();
  try {
    expect((await request.get(`/api/activities/${created.id}/download`)).status()).toBe(200);
    await page.getByRole("button", { name: "Refresh dashboard" }).click();
    await expect(metric("Wordle activities")).toHaveText(String(baseline.library.wordle + 1));
    await expect(metric("Successful generations")).toHaveText(String(baseline.usage.successfulGenerations + 1));
    await expect(page.getByRole("region", { name: "Recent activity configurations" })).toContainText(created.title);
    expect((await request.delete(`/api/activities/${created.id}`)).status()).toBe(204);
    await page.reload();
    await expect(metric("Wordle activities")).toHaveText(String(baseline.library.wordle));
    await expect(metric("Successful generations")).toHaveText(String(baseline.usage.successfulGenerations + 1));
  } finally {
    await request.delete(`/api/activities/${created.id}`);
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
