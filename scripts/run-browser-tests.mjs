import { spawn, spawnSync } from "node:child_process";

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3100"], {
  stdio: "inherit",
  detached: process.platform !== "win32",
});

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:3100/health");
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("The browser-test server did not become ready");
}

function stopServer() {
  if (!server.pid) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
  else {
    try { process.kill(-server.pid, "SIGTERM"); } catch {}
  }
}

let exitCode = 1;
try {
  await waitForServer();
  exitCode = await new Promise((resolve) => {
    const tests = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], { stdio: "inherit" });
    tests.on("exit", (code) => resolve(code ?? 1));
  });
} finally {
  stopServer();
}

process.exit(exitCode);
