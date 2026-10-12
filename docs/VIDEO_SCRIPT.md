# Assessment 3 video script

Target: about 7 minutes, including clicks and pauses. Maximum: 8 minutes. Rehearse once with a timer; the times below are targets, not automatic timings. Read the spoken sections in your own words and only make claims you can explain and demonstrate.

Prepared against the merged app and evidence checked on 28 September 2026. Playwright: 19 passed, one intentional skip. Unit/integration tests: 29 passed. Latest Lighthouse: 100 across 16 tested page/theme/viewport combinations. JMeter figures below are from 17 September, before the merge; retain that distinction unless you rerun the tests.

## Before pressing Record

- Have your face camera, microphone and student ID ready. Keep your face visible in a small overlay without covering app controls or report results.
- Open the running app, Dashboard, Activities, Wordle and Word Search. Use the app URL printed by the server.
- Visit both builders beforehand so the dashboard has real visits. Do not invent historical usage figures.
- Prepare a Wordle using the dictionary word `chip` and name the saved activity `Assessment 3 demo`. Rehearse the save/download controls so you can perform the workflow confidently during recording.
- Open the latest Playwright report, selected JMeter reports, a Lighthouse before report and the latest after report, and the GitHub homepage and commits. Do not run the full test suites during recording.
- Check GitHub contains the merged source. The local merge commit is `a0bb768`; show the actual current history rather than narrating an assumed push status.
- Keep browser zoom readable. Close unrelated tabs and avoid displaying your `.env` file.
- Have [VIDEO_UNDERSTANDING.md](VIDEO_UNDERSTANDING.md) beside you for rehearsal, not as a page to read on screen.

## 0:00–0:25 — Introduction

**Show:** Your face and student ID, then the Home page. Say your student number clearly.

**Say:**

> I'm Louis Callander, student number 22308135. This is Phoneme Play Builder, which lets teachers create phoneme-based Wordle and Word Search activities. Assessment 3 extends the existing builder with database-backed reporting, usage monitoring and testing. I'll demonstrate the data flow, dashboard and the evidence from Playwright, JMeter and Lighthouse.

## 0:25–1:30 — Builder, saved data and generated output

**Show:** Wordle builder. Select `chip`, point to its ordered phonemes and hint, then generate and download the named demo. Open Activities and its Edit screen to show the stored settings. Open the downloaded HTML and briefly interact with its keys. Have its download folder ready to avoid searching on camera.

**Say:**

> The teacher selects a word and configures the activity. This example stores the written word, its ordered phonemes, a hint, difficulty and activity type. The seeded examples are simulated teaching records, and teachers can also add their own words.
>
> When I generate the activity, the app saves its configuration and produces a standalone HTML game. Reopening the activity shows that these settings were stored in the database. The downloaded game works offline.
>
> The data flows from the React interface to a Next.js API. Zod validates the input, and Prisma reads and writes the SQLite database. The server then uses those stored records to generate the HTML output.

**Optional if ahead of time:** Change the saved title and save it to show an edit. Full CRUD evidence comes later in the Playwright section, so do not spend this whole section editing fields.

## 1:30–2:40 — Dashboard and reporting

**Show:** Dashboard → Refresh dashboard. Point to resources, generation totals, average time, most-used type, Generation history, date selector, difficulty breakdown and recent activities. Show the demo's generation event.

**Say:**

> These figures come from database records. The resource cards count activities currently saved, so deleting an activity reduces those totals. Generation history is separate and remains after deletion.
>
> A successful generation means the server prepared an HTML output. It does not mean a learner opened or completed the game. Repeat downloads count as additional generations.
>
> Average time on page uses visible time reported by builder visits. It excludes hidden tabs and includes visits still in progress. Most-used activity type is based on builder visits, rather than downloads.
>
> The dashboard refreshes every 30 seconds, or manually. Here I can filter generation history to seven days, thirty days or all time. The summary cards above remain all-time usage or current library totals. The difficulty breakdown and recent activities provide another view of the stored configurations.

**Action:** Select Last 7 days and click Refresh report. Point out the separate filtered counts, without claiming they must differ from all-time counts in a newly used app.

## 2:40–3:15 — Health and a recorded failure

**Show:** Open `/health`. Then open `/api/activities/not-an-id/download` in another tab on the same app origin. Return to Dashboard and refresh; show the new failed event and Needs attention warning.

**Say:**

> The health endpoint checks whether the application can query the database. A healthy response returns HTTP 200; a database failure returns 503.
>
> To demonstrate failure monitoring, I'm deliberately requesting a download with an invalid activity ID. The server rejects it and records a failed generation. Refreshing the dashboard shows the outcome and its error details. This is a controlled invalid request, not a database outage.

**Recording note:** To visibly prove the 200 status, have the browser Network panel open with the `/health` request selected. The JSON alone shows the health payload, not the HTTP status code.

## 3:15–4:00 — Playwright

**Show:** The September 28 report summary, one teacher CRUD test and one learner output test. Open a trace briefly if rehearsed.

**Say:**

> Playwright checks the workflows in a real browser. The teacher test adds a dictionary word, creates and reads an activity, edits it and deletes it. The learner tests generate and download both game types, open the files offline, complete the games and reset them.
>
> The latest run passed 19 tests, with one intentionally skipped duplicate API check. Desktop and emulated mobile layouts are covered. The dashboard tests also check persisted generation counts, history after deletion and date filtering. Separately, all 29 unit and integration tests, lint and the production build passed.

## 4:00–5:10 — JMeter load testing

**Show:** The staged-results table and JMeter HTML reports for 25 and 100 users. Point to error rate and the 95th-percentile response time.

**Say:**

> JMeter measures how the server behaves under concurrent HTTP traffic. Each simulated user loads a builder and dictionary, saves an activity, generates its HTML, deletes the activity and reads the dashboard. The stages used one, ten, twenty-five, fifty and one hundred concurrent users, with a ten-second ramp-up within each scheduled sixty-second stage.
>
> These results were recorded on September 17, before the final merge. The one, ten and twenty-five-user stages had no errors. At twenty-five users, the 95th-percentile response time was 76 milliseconds. That means roughly 95 percent of measured requests finished within that time.
>
> At one hundred users, about 34 percent of requests failed and the 95th percentile rose to around fifteen seconds. Server logs showed database timeouts. This suggests database contention, but the exact bottleneck was not isolated. The app responded to health and dashboard checks after each stage. These results describe this laptop and workload, not a universal user limit.

**Do not claim:** 1,000 or 10,000 users were tested, that JMeter played the games, or that these are measurements of the final merged version. The brief permits equivalent staged levels.

## 5:10–6:05 — Lighthouse and design improvements

**Show:** September 17 Dashboard dark-mode before report (92), then the September 28 Dashboard dark-mode report (100). Show one of the earlier contrast or definition-list findings and the corrected dashboard.

**Say:**

> Lighthouse identified dark-mode contrast problems, invalid markup in the dashboard metric lists and a mismatch in the logo link's accessible name. The changes improved text contrast, corrected the label-and-value structure, and let the visible logo text provide its accessible name.
>
> The earlier dark-mode dashboard scored 92. The latest checks score 100 across Home, Dashboard and both builders, in desktop and mobile sizes and both light and dark themes. These findings influenced the colours and markup while preserving the overall design.
>
> These are automated accessibility results. A score of 100 does not prove complete accessibility or replace manual keyboard and screen-reader testing.

## 6:05–6:40 — GitHub and technical structure

**Show:** GitHub repository homepage, then actual commits. Briefly point to `src`, `prisma`, `tests` and `docs` in the repository.

**Say:**

> This is the GitHub repository and its development history. The project continues the Next.js application from the earlier assessments. Components, server routes and database access are separated into reusable modules. The repository includes the database migrations, automated tests, test evidence and references. The merge combines the usage dashboard with detailed generation history, and its checks were rerun after integration.

## 6:40–7:00 — Conclusion

**Show:** Dashboard and your face.

**Say:**

> The application now stores teacher configurations, generates usable activities and exposes its usage and operational state through the dashboard. Browser and accessibility checks support the working demonstration, while load testing identifies a limitation under heavier traffic. The next performance step would be to investigate the database contention and repeat the same workload after a targeted improvement.

## Evidence to open before recording

Run from the project folder, using a separate terminal while the application runs:

```powershell
npx playwright show-report "artifacts/playwright/2026-09-28T01-51-16-643Z/report"
```

- **Latest Lighthouse:** open `artifacts/lighthouse/2026-09-28T01-52-57-204Z-merge-check/dashboard-desktop-dark.html` in a browser. The same folder contains the other 15 reports and `summary.csv`.
- **Earlier Lighthouse findings:** extract `docs/evidence/lighthouse-2026-09-17.zip` and locate the before version of `dashboard-desktop-dark.html`.
- **JMeter:** extract `docs/evidence/jmeter-2026-09-17.zip`; open the 25-user and 100-user report `index.html` files. Keep the extracted folders intact so report assets load. Use [LOAD_TEST_RESULTS.md](LOAD_TEST_RESULTS.md) for the five-stage comparison.
- **GitHub:** https://github.com/22308135/phoneme-activity-builder and its Commits view.
- **References:** [REFERENCES.md](REFERENCES.md). No need to read the references aloud; retain them with the submission and follow Moodle's requirements.

## Final recording check

- Face, voice and student ID included; screen text and audio understandable.
- Working app, saved data, generated output, dashboard, reports, alert and health check visible.
- Playwright, JMeter, Lighthouse, GitHub homepage and commits visible.
- Earlier versus current results labelled accurately; no claims of lifetime creation counters or tracked offline student gameplay.
- Between 3 and 8 minutes. If over time, reduce clicking and repeated explanations rather than removing one of the three required testing tools.
- Complete the university's AI acknowledgement and describe the assistance used accurately.
