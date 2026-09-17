import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { snapshot, generateReport } from "lighthouse";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const label = process.argv.find((arg) => arg.startsWith("--label="))?.slice(8) ?? "check";
if (!/^[a-z0-9-]+$/.test(label)) throw new Error("Use a short lowercase --label, such as before or after.");
const chromePath = process.env.CHROME_PATH ?? [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium",
].find(existsSync);
if (!chromePath) throw new Error("Install Chrome or set CHROME_PATH to a Chromium browser executable.");
const port = 3300;
const baseURL = `http://127.0.0.1:${port}`;
await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", () => reject(new Error(`Port ${port} is in use; free it before auditing.`)));
  probe.listen(port, "127.0.0.1", () => probe.close(resolve));
});

const output = path.join(root, "artifacts/lighthouse", `${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}-${label}`);
mkdirSync(output, { recursive: true });
const temp = mkdtempSync(path.join(os.tmpdir(), "phoneme-lighthouse-"));
const database = path.join(temp, "audit.db");
writeFileSync(database, "");
const env = { ...process.env, DATABASE_URL: `file:${database.replaceAll("\\", "/")}`, NODE_ENV: "production" };
let server;
let browser;
const serverLog = createWriteStream(path.join(output, "server.log"));
const results = [];
const metadata = {
  label, startedAt: new Date().toISOString(), mode: "Lighthouse accessibility snapshots of fully loaded pages",
  node: process.version, os: `${os.type()} ${os.release()}`, buildId: readFileSync(path.join(root, ".next/BUILD_ID"), "utf8").trim(),
  sourceCommit: spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim(),
  sourceHasUncommittedChanges: Boolean(spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).stdout.trim()),
};

function stopServer() {
  if (!server?.pid || server.exitCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
  else server.kill("SIGTERM");
}

async function ready() {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("Audit server stopped before becoming healthy.");
    try { if ((await fetch(`${baseURL}/health`, { signal: AbortSignal.timeout(1000) })).ok) return; } catch { /* Starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Audit server did not become healthy.");
}

try {
  for (const args of [["node_modules/prisma/build/index.js", "migrate", "deploy"], ["--experimental-strip-types", "prisma/seed.ts"]]) {
    const command = spawnSync(process.execPath, args, { cwd: root, env, encoding: "utf8", windowsHide: true });
    if (command.status !== 0) throw new Error(command.stderr || command.stdout);
  }
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.pipe(serverLog, { end: false });
  server.stderr.pipe(serverLog, { end: false });
  await ready();
  browser = await puppeteer.launch({ executablePath: chromePath, headless: true, userDataDir: path.join(temp, "browser"), args: ["--no-first-run", "--no-default-browser-check"] });
  metadata.browser = await browser.version();
  for (const viewport of [{ name: "desktop", width: 1280, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
    for (const theme of ["light", "dark"]) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1, isMobile: viewport.name === "mobile", hasTouch: viewport.name === "mobile" });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      for (const [name, route] of [["home", "/"], ["dashboard", "/dashboard"], ["wordle", "/wordle"], ["word-search", "/word-search"]]) {
        const id = `${name}-${viewport.name}-${theme}`;
        await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle0", timeout: 30000 });
        await page.waitForFunction((expected) => document.documentElement.dataset.theme === expected, {}, theme);
        if (name === "dashboard") await page.waitForSelector(".dashboard-table tbody tr");
        if (name === "wordle") await page.waitForFunction(() => document.querySelectorAll("#target-word option").length > 0 || document.querySelectorAll(".control-panel select option").length > 3);
        if (name === "word-search") await page.waitForSelector(".word-picker-list input");
        const state = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, viewportWidth: window.innerWidth, pageWidth: document.documentElement.scrollWidth, title: document.title }));
        const result = await snapshot(page, { flags: {
          onlyCategories: ["accessibility"], formFactor: viewport.name, screenEmulation: { disabled: true },
          emulatedUserAgent: false, logLevel: "error",
        } });
        if (!result || result.lhr.runtimeError || result.lhr.categories.accessibility.score === null) throw new Error(`Lighthouse failed for ${id}: ${result?.lhr.runtimeError?.message ?? "no score"}`);
        const { lhr } = result;
        const failures = lhr.categories.accessibility.auditRefs.map(({ id }) => lhr.audits[id]).filter((audit) => audit.score === 0 || audit.scoreDisplayMode === "error").map((audit) => ({ id: audit.id, title: audit.title, description: audit.description, details: audit.details, errorMessage: audit.errorMessage }));
        writeFileSync(path.join(output, `${id}.json`), JSON.stringify(lhr, null, 2));
        writeFileSync(path.join(output, `${id}.html`), generateReport(lhr, "html"));
        results.push({ id, route, viewport: viewport.name, theme, state, score: Math.round(lhr.categories.accessibility.score * 100), lighthouseVersion: lhr.lighthouseVersion, failures });
        writeFileSync(path.join(output, "summary.json"), JSON.stringify({ metadata, results }, null, 2));
        console.log(`${id}: ${Math.round(lhr.categories.accessibility.score * 100)}/100${failures.length ? ` — ${failures.map((item) => item.id).join(", ")}` : " — no failed automated audits"}`);
      }
      await context.close();
    }
  }
  metadata.finishedAt = new Date().toISOString();
} catch (error) {
  metadata.failure = String(error);
  process.exitCode = 1;
  console.error(error);
} finally {
  await browser?.close();
  stopServer();
  serverLog.end();
  writeFileSync(path.join(output, "summary.json"), JSON.stringify({ metadata, results }, null, 2));
  writeFileSync(path.join(output, "summary.csv"), ["Page,Viewport,Theme,Accessibility score,Failed audits", ...results.map((result) => [result.route, result.viewport, result.theme, result.score, result.failures.map((failure) => failure.id).join(";")].join(","))].join("\n") + "\n");
  const resolved = path.resolve(temp);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("phoneme-lighthouse-")) throw new Error("Unexpected temporary directory; refusing cleanup.");
  rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  console.log(`Lighthouse evidence: ${output}`);
}
