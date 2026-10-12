# What to understand before the Assessment 3 video

You do not need to memorise every function. You should be able to explain one complete workflow, interpret the dashboard and test results, and distinguish measured results from assumptions. Rehearse these answers without reading them word for word; they also prepare you for Assessment 4 questions.

## 1. The purpose and data flow

**Question: What problem does the application solve?**

Teachers can create phoneme-based Wordle and Word Search activities, save their settings, reuse them and download games for offline use. Assessment 3 adds reporting, monitoring and evidence that the workflows work.

**Be able to explain this sequence:**

Teacher input → React interface → Next.js API → Zod validation → Prisma → SQLite → saved configuration → server-generated HTML.

| Term | Meaning in this project |
| --- | --- |
| React | Builds the interactive interface and updates what the user sees. |
| Next.js | Runs the application pages and server-side API routes. |
| API | An endpoint the interface calls to read or change data, or generate output. |
| Zod | Checks the shape and allowed values of incoming data before it is stored. |
| Prisma | Lets the server query the database using typed JavaScript/TypeScript code. |
| SQLite | The file-based database holding activities, words and monitoring records. |
| Migration | A versioned database schema change, so a fresh installation gets the required tables and columns. |
| CRUD | Create, read, update and delete—the saved activity management workflow. |

**Practice:** Explain what happens after clicking Save & download, without saying only “the backend handles it.”

## 2. What is actually stored

- **Activity:** title, game type, difficulty, grid size, hint setting and timestamps.
- **Word:** written text, ordered phonemes, hint, ordering and Wordle target flag; linked to an activity.
- **DictionaryWord:** teacher-added/customised dictionary entries.
- **GenerationEvent:** outcome, time, type when known, and available activity snapshot/error details. Kept independently so deleting an activity does not delete its generation history.
- **PageVisit:** anonymous visit identifier, builder type, cumulative visible time and timestamp.

Phonemes are stored as an ordered JSON array. For example, `chip` can be represented as `["tʃ", "ɪ", "p"]`. The multi-character `tʃ` is kept together as one phoneme, rather than being split into individual characters.

**Simulated input:** The seed creates example teaching activities. Those examples are not evidence of historical classroom usage. Visits and generation events are recorded as the app is used.

## 3. Exactly what each metric means

| Metric | Meaning | Important limit |
| --- | --- | --- |
| Wordle / Word Search activities | Activities currently saved | Not lifetime creation counts; deletion reduces them. |
| Words in activities | Word entries across saved activities | A word used in two activities counts twice. |
| Successful generations | Server prepared an HTML response for a download request | Does not prove the file was opened or the game completed; repeats count again. |
| Failed generations | Download request failed and its failure was recorded | Client-side form validation is not automatically a failed generation event. |
| Average time on page | Mean reported visible time per builder visit | Includes ongoing visits; hidden-tab time is excluded; unreported final updates can be lost. |
| Most-used activity type | Type with the most recorded builder visits | Not the game with the most downloads or learner completions. |
| Generation history filter | Last 7 days, 30 days or all time for history and its two counts | Does not change the summary cards above it. |
| Health | Whether the server can query the database at the time checked | Does not certify every feature works or guarantee good performance under load. |

**Practice:** Explain why you could have two saved activities but ten successful generations. Explain why the average visit duration changes while someone is still using a builder.

## 4. Monitoring, validation and failures

- `/health` returns **200** when the database query succeeds and **503** when it fails.
- A malformed activity ID returns **400**. A missing saved activity returns **404**. Invalid saved phoneme data can return **422**. An unexpected generation failure returns **500**.
- Validation prevents bad input from being accepted. Monitoring tells you what the running application has done or whether something is wrong.
- A form warning can prevent any request from being sent. A recorded server failure means a download request reached the server and failed.
- Generation metric writes are best-effort: failing to record a metric does not block an otherwise valid download. Counters may therefore be incomplete during an outage.
- Dashboard refresh failures show an unavailable/stale-data message; old figures must not be mistaken for newly refreshed data.

**Practice:** Explain why a green health indicator and some failed generations can appear together: the database is reachable now, but earlier or invalid generation requests may have failed.

## 5. Why three different testing tools are used

| Tool | Question it answers | Example here |
| --- | --- | --- |
| Playwright | Can a user complete the workflow in a browser? | Teacher CRUD; opening and completing downloaded games offline. |
| JMeter | How does the server respond to concurrent requests? | Multiple simulated users creating activities and generating HTML. |
| Lighthouse | What automated accessibility issues exist in the rendered page? | Contrast, label-and-value markup and accessible link names. |

**Current evidence:** 29 unit/integration tests passed; 19 browser tests passed, with one deliberately skipped duplicate API test. The mobile browser tests use emulation, not a physical phone. The production build and lint checks passed. Lint checks code issues; it does not prove a workflow works.

## 6. How to interpret the load results

- **Concurrent users:** simulated clients active at the same time. Not the number of registered accounts or visitors over a day.
- **Ramp-up:** users start gradually rather than all at once.
- **Response time:** how long a request takes to finish or fail.
- **p95:** approximately 95% of measured requests completed or failed within this time; the slowest 5% took longer. It is not the average.
- **Throughput:** requests processed per second. It can fall when the system spends time waiting or timing out.
- **Error rate:** failed requests divided by total requests.

The September 17 run used stages of 1, 10, 25, 50 and 100 users. The first three recorded no errors. At 25 users, p95 was 76 ms. At 50 users, the error rate was 16.20%. At 100 users it was 33.94%, with p95 about 15 seconds.

The logs showed database timeouts. Contention is a plausible explanation, not a fully isolated diagnosis. JMeter and the app shared a laptop, the workload was unusually write-heavy, and there was one run per level. Do not claim a universal “25-user maximum.”

JMeter measures HTTP requests, not keyboard gameplay. Playwright supplies the gameplay evidence. The 17 September load measurements predate the final merge.

**Practice:** Explain how the server might record a successful output after JMeter has already timed out waiting for it. This is why server counters and client-observed results can differ.

## 7. Accessibility decisions you should explain

1. **Contrast:** Pale dark-mode buttons needed darker labels so their text remained readable. Some status labels needed lighter text on dark backgrounds.
2. **Semantic markup:** Dashboard definition lists need correct term/value elements (`dt` and `dd`), so their structure is meaningful to assistive technology.
3. **Accessible names:** A link's accessible name should match what people see. The logo now uses its visible text rather than a mismatched override.

The earlier dark dashboard scored 92; the latest check scored 100. All 16 tested page/theme/viewport combinations scored 100. That means no failed scored automated checks in those states; it does not establish full WCAG compliance or cover every possible interaction.

## 8. Engineering choices and honest limitations

- **Why separate events from activities?** To retain historical outcomes after a teacher deletes a saved puzzle.
- **Why anonymous visit IDs?** To update one visit repeatedly without counting every heartbeat as a new visit. No student identity is required for these metrics.
- **Why exclude hidden-tab time?** To get a more useful estimate of visible builder usage. Visible time is still not proof of attention or learning.
- **Why SQLite?** It is simple for a local, single-container teaching application. The load results show reasons to investigate its write/concurrency behaviour before scaling.
- **What does Docker do?** Packages the app and its runtime consistently. A database volume preserves data across container recreation. Docker alone does not make the app scalable.
- **How is input checked?** Server-side validation checks required fields, phoneme arrays and settings. It cannot judge whether a phoneme choice is clinically appropriate.
- **What is not tracked?** Learner behaviour in offline downloaded games, completion scores and learning outcomes.
- **What is still outside this implementation?** Authentication/per-teacher accounts and lifetime creation counters. Do not present these as finished features.
- **What would you improve next?** Profile the database bottleneck, make a targeted change and repeat the same load test. Consider stronger metric delivery if counters must be complete under failure.

## Final self-check

Without reading notes, can you:

1. Explain the save-and-generate data flow in 30 seconds?
2. Distinguish current library counts, generation events and page visits?
3. Explain a validation warning versus a recorded server failure?
4. Interpret the 25-user and 100-user JMeter results without overstating them?
5. Name two accessibility fixes and explain why 100 is not a guarantee?
6. Explain what each testing tool covers and what it does not cover?
7. Identify the evidence dates and the actual GitHub version being shown?
8. Explain and acknowledge the AI assistance used, including this script?

If yes, you are ready to rehearse the [timed script](VIDEO_SCRIPT.md).
