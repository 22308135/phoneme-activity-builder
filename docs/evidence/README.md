# Assessment 3 evidence

Extract each evidence ZIP before opening its reports. Keep supporting folders beside each HTML report.

| Archive | Contents and scope |
| --- | --- |
| `playwright-2026-09-28.zip` | Latest merged-app browser run: 19 passed, one intentional duplicate API skip. Extract and run `npx playwright show-report "PATH-TO-EXTRACTED-FOLDER/report"`. |
| `lighthouse-2026-09-28.zip` | Latest merged-app accessibility checks: 100 across 16 tested page/theme/viewport combinations. Open the native HTML reports, including `dashboard-desktop-dark.html`. |
| `jmeter-2026-09-17.zip` | Staged load tests before the final merge. After extracting, open `2026-09-17T03-07-51-121Z/users-25/report/index.html` or `users-100/report/index.html`. Includes the other stages and raw evidence. |
| `lighthouse-2026-09-17.zip` | Earlier before/after accessibility findings and fixes. Retained to show what changed. |
| `playwright-2026-09-17.zip` | Earlier browser evidence: 17 passed, one skip. The September 28 run is the latest verification. |

Report metadata identifies each run's environment and source state. September 28 checks ran against the resolved working tree before the merge commit was created. Load measurements are from September 17 and should not be described as a rerun of the final merged code.

See `../ASSESSMENT_3_NOTES.md`, `../LOAD_TEST_RESULTS.md`, `../ACCESSIBILITY_RESULTS.md`, and `../REFERENCES.md` for interpretation and sources. The recorded Assessment 3 video and university AI acknowledgement are separate submission items.
