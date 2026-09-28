# JMeter load testing

`phoneme-builder.jmx` is an Apache JMeter 5.6.3 test plan for Assessment 3. It uses only standard JMeter components and Groovy; no extra plugins are needed. The runner uses a production Next.js build, never a development server.

## Run on Windows

From the project root:

```powershell
powershell -NoProfile -File scripts/setup-jmeter.ps1
npm run test:load
```

Setup downloads portable JMeter and Eclipse Temurin Java 17 into `%LOCALAPPDATA%\PhonemeBuilderTools`. It verifies the Apache SHA-512 and Adoptium SHA-256 archive checksums. No administrator privileges, registry changes or system PATH updates are required. Java is deliberately outside the submission folder.

`npm run test:load:smoke` runs just two single-user iterations, one for each activity type. The full test always starts with this smoke check and stops if it fails.

The runner needs port **3200** to be free. It refuses to use an already-running server. For every stage it creates a fresh temporary SQLite database, applies the project's migrations, adds the same two seeded activities, and starts its own server bound to `127.0.0.1`. Only this server receives load. It stops its own processes and removes only its temporary databases when finished; your `.env` and `prisma/dev.db` are unchanged.

## Workload

Each virtual user repeatedly alternates between Wordle and Word Search:

1. Load the builder page and assert the preview markup is present.
2. Retrieve the dictionary and check that it contains entries.
3. Save a uniquely named activity and extract its returned ID.
4. Read that activity and check its ID and ordered IPA phonemes.
5. Download its generated HTML, checking the doctype, game script and attachment header.
6. Delete only that user's test activity.
7. Read the dashboard's database-backed summaries.

Wordle uses one target word; Word Search uses five words in a 7 × 7 grid. Users pause 200 ms before each request. A failed create skips the ID-dependent steps, preventing requests against another user's activity. Failures are counted even if later requests succeed. At a stage's duration boundary a user may stop partway through the workflow, leaving a record only in the disposable test database.

The five measured stages have **1, 10, 25, 50 and 100 concurrent threads**, each scheduled for 60 seconds including a 10-second ramp-up. These are equivalent staged local loads allowed by the brief; they do not represent 1,000 or 10,000 concurrent users. A JMeter thread issues one request at a time, so concurrency includes users pausing between requests, not just in-flight HTTP requests.

JMeter's [CLI mode](https://jmeter.apache.org/usermanual/get-started.html) is used for the measured runs. This is an HTTP-level test: JMeter [does not execute JavaScript or render pages](https://jmeter.apache.org/), so the plan explicitly issues the underlying API requests. It does not simulate clicking phoneme tiles, asset rendering, the browser usage tracker or offline gameplay. Those behaviours belong in Playwright tests.

## Evidence

Each run creates `artifacts/jmeter/<timestamp>/` containing:

- `SUMMARY.md`, `summary.csv`, `summary.json`: overall and per-endpoint comparisons.
- `run.json` and `java-version.txt`: environment, exact stages, build ID, source commit and uncommitted-source indicator.
- Per-stage `results.jtl`: raw CSV samples, assertions, response codes and activity type.
- Per-stage `report/index.html`: native [JMeter HTML report](https://jmeter.apache.org/usermanual/generating-dashboard.html).
- Per-stage `after.json`: health status and database metrics after load.
- Server, JMeter, console and migration logs.

Open `report/index.html` in a browser for response-time and throughput charts. Keep its neighbouring report files together. `docs/LOAD_TEST_RESULTS.md` records the assessed run and interpretation; the selected evidence archive is stored with it. Other generated runs are ignored by Git to avoid committing repetitive report assets.

To regenerate the summary from retained raw results:

```powershell
node scripts/summarise-load-tests.mjs artifacts/jmeter/<timestamp>
```

## Interpreting results

Compare mean and p95 response time, requests per second, error percentage and generated output counts. A low mean can conceal slow requests, so also show p95 and endpoint results. Failed responses are included in timing calculations. The native JMeter report may use different percentile interpolation from the summary's nearest-rank calculation.

This is a short, single-run comparison on one laptop, with the load generator and app sharing CPU, memory and disk. It does not establish a production capacity, service-level guarantee or performance at 10,000 users. The SQLite database and the workload mix are part of the tested configuration. Repeating runs or using a separate load generator would be needed for stronger capacity claims.

For the video, show the JMX plan, the staged comparison, one native report, and explain the observed trend and these limits. Keep unexpected failures visible and use the logs to explain them.
