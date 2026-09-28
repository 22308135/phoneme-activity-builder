# Assessment 3 notes — Phoneme Play Builder

**Louis Callander · Student ID 22308135**  
**Assessment:** Data-driven application and reporting · **Weight:** 25%  
**Due:** 11:59 pm, Sunday 4 October 2026, according to the supplied brief. Check Moodle for any updates.  
**Last consolidated:** 17 September 2026  
**Repository:** https://github.com/22308135/phoneme-activity-builder

These are preparation and recording notes, not an additional written report. The brief requires a **3–8 minute verbal video walkthrough**, a working source-code ZIP and the GitHub link. Use this file as the main Assessment 3 checklist; detailed reports and original test evidence are linked below.

## 1. Current position

**28 September merge verification:** reconciled the two dashboard branches, retaining anonymous page timing and accessible resource summaries alongside date-filtered generation history, failure details and empty-list warnings. The later database migration now renames the original outcome column and adds visits, rather than creating the generation table twice. Migration tests verify that existing event snapshots survive. The merged version passed the production build, lint, all 29 unit/integration tests and 19 browser tests (one intentional duplicate API skip) using Edge on desktop and emulated mobile. Local browser evidence: `artifacts/playwright/2026-09-28T01-51-16-643Z`. Lighthouse reruns scored 100 on all 16 tested combinations of four pages, two viewport sizes and two themes, with no failed automated accessibility audits. Local Lighthouse evidence: `artifacts/lighthouse/2026-09-28T01-52-57-204Z-merge-check`. The September 17 archives below remain historical evidence; their counts describe those earlier runs.

The dashboard, database-backed monitoring, validation indicators, Playwright workflows, JMeter load tests and Lighthouse accessibility work are implemented and evidenced. The final browser suite passed **17 tests**, with **one intentionally skipped duplicate API test**, and no failures or flaky results. All **29 unit/integration tests**, lint and the production build passed.

Still to complete:

- [ ] Review and push the merged Assessment 3 changes to GitHub. The 28 September verification is included in the local merge resolution; the older archived reports identify their earlier source versions.
- [ ] Rehearse and record the 3–8 minute video, including face, voice and student ID.
- [ ] Build and inspect an Assessment 3 source ZIP, excluding dependencies, secrets and local databases.
- [ ] Complete the university's AI acknowledgement form accurately.
- [ ] Confirm the Moodle/Turnitin submission arrangement and check the required similarity score.
- [ ] Upload the ZIP, repository link, video and required supporting items before the deadline; verify that they open correctly.

No additional dashboard features are necessary for the current demonstration plan. Present the measured limitations honestly rather than claiming every requirement guarantees a particular mark. The supplied brief says the detailed rubric was still being finalised.

## 2. Requirements and where to demonstrate them

| Requirement | Implemented evidence / demonstration |
| --- | --- |
| Continue the Next.js Wordle/Word Search project | Existing React/Next.js application, API and database; initial Next.js commit `56a414a`. The brief specifically requires the project to originate from `npx create-next-app .`. |
| Data-driven dashboard and reporting views | Home → **View dashboard**; resource totals, generation outcomes, usage, difficulty breakdown and recent activities. |
| Simulated input records and database persistence | Seeded example activities plus teacher-entered dictionary words and saved configurations. Reopen a saved activity to show stored phonemes, hints and settings. |
| Operational monitoring | `/health`, health indicator, manual refresh and automatic dashboard refresh every 30 seconds. |
| Stored usage statistics | `GenerationEvent` and `PageVisit` database records; dashboard aggregates these alongside the saved library. |
| Alerts and unusual states | Word Search selection/word-length warnings and disabled generation; API validation; dashboard empty, unavailable and stale-data states. |
| Playwright builder use case | Teacher dictionary entry → create/read activity → edit → delete, on desktop and emulated mobile. |
| Playwright generated-output use case | Generate/save/download both games, open the actual files offline, complete and reset them. |
| JMeter staged loads | 1, 10, 25, 50 and 100 concurrent simulated users; reports show successes, errors, latency and recovery. |
| Lighthouse evaluation and improvements | Before/after reports for four pages, two viewport sizes and both themes; contrast and semantic fixes. |
| Video evidence | Working app, data flow, dashboard, warnings, monitoring, all three testing tools, GitHub homepage and commits; still to record. |
| Technical submission | Source ZIP and repository link; still to package the Assessment 3 version. |
| References and AI acknowledgement | 15 industry sources reproduced at the end; university acknowledgement form still to complete. |

## 3. Explain how the application works

**Data flow:** Teacher input → React builder → Next.js API validation with Zod → Prisma → SQLite → saved activity/library/dashboard → server-generated standalone HTML → learner opens the downloaded game.

The application uses Next.js 16, React 19, TypeScript, Prisma 6, SQLite and Zod. Modular components share navigation, preferences, dictionary inputs and generation logic.

### Stored data

- `Activity`: title, Wordle/Word Search type, difficulty, hints, grid size and timestamps.
- `Word`: written word, ordered phonemes, hint, position and Wordle target flag, linked to an activity.
- `DictionaryWord`: teacher-added or customised dictionary entries, combined with 26 curated entries in the interface.
- `GenerationEvent`: activity type when known, success/failure and timestamp. These records survive activity deletion.
- `PageVisit`: anonymous visit ID, builder type, cumulative visible time and timestamp. These records also survive activity deletion.

Phonemes are stored as ordered JSON arrays. For example, **chip → `["tʃ", "ɪ", "p"]`**, preserving a multi-character phoneme as one sound.

The seed creates a Foundation phoneme Wordle and a Mixed phoneme Word Search when the activity table is empty. These are simulated teaching records. Historical usage is not invented: visit and generation records are produced when the app is used. Automated tests use separate temporary databases and do not populate the normal dashboard with their load-test traffic.

Saving stores the settings and words. Generating an HTML download saves a named activity first, then retrieves it by ID for server-side generation. The resulting game is self-contained and works offline. Offline gameplay does not send student results or usage back to the dashboard.

### Dashboard figures: use these definitions in the video

| Indicator | What it actually means |
| --- | --- |
| Wordle / Word Search activities | Current saved activities of each type. Deleting an activity reduces the total. These are **not lifetime creation counters**. |
| Words in activities | Stored word entries across saved lists, including repeated words. |
| Dictionary words | Unique curated/custom dictionary words, with matching custom entries overriding curated entries. |
| Successful generations | Download requests for which the server prepared an HTML output; not confirmed file openings or completed games. |
| Failed generations | Errors returned by the HTML download endpoints, when the metric can be recorded. Form validation warnings are not counted as failed generations. |
| Average time on page | Reported visible time divided by recorded builder visits, including ongoing visits. |
| Most-used activity type | Builder type with the most recorded page visits; ties and no-data states are shown explicitly. |
| Health | Whether the server can query the database at the time of the check. `/health` returns 200 when healthy and 503 on failure. |
| Recent activities / difficulty breakdown | Reporting views of current saved configurations. |

Builder time updates every 15 seconds, on visibility changes and when leaving the page. Hidden-tab time is excluded. Repeated or out-of-order updates do not inflate visits or move recorded duration backwards. Timing remains approximate if a browser closes before reporting its last update.

Dashboard metrics and health are fetched independently. If a refresh fails, previous figures remain visible with a stale-data warning. A failed metric write is logged without blocking an otherwise valid download, so application counters can under-report during an outage. This limitation appeared in the JMeter evidence.

### Simple warning demonstration

For a predictable visible warning, use Word Search: choose a larger grid, select more than ten words, then reduce the grid to 7 × 7. Show the instruction to deselect excess words and the disabled generate button. Restore a valid selection before continuing.

This demonstrates validation; do not describe it as a server-side failed generation. Do not deliberately break the normal database to demonstrate an outage. Database failure behaviour and generation outcomes also have automated test coverage.

## 4. Playwright results

**Final run:** 17 September 2026 · **17 passed, 1 skipped, 0 failed, 0 flaky** · 31.9 seconds.

- Teacher creates a custom word and activity, reads it in the library, edits its title and deletes it.
- Both game types are generated, saved and downloaded, then played to completion and reset with the browser offline.
- Home-to-dashboard navigation, healthy status, updated counts and generation history after deletion/reload are checked.
- Grid/word validation, theme/layout cookies and serious/critical axe checks across eight pages are included.
- The skipped case is a duplicate mobile API check; that check passed in the desktop project.

Environment: Playwright 1.62.1, Chrome 153.0.8010.47, Node 24.15.0; desktop 1280 × 720 and emulated Pixel 7 412 × 839. Mobile emulation is not a physical-device test. The production test server used a fresh migrated/seeded SQLite database on port 3100.

The first expanded run exposed an ambiguous dashboard **test selector** matching both health and loading statuses. Scoping the selector fixed the test; no application change was needed. The full suite then passed.

Open the final report from the project folder:

```powershell
npx playwright show-report "artifacts/playwright/2026-09-17T03-47-16-352Z/report"
```

For the video, show the result summary and one teacher trace plus one learner trace. You do not need to replay every test.

**Portable evidence:** [Playwright archive](evidence/playwright-2026-09-17.zip). Extract it and run `npx playwright show-report "PATH-TO-EXTRACTED-FOLDER/report"`. Includes the HTML report, traces, generated games, JSON outcomes, run metadata and server log. [Detailed notes](PLAYWRIGHT_RESULTS.md).

## 5. JMeter results and interpretation

Measured on 17 September 2026. Each simulated user alternated activity types and requested the builder and dictionary, created an activity, checked stored phonemes, generated HTML, deleted its activity and read dashboard metrics.

| Concurrent users | Requests | Failed | Error rate | Mean response | p95 response | Requests/second |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 259 | 0 | 0% | 17.77 ms | 36 ms | 4.43 |
| 10 | 2,508 | 0 | 0% | 14.59 ms | 34 ms | 42.85 |
| 25 | 5,970 | 0 | 0% | 25.24 ms | 76 ms | 102.09 |
| 50 | 1,136 | 184 | 16.20% | 2,510.61 ms | 11,609 ms | 16.55 |
| 100 | 1,043 | 354 | 33.94% | 5,792.99 ms | 15,012 ms | 14.26 |

**Method:** One run per level, 60-second scheduled stages including a 10-second ramp-up, 200 ms pause before each request and a 15-second response timeout. Outstanding requests extended the heavier stages. p95 describes individual HTTP requests, including failures: approximately 95% completed or failed within that time.

JMeter and the production application shared a Windows 11 laptop: Intel Core Ultra 5 125H, 18 logical processors and 15.47 GiB RAM. JMeter 5.6.3, Temurin Java 17.0.20.1, Node 24.15.0, Next.js 16.3.2 and Prisma 6.12.0 were used. Each stage had a fresh temporary SQLite database.

**What to say:** Up to 25 concurrent simulated users, this run recorded no errors and p95 below 100 ms. At 50 and 100 users, throughput fell, latency rose and database operations timed out. Server logs contain Prisma `P1008` and `P2028` errors, consistent with database contention or transaction/pool pressure. The exact bottleneck was not isolated. Health and dashboard endpoints returned 200 after every stage without restarting that stage's server.

**Important limits:**

- Results depend on the machine, database, application configuration and workload. They do not establish a universal 25-user limit.
- The brief permits equivalent staged levels. We tested 1–100, **not 1,000 or 10,000** users.
- Dashboard reads occurred in every simulated loop, much more frequently than a teacher's normal 30-second dashboard refresh.
- JMeter checks HTTP traffic and HTML responses; it does not play the browser game. Playwright covers that workflow.
- At 50 users, JMeter received 112 successful generated outputs but the dashboard recorded 104; metric writes failed. At 100 users, JMeter received 48 while the server recorded 51, because server work can finish after a client timeout. A zero dashboard failure count is not proof of zero client failures.
- No performance fix was applied between these stages. Profiling and a targeted change followed by the same load test would be future work.

**Portable evidence:** [JMeter archive](evidence/jmeter-2026-09-17.zip). Extract it, open the `2026-09-17T03-07-51-121Z` folder, then open `users-25/report/index.html` and `users-100/report/index.html`, retaining neighbouring assets. Includes raw samples, logs, summaries, environment information and the test plan. [Detailed notes](LOAD_TEST_RESULTS.md).

## 6. Lighthouse accessibility results

Four pages were audited at desktop 1280 × 900 and mobile 390 × 844 in light and dark themes: **16 before audits and 16 after audits**. Scores were the same at both viewport sizes.

| Page | Before light | Before dark | After light | After dark |
| --- | ---: | ---: | ---: | ---: |
| Home | 100 | 95 | 100 | 100 |
| Dashboard | 96 | 92 | 100 | 100 |
| Wordle | 100 | 96 | 100 | 100 |
| Word Search | 100 | 96 | 100 | 100 |

Changes made after reviewing the findings:

1. **Dark-mode contrast:** white labels on pale green buttons/logo and dark status text on dark panels were difficult to distinguish. Adjusted foreground colours, including focused/hovered phoneme controls.
2. **Dashboard semantics:** replaced invalid explanatory paragraphs inside definition-list metric groups with proper `<dt>` labels and `<dd>` descriptions.
3. **Logo accessible name:** removed an overriding `aria-label` so the link's visible brand text supplies its accessible name. This was an unscored warning, demonstrating why individual findings matter alongside the score.

The final 16 audits scored **100/100 with no failed automated accessibility audits**. Lighthouse 13.4.1 used snapshot mode after the content loaded, with an isolated production server/database. These were accessibility audits, not performance tests. They cover the tested page states and do not certify WCAG compliance or replace manual keyboard/screen-reader testing.

**Portable evidence:** [Lighthouse archive](evidence/lighthouse-2026-09-17.zip). Extract it and compare `dashboard-desktop-dark.html` in the before and after folders. [Detailed notes](ACCESSIBILITY_RESULTS.md).

## 7. Video plan — aim for about seven minutes

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:25 | Face, student ID and Home | Name, student number, project purpose and Assessment 3 focus. |
| 0:25–1:35 | Builder, saved library, one downloaded game | Teacher inputs, ordered phonemes, saved settings, reopening/editing and generated output. Explain React → API/Zod → Prisma/SQLite → HTML. |
| 1:35–2:50 | Dashboard, `/health`, validation warning | Saved totals, visits/time, success/failure counters, recent records and health. Explain current totals versus historical events. Show a warning and restore valid settings. |
| 2:50–3:35 | Playwright report and traces | 17 passes, one duplicate API skip; teacher CRUD and offline learner workflows. |
| 3:35–4:45 | JMeter 25-user and 100-user reports | Staged method, error rates, p95, machine dependence, database timeouts, recovery and counter limitations. |
| 4:45–5:45 | Lighthouse before/after dashboard reports | Contrast, definition-list semantics and accessible-name improvements; scores and automated-test limits. |
| 5:45–6:30 | GitHub homepage and commits | Repository structure and real incremental commits, including the latest Assessment 3 work once pushed. |
| 6:30–7:00 | Dashboard / closing view | Summarise stored data, monitoring and verified workflows; identify high-load performance as a remaining limitation. |

### Short speaking prompts

**Opening:** “I'm Louis Callander, student number 22308135. Phoneme Play Builder lets teachers create and save phoneme-based Wordle and Word Search activities. For Assessment 3, I added database-backed reporting and operational monitoring, then evaluated the workflows, load behaviour and accessibility.”

**Dashboard:** “These totals come from saved records. Downloads produce generation events, while builder visits report visible time. Resource totals fall when I delete an activity, but generation and visit history remain. Successful generation means the server prepared the HTML, not that a student completed the game.”

**Testing:** “Playwright verifies the teacher CRUD workflow and the learner opening and completing the downloaded games offline. JMeter measures HTTP behaviour at staged concurrent loads. Lighthouse checks accessibility of the loaded pages and guided the colour and markup changes.”

**Closing:** “The tested workflows pass, and the dashboard makes application state visible. The load test also exposed database timeouts under heavier traffic. Further work would profile that bottleneck and repeat the same workload after a targeted improvement.”

Use these as prompts in your own words. Include face, voice and student ID as required, and keep the final recording within 3–8 minutes.

### Before recording

- [ ] Open the working app, dashboard, `/health`, Playwright report, selected JMeter reports, Lighthouse comparison and GitHub in advance.
- [ ] Have a clearly named demo activity ready; show actual stored records and interactions rather than inventing values.
- [ ] Visit both builders and generate an output so real usage figures are available. Allow tracking to report or navigate away, then refresh the dashboard.
- [ ] Practise the Word Search selection warning and restore a valid configuration afterwards.
- [ ] Check microphone, face camera, readable screen zoom, student ID visibility and recording duration.
- [ ] Show the real final commits on GitHub after committing/pushing; do not describe uncommitted changes as published history.
- [ ] View the finished recording and check audio, legibility and that every required item is present.

## 8. Commands and evidence locations

Run these commands from the project folder. For a fresh checkout, follow the [README setup instructions](../README.md); keep `.env` local. Existing installations need the new migration before using the dashboard:

```powershell
npm run db:generate
npm run db:deploy
npm run dev
```

Use the URL printed by Next.js; it may select another port if 3000 is occupied. For a production demonstration, use `npm run build` followed by `npm run start` instead of the development server.

To reproduce checks when needed:

```powershell
npm run lint
npm run test
npm run test:browser
powershell -NoProfile -File scripts/setup-jmeter.ps1
npm run test:load
npm run test:lighthouse -- --label=check
```

The browser, load and Lighthouse scripts build the app themselves and use isolated test databases. Run them one at a time; their dedicated server ports are 3100, 3200 and 3300 respectively. Browser testing requires installed Chrome by default. Lighthouse requires Chrome/Chromium; setup details are in the README. The archived evidence is already available, so a recording does not require rerunning the entire load test live.

| Evidence | Portable file to retain |
| --- | --- |
| Playwright report, traces and generated games | `docs/evidence/playwright-2026-09-17.zip` |
| JMeter reports, raw samples, plan and logs | `docs/evidence/jmeter-2026-09-17.zip` |
| Lighthouse before/after HTML and JSON reports | `docs/evidence/lighthouse-2026-09-17.zip` |
| Architecture and data flow | `docs/ARCHITECTURE.md` |
| Development history background | `docs/GIT_HISTORY.md` plus actual GitHub commits |
| Setup and reproduction | `README.md`, `package.json`, `scripts/`, `tests/` |

Local raw results under `artifacts/` are intentionally excluded from Git. Keep the selected portable archives inside `docs/evidence/` in the source submission. Results describe the versions and working tree recorded when each test ran; future functional changes may require fresh evidence.

## 9. Final submission checklist

- [ ] **Code ZIP:** name it clearly, for example `phoneme-activity-builder-assessment3.zip`.
- [ ] Include source, `public/`, Prisma schema/migrations/seed, tests, scripts, package manifests/lockfile, configuration, Docker files, `.env.example`, README, these notes, references and selected evidence archives.
- [ ] Exclude `node_modules`, `.next`, `.git`, actual `.env` files/secrets, local `.db` files, transient `artifacts/`, loose `test-results`/`playwright-report` output, editor metadata and old submission ZIPs. Keep `.env.example`.
- [ ] Extract the final ZIP into a separate folder and verify the documented install/database/start steps work. Check upload size limits in Moodle, including any existing walkthrough video in `public/`.
- [ ] **GitHub:** include the repository link in the submission; ensure the latest assessed source is committed, pushed and accessible to the marker.
- [ ] **Video:** 3–8 minutes; face, voice and student ID; all items in the timeline shown clearly.
- [ ] **AI acknowledgement:** use the form on the Assessments page. Describe AI assistance accurately, including coding, testing, analysis and drafting where applicable; review the work and do not claim all code was independently written.
- [ ] **References:** retain at least five academic or industry sources in APA 7 style; the reference list below contains 15 industry sources.
- [ ] **Moodle/Turnitin:** the brief says video only/no written report, but also requires a similarity score and suggests Word/PDF. Confirm the correct submission slot/supporting-document arrangement through the current Moodle instructions or teaching staff. Do not assume a ZIP or video generates a similarity score, or invent a compulsory written report.
- [ ] Check uploaded files, repository access, video playback, required similarity result and final submission receipt.

## 10. References (APA 7)

The following list consolidates the project's existing reference notes. These industry sources informed implementation, persistence, accessibility and testing. Refer to the university's guidance for any submission-specific formatting requirements.

Apache Software Foundation. (n.d.-a). *Apache JMeter*. Retrieved September 17, 2026, from https://jmeter.apache.org/

Apache Software Foundation. (n.d.-b). *Generating dashboard report*. Apache JMeter User's Manual. Retrieved September 17, 2026, from https://jmeter.apache.org/usermanual/generating-dashboard.html

Apache Software Foundation. (n.d.-c). *Getting started*. Apache JMeter User's Manual. Retrieved September 17, 2026, from https://jmeter.apache.org/usermanual/get-started.html

Docker, Inc. (n.d.-a). *Persisting container data*. Docker Documentation. Retrieved August 25, 2026, from https://docs.docker.com/get-started/docker-concepts/running-containers/persisting-container-data/

Docker, Inc. (n.d.-b). *What is a container?* Docker Documentation. Retrieved August 25, 2026, from https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Google. (n.d.-a). *Lighthouse accessibility score*. Chrome for Developers. Retrieved September 17, 2026, from https://developer.chrome.com/docs/lighthouse/accessibility/scoring

Google. (n.d.-b). *User flows in Lighthouse*. GitHub. Retrieved September 17, 2026, from https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md

Meta Platforms, Inc. (n.d.). *Quick start*. React. Retrieved August 25, 2026, from https://react.dev/learn

Microsoft. (n.d.). *Writing tests*. Playwright. Retrieved August 25, 2026, from https://playwright.dev/docs/writing-tests

Prisma Data, Inc. (n.d.-a). *Errors (Prisma ORM v6)*. Prisma Documentation. Retrieved September 17, 2026, from https://www.prisma.io/docs/orm/v6/reference/error-reference

Prisma Data, Inc. (n.d.-b). *Prisma Migrate*. Prisma Documentation. Retrieved August 25, 2026, from https://docs.prisma.io/docs/orm/prisma-migrate

Prisma Data, Inc. (n.d.-c). *SQLite*. Prisma Documentation. Retrieved August 25, 2026, from https://www.prisma.io/docs/orm/v6/overview/databases/sqlite

Vercel. (2026, February 27). *Route Handlers*. Next.js Documentation. https://nextjs.org/docs/app/getting-started/route-handlers

World Wide Web Consortium. (n.d.). *How to meet WCAG (quick reference)*. Web Accessibility Initiative. Retrieved August 25, 2026, from https://www.w3.org/WAI/WCAG22/quickref/

Zod. (n.d.). *Basic usage*. Retrieved August 25, 2026, from https://zod.dev/basics
