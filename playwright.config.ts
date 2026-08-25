import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3100", channel: "msedge", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-edge", use: { ...devices["Desktop Edge"] } },
    { name: "mobile-edge", use: { ...devices["Pixel 7"] } },
  ],
});
