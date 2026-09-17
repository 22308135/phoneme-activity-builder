import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", () => reject(new Error("Port 3100 is occupied; free it before running browser tests.")));
  probe.listen(3100, "127.0.0.1", () => probe.close(resolve));
});
const output = path.join(root, "artifacts/playwright", new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-"));
mkdirSync(output, { recursive: true });
const temp = mkdtempSync(path.join(os.tmpdir(), "phoneme-playwright-"));
const database = path.join(temp, "test.db");
writeFileSync(database, "");
const env = {
  ...process.env, NODE_ENV: "production", DATABASE_URL: `file:${database.replaceAll("\\", "/")}`,
  PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(output, "report"),
  PLAYWRIGHT_RESULTS_DIR: path.join(output, "results"),
  PLAYWRIGHT_JSON_OUTPUT_FILE: path.join(output, "results.json"),
};
const metadata = {
  startedAt: new Date().toISOString(), node: process.version, os: `${os.type()} ${os.release()}`,
  browserChannel: env.PLAYWRIGHT_BROWSER_CHANNEL ?? "chrome",
  buildId: readFileSync(path.join(root, ".next/BUILD_ID"), "utf8").trim(),
  sourceCommit: spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim(),
  sourceHasUncommittedChanges: Boolean(spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).stdout.trim()),
  database: "Temporary migrated and seeded SQLite database; removed after testing",
};
let server;
const serverLog = createWriteStream(path.join(output, "server.log"));
let exitCode = 1;
try {
  for (const args of [["node_modules/prisma/build/index.js", "migrate", "deploy"], ["--experimental-strip-types", "prisma/seed.ts"]]) {
    const result = spawnSync(process.execPath, args, { cwd: root, env, encoding: "utf8", windowsHide: true });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  }
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"], { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.pipe(serverLog, { end: false });
  server.stderr.pipe(serverLog, { end: false });
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("Browser-test server stopped before becoming healthy.");
    try {
      if ((await fetch("http://127.0.0.1:3100/health", { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; }
    } catch { /* Starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error("Browser-test server did not become healthy.");
  exitCode = await new Promise((resolve, reject) => {
    const tests = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)], { cwd: root, env, stdio: "inherit", windowsHide: true });
    tests.once("error", reject);
    tests.once("exit", (code) => resolve(code ?? 1));
  });
} catch (error) {
  metadata.failure = String(error);
  console.error(error);
} finally {
  if (server?.pid && server.exitCode === null) {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
    else server.kill("SIGTERM");
    if (server.exitCode === null) await new Promise((resolve) => server.once("exit", resolve));
  }
  serverLog.end();
  metadata.finishedAt = new Date().toISOString();
  metadata.exitCode = exitCode;
  writeFileSync(path.join(output, "run.json"), JSON.stringify(metadata, null, 2));
  const resolved = path.resolve(temp);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("phoneme-playwright-")) throw new Error("Unexpected temporary directory; refusing cleanup.");
  rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  console.log(`Browser-test evidence: ${output}`);
}
process.exitCode = exitCode;
