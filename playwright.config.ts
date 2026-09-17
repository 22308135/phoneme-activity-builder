import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  outputDir: process.env.PLAYWRIGHT_RESULTS_DIR ?? "test-results",
  reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ?? "test-results/results.json" }]],
  use: { baseURL: "http://127.0.0.1:3100", channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? "chrome", trace: "on", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
