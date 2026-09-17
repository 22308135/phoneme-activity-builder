# Playwright browser testing evidence

The final run on 17 September 2026 passed **17 tests, with zero failures or flaky results** in 31.9 seconds. One duplicate API test was intentionally skipped in the mobile project; the same API test passed in the desktop project.

## Assessment coverage

| Workflow | Desktop | Emulated mobile |
| --- | --- | --- |
| Teacher adds a dictionary word, creates and reads a saved activity, edits its title, then deletes it and the custom word | Passed | Passed |
| Generate and save Wordle, download HTML, open it offline, complete the game and reset | Passed | Passed |
| Generate and save Word Search using dictionary selections, download HTML, open it offline, find all six words and reset | Passed | Passed |
| Home dashboard link, healthy status, updated library/generation counts, recent activity and generation history retained after deletion/reload | Passed | Passed |
| Grid size/selection limits and oversized-word validation | 2 passed | 2 passed |
| Serious/critical axe accessibility violations across eight pages, including the loaded dashboard | Passed | Passed |
| Theme and layout cookies | Passed | Passed |
| Health API, stored phoneme arrays and saved HTML download | Passed | Duplicate skipped |

The two required Playwright use cases are covered: a builder CRUD workflow and a user generating/viewing an activity. Both game types are additionally played to completion through their visible controls. The tests open the actual downloaded files with the browser context offline, rather than just checking a download event or calling internal game functions.

## Environment and changes

- Playwright 1.62.1, installed Google Chrome 153.0.8010.47, Node 24.15.0, Windows 11 (10.0.26200).
- Desktop viewport 1280 × 720; Pixel 7 emulation 412 × 839. Mobile results are browser emulation, not a physical phone test.
- Production build `FjtFFFyYWuUwI-sJVQ95C`, served on `127.0.0.1:3100` against a fresh migrated and seeded temporary SQLite database. The runner removes this database afterwards and leaves normal saved activities untouched.
- The runner now saves timestamped HTML/JSON reports, traces and generated HTML files. It uses installed Chrome by default; the former configuration required Edge, which was not installed on this machine.
- The initial expanded run had two dashboard test failures because a broad status selector matched both the health status and loading message. Scoping the selector to the health indicator fixed the test. No application change was needed. The full suite then passed.
- The tested application includes the earlier dashboard and accessibility changes. The run records the existing Git HEAD and explicitly flags uncommitted changes; HEAD alone does not identify the complete tested source.

Production build and lint passed. All 29 Vitest unit/integration tests also passed. These checks cover the workflows above; they do not establish full accessibility compliance, every browser combination or high-load capacity. Separate JMeter and Lighthouse findings remain applicable.

## Open the evidence

Selected final evidence is preserved in [playwright-2026-09-17.zip](evidence/playwright-2026-09-17.zip). Extract it, then point Playwright at its `report` folder:

```powershell
npx playwright show-report "PATH-TO-EXTRACTED-FOLDER/report"
```

The local original report can be opened from the project folder with:

```powershell
npx playwright show-report "artifacts/playwright/2026-09-17T03-47-16-352Z/report"
```

The report includes traces and attached generated games. Select a passed test and open its trace to inspect actions, rendered page snapshots and requests. See Playwright's [HTML report instructions](https://playwright.dev/docs/test-cli) and [trace viewer guide](https://playwright.dev/docs/trace-viewer).

The archive also contains `results.json` with machine-readable outcomes, `run.json` with environment/build information, and `server.log`. Raw initial and final runs remain locally under `artifacts/playwright/`, which is excluded from Git and submission packaging.

To reproduce with installed Chrome:

```powershell
npm run test:browser
```

## Brief video demonstration

1. Show the final report: 17 passed, zero failed, and explain the one duplicate API skip.
2. Open the desktop teacher CRUD trace and show creation, saved activity, editing and deletion.
3. Open either learner trace and show generating/downloading the file, opening it offline, completing it and resetting.
4. Briefly show the dashboard test verifying that library totals change while generation history survives deletion.

Suggested explanation: “Playwright checks the teacher's create, read, update and delete workflow, and the learner's generated game. I tested desktop and mobile layouts, including opening and completing both downloaded games offline. The final run passed 17 tests; the only skipped check repeats the desktop API test.”
