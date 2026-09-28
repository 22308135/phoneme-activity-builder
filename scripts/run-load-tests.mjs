import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { summariseLoadRun } from "./summarise-load-tests.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const smokeOnly = process.argv.includes("--smoke");
const port = 3200;
const baseURL = `http://127.0.0.1:${port}`;
const toolFile = path.join(process.env.LOCALAPPDATA ?? os.homedir(), "PhonemeBuilderTools", "toolchain.json");
if (!existsSync(toolFile)) throw new Error("Run powershell -NoProfile -File scripts/setup-jmeter.ps1 first.");
const toolchain = JSON.parse(readFileSync(toolFile, "utf8").replace(/^\uFEFF/, ""));
if (!existsSync(toolchain.java) || !existsSync(toolchain.jmeterJar)) throw new Error("Portable Java/JMeter tools are missing. Run scripts/setup-jmeter.ps1 again.");
if (!existsSync(path.join(root, ".next", "BUILD_ID"))) throw new Error("Run npm run build before load testing.");

// Never attach a load test to an already-running user server.
await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", () => reject(new Error(`Port ${port} is in use. Stop that server or free the port before testing.`)));
  probe.listen(port, "127.0.0.1", () => probe.close(resolve));
});

const runName = `${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}${smokeOnly ? "-smoke" : ""}`;
const outputDirectory = path.join(root, "artifacts", "jmeter", runName);
mkdirSync(outputDirectory, { recursive: true });
const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "phoneme-jmeter-"));
let server;
let activeCommand;
let interrupted = false;

function stop(child) {
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
  else child.kill("SIGTERM");
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
  interrupted = true;
  stop(activeCommand);
  stop(server);
});

function command(executable, args, { env = process.env, log, timeoutMs = 180_000, quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const output = log ? createWriteStream(log) : null;
    const child = spawn(executable, args, { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    activeCommand = child;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; stop(child); }, timeoutMs);
    for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => {
      output?.write(chunk);
      if (!quiet) process.stdout.write(chunk);
    });
    child.once("error", (error) => { clearTimeout(timer); output?.end(); reject(error); });
    child.once("close", (code) => {
      clearTimeout(timer);
      output?.end();
      if (activeCommand === child) activeCommand = undefined;
      if (code === 0 && !timedOut && !interrupted) resolve();
      else reject(new Error(`${path.basename(executable)} ${timedOut ? "exceeded the time limit" : `exited with ${code}`}. See ${log ?? "console output"}.`));
    });
  });
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (interrupted || server.exitCode !== null) throw new Error("The isolated server stopped before becoming healthy.");
    try {
      const response = await fetch(`${baseURL}/health`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch { /* Retry while the new server starts. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("The isolated server did not become healthy.");
}

const stages = [{ name: "smoke", users: 1, durationSeconds: 30, rampSeconds: 1, loops: 2 },
  ...(smokeOnly ? [] : [1, 10, 25, 50, 100].map((users) => ({ name: `users-${users}`, users, durationSeconds: 60, rampSeconds: 10, loops: -1 })))];
const metadata = {
  startedAt: new Date().toISOString(), mode: smokeOnly ? "smoke" : "staged", baseURL,
  node: process.version, next: JSON.parse(readFileSync(path.join(root, "node_modules/next/package.json"), "utf8")).version,
  jmeter: toolchain.jmeterVersion, os: `${os.type()} ${os.release()} ${os.arch()}`,
  cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, totalMemoryGiB: +(os.totalmem() / 1024 ** 3).toFixed(2),
  sourceCommit: spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim(),
  sourceHasUncommittedChanges: Boolean(spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).stdout.trim()),
  buildId: readFileSync(path.join(root, ".next/BUILD_ID"), "utf8").trim(),
  thinkMs: 200, stages, completedStages: [],
  limitations: "Single local machine runs client and server. HTTP requests only: no JavaScript execution, rendering, offline gameplay or human think-time model. 60-second stages include 10-second ramp-up. One run per level; results do not establish production capacity. Current working-tree source was built, not necessarily committed HEAD.",
};
writeFileSync(path.join(outputDirectory, "run.json"), JSON.stringify(metadata, null, 2));

try {
  await command(toolchain.java, ["-version"], { log: path.join(outputDirectory, "java-version.txt"), quiet: true });
  for (const stage of stages) {
    if (interrupted) throw new Error("Load test interrupted.");
    const stageDirectory = path.join(outputDirectory, stage.name);
    mkdirSync(stageDirectory);
    const databasePath = path.join(temporaryDirectory, `${stage.name}.db`);
    writeFileSync(databasePath, "");
    const env = { ...process.env, DATABASE_URL: `file:${databasePath.replaceAll("\\", "/")}`, NODE_ENV: "production" };
    await command(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env, log: path.join(stageDirectory, "migrations.log"), quiet: true });
    await command(process.execPath, ["--experimental-strip-types", "prisma/seed.ts"], { env, log: path.join(stageDirectory, "seed.log"), quiet: true });
    const serverLog = createWriteStream(path.join(stageDirectory, "server.log"));
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
      cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    });
    server.stdout.pipe(serverLog, { end: false });
    server.stderr.pipe(serverLog, { end: false });
    server.on("error", (error) => serverLog.write(String(error)));
    try {
      await waitForHealth();
      for (const route of ["/wordle", "/word-search", "/api/dictionary", "/api/dashboard"]) {
        const response = await fetch(`${baseURL}${route}`, { signal: AbortSignal.timeout(15000) });
        await response.arrayBuffer();
        if (!response.ok) throw new Error(`Warm-up failed for ${route}: ${response.status}`);
      }
      console.log(`\nStage ${stage.name}: ${stage.users} concurrent users, ${stage.durationSeconds}s maximum, ramp ${stage.rampSeconds}s`);
      await command(toolchain.java, [
        "-Xms128m", "-Xmx512m", "-Djava.awt.headless=true", "-jar", toolchain.jmeterJar,
        "-n", "-t", path.join(root, "tests/load/phoneme-builder.jmx"),
        "-l", path.join(stageDirectory, "results.jtl"), "-j", path.join(stageDirectory, "jmeter.log"),
        "-e", "-o", path.join(stageDirectory, "report"),
        `-Jhost=127.0.0.1`, `-Jport=${port}`, `-Jusers=${stage.users}`, `-JdurationSeconds=${stage.durationSeconds}`,
        `-JrampSeconds=${stage.rampSeconds}`, `-Jloops=${stage.loops}`, "-JthinkMs=200",
        "-Jsummariser.interval=15", "-Jsample_variables=activityType",
        "-Jjmeter.save.saveservice.output_format=csv", "-Jjmeter.save.saveservice.assertion_results_failure_message=true",
        "-Jjmeter.reportgenerator.overall_granularity=1000",
      ], { log: path.join(stageDirectory, "console.log"), timeoutMs: (stage.durationSeconds + 120) * 1000 });
      const health = await fetch(`${baseURL}/health`, { signal: AbortSignal.timeout(15000) });
      const metrics = await fetch(`${baseURL}/api/dashboard`, { signal: AbortSignal.timeout(15000) });
      writeFileSync(path.join(stageDirectory, "after.json"), JSON.stringify({ healthStatus: health.status, health: await health.json(), dashboardStatus: metrics.status, dashboard: await metrics.json() }, null, 2));
      metadata.completedStages.push(stage.name);
      writeFileSync(path.join(outputDirectory, "run.json"), JSON.stringify(metadata, null, 2));
      const summary = summariseLoadRun(outputDirectory);
      const current = summary.stages.find((item) => item.name === stage.name);
      if (stage.name === "smoke" && (current.errors > 0 || current.samples !== 14)) throw new Error("Smoke test failed. Fix the workflow before running load stages.");
      if (!health.ok || !metrics.ok) throw new Error("Server did not recover after this stage; stopping further load.");
    } finally {
      stop(server);
      await new Promise((resolve) => server.exitCode !== null ? resolve() : server.once("close", resolve));
      serverLog.end();
      server = undefined;
    }
  }
  metadata.finishedAt = new Date().toISOString();
} catch (error) {
  metadata.failure = String(error);
  process.exitCode = 1;
  console.error(error);
} finally {
  stop(activeCommand);
  stop(server);
  writeFileSync(path.join(outputDirectory, "run.json"), JSON.stringify(metadata, null, 2));
  summariseLoadRun(outputDirectory);
  // Only remove the unique temporary directory this runner created, never project data.
  const resolved = path.resolve(temporaryDirectory);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("phoneme-jmeter-")) throw new Error("Unexpected temporary database path; refusing cleanup.");
  rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  console.log(`\nLoad-test evidence: ${outputDirectory}`);
}
