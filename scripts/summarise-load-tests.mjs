import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index++; }
      else quoted = !quoted;
    } else if (!quoted && character === ",") { row.push(field); field = ""; }
    else if (!quoted && character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (row.length || field) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift();
  return rows.filter((values) => values.length === headers.length).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

function statistics(rows) {
  if (!rows.length) return { samples: 0, errors: 0, errorPercent: 0, meanMs: 0, medianMs: 0, p95Ms: 0, maxMs: 0, requestsPerSecond: 0 };
  const times = rows.map((row) => +row.elapsed).sort((a, b) => a - b);
  const start = Math.min(...rows.map((row) => +row.timeStamp));
  const finish = Math.max(...rows.map((row) => +row.timeStamp + +row.elapsed));
  const errors = rows.filter((row) => row.success !== "true").length;
  const round = (value) => +value.toFixed(2);
  return {
    samples: rows.length, errors, errorPercent: round(errors / rows.length * 100),
    meanMs: round(times.reduce((sum, value) => sum + value, 0) / times.length),
    medianMs: times[Math.ceil(times.length * 0.5) - 1], p95Ms: times[Math.ceil(times.length * 0.95) - 1],
    maxMs: times.at(-1), requestsPerSecond: round(rows.length / Math.max((finish - start) / 1000, 0.001)),
    observedSeconds: round((finish - start) / 1000), maxActiveThreads: Math.max(...rows.map((row) => +row.allThreads)),
  };
}

export function summariseLoadRun(directory) {
  const metadata = JSON.parse(readFileSync(path.join(directory, "run.json"), "utf8"));
  const stages = metadata.completedStages.map((name) => {
    const rows = parseCsv(readFileSync(path.join(directory, name, "results.jtl"), "utf8"));
    const config = metadata.stages.find((stage) => stage.name === name);
    const labels = [...new Set(rows.map((row) => row.label))];
    const generated = rows.filter((row) => row.label === "05 Generate activity HTML" && row.success === "true");
    const failures = {};
    for (const row of rows.filter((row) => row.success !== "true")) {
      const reason = `${row.label}: ${row.responseCode} ${row.failureMessage || row.responseMessage}`;
      failures[reason] = (failures[reason] ?? 0) + 1;
    }
    return { name, users: config.users, ...statistics(rows),
      generatedWordle: generated.filter((row) => row.activityType === "WORDLE").length,
      generatedWordSearch: generated.filter((row) => row.activityType === "WORD_SEARCH").length,
      endpoints: labels.map((label) => ({ label, ...statistics(rows.filter((row) => row.label === label)) })), failures,
    };
  });
  const summary = { metadata, stages };
  writeFileSync(path.join(directory, "summary.json"), JSON.stringify(summary, null, 2));
  const table = ["Stage,Users,Requests,Errors,Error percent,Mean ms,Median ms,P95 ms,Max ms,Requests per second,Wordle outputs,Word Search outputs",
    ...stages.map((stage) => [stage.name, stage.users, stage.samples, stage.errors, stage.errorPercent, stage.meanMs, stage.medianMs, stage.p95Ms, stage.maxMs, stage.requestsPerSecond, stage.generatedWordle, stage.generatedWordSearch].join(","))];
  writeFileSync(path.join(directory, "summary.csv"), table.join("\n") + "\n");
  const md = ["# JMeter load-test results", "", `Run started: ${metadata.startedAt}`, "", `Environment: ${metadata.os}; ${metadata.cpu}; ${metadata.logicalCpus} logical processors; ${metadata.totalMemoryGiB} GiB RAM. Node ${metadata.node}, Next.js ${metadata.next}, JMeter ${metadata.jmeter}.`, "",
    "The production app and JMeter ran on the same machine against a fresh, seeded SQLite database for every stage. Smoke testing is separate from the measured load stages. Each measured stage is 60 seconds including a 10-second ramp-up, with a 200 ms pause before each HTTP request. Users alternate Wordle and Word Search workflows. There is one run at each load level.", "",
    "| Concurrent users | Requests | Errors | Error % | Mean (ms) | p95 (ms) | Requests/s | Wordle / Search outputs |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...stages.filter((stage) => stage.name !== "smoke").map((stage) => `| ${stage.users} | ${stage.samples} | ${stage.errors} | ${stage.errorPercent} | ${stage.meanMs} | ${stage.p95Ms} | ${stage.requestsPerSecond} | ${stage.generatedWordle} / ${stage.generatedWordSearch} |`), "",
    "Mean and p95 cover individual HTTP samples, including failed samples, not a complete user journey. p95 uses the nearest-rank method. Throughput divides sample count by the measured interval from the earliest sample start to the latest sample end. Native JMeter reports may use slightly different percentile interpolation. Requests still in flight at the schedule boundary can make the observed interval slightly longer than 60 seconds; a final user journey may be incomplete.", "",
    "## Evidence", "", ...stages.map((stage) => `- [${stage.name}: native JMeter report](${stage.name}/report/index.html) · [raw samples](${stage.name}/results.jtl) · [server health and dashboard after load](${stage.name}/after.json)`), "",
    "## Limits", "", metadata.limitations,
    "These staged levels are an equivalent local load progression, not evidence of 1,000 or 10,000 concurrent users. JMeter does not execute the page-time tracker or play downloaded games. HTML responses and stored IPA data are asserted; browser behaviour remains a Playwright responsibility.", "",
    metadata.failure ? `Run stopped: ${metadata.failure}` : "", ""];
  writeFileSync(path.join(directory, "SUMMARY.md"), md.join("\n"));
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2] || !existsSync(path.join(process.argv[2], "run.json"))) throw new Error("Usage: node scripts/summarise-load-tests.mjs <run-directory>");
  summariseLoadRun(path.resolve(process.argv[2]));
}
