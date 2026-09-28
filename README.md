# Phoneme Play Builder

Phoneme Play Builder is a database-backed Next.js application for Speech Pathology teachers. Teachers can create phoneme word lists, save Wordle and Word Search configurations, reopen and edit them, preview playable activities, and download standalone HTML files for classroom use.

## Author

- Louis Callander
- Student number: 22308135
- Assessment 3: Data-driven Application and Reporting (dashboard stage)
- GitHub: https://github.com/22308135/phoneme-activity-builder

## Assessment features

- Operational dashboard at `/dashboard` with saved resource summaries, live health, generation results and anonymous builder usage
- Generation history with 7-day, 30-day and all-time filters, retained activity names and failure details, and empty-list warnings. Summary cards remain all-time/current-library figures; the date filter applies to generation history.
- Custom-content forms and live previews together on `/wordle` and `/word-search`, with saved puzzles managed at `/activities`
- Direct saved-puzzle HTML downloads plus focused editing at `/activities/:id/edit`
- Teacher-entered words, ordered phonemes, English labels, and hints rather than fixed activity-only content
- Offline curated suggestions can populate editable ordered phonemes and child-friendly hints from a written word
- System, Light, and Dark themes plus Comfortable and Compact layouts, synchronised through a shared preference provider and one-year cookies
- Ordered IPA phoneme storage, including multi-character units such as `tʃ` and `dʒ`
- Multiple saved Wordle and Word Search configurations
- Difficulty, hints, target words, grid size, and timestamps stored in SQLite
- Zod validation before database writes
- Prisma schema, migration history, seed data, and cascading word deletion
- A reusable Word Dictionary with 26 curated entries plus teacher-added database entries
- Live Wordle and Word Search previews driven by dictionary and saved data
- Wordle and Word Search HTML generation automatically saves the named puzzle to the Activities library
- Server-generated, standalone HTML downloads from saved activity IDs
- Database-aware `GET /health` endpoint
- Docker image with automatic migration, seed data, health check, and persistent volume
- Automated unit, API, desktop/mobile browser, and accessibility checks

## Assessment 1 feedback addressed

- The About route now embeds the supplied walkthrough video.
- A shared preference context provides System, Light, and Dark themes plus persistent layout density.
- Teachers can enter and store their own words, ordered phonemes, hints, targets, and activity settings.
- Phoneme help appears on both pointer hover and keyboard focus in the live builders and downloaded HTML.
- Standalone HTML generation lives in `src/lib/gameHtml.ts`; the download button only handles the browser download action.
- The repository URL and an inspectable development-history summary are included in the submission documentation.

## Technology

- Next.js 16 and React 19
- TypeScript
- Prisma ORM 6 and SQLite
- Zod
- Vitest, Playwright, and axe-core
- Docker

## Local setup

Requirements: Node.js 22.19+ and npm. The Docker image uses Node.js 22 to keep the Prisma engine and application runtime reproducible. Lighthouse audits also need an installed Chrome/Chromium browser.

```powershell
Copy-Item .env.example .env
npm ci
npm run db:generate
npm run db:setup
npm run dev
```

Open `http://localhost:3000`. Local setup synchronizes the schema and then runs the idempotent seed. Docker and production use the committed migration history through `db:deploy`.

The assessed walkthrough is embedded from `public/walkthrough.mp4`. Add captions at `public/walkthrough.vtt`; a hosted MP4 can instead be supplied through `NEXT_PUBLIC_WALKTHROUGH_VIDEO_URL`.

## Quality checks

```powershell
npm run lint
npm run test
npm run build
npm run test:browser
npm run test:lighthouse
```

Unit tests cover schemas, activity generation and dashboard metrics. Browser tests use installed Google Chrome at desktop and emulated Pixel 7 sizes. They check teacher CRUD, downloading and completing both games offline, dashboard refresh and persisted generation counts, settings and serious/critical axe accessibility violations. Set `PLAYWRIGHT_BROWSER_CHANNEL=msedge` to use installed Edge instead.

`npm run test:browser` builds the app, migrates and seeds a temporary SQLite database, and starts a separate production server on `127.0.0.1:3100`. Your normal database is untouched. Timestamped HTML reports, JSON results, traces and generated games are saved under `artifacts/playwright/`. See [recorded results and report instructions](docs/PLAYWRIGHT_RESULTS.md).

Dashboard integration tests run with `npm test` against a disposable SQLite database. They apply the committed migrations and check empty states, resource counts, dictionary overrides, visit deduplication, timing validation, generation outcomes and database failures. They do not alter your local activity database.

## Assessment 3 dashboard

Open `/dashboard` from the main navigation (or Menu on mobile). It refreshes every 30 seconds and also has a manual refresh button. Existing installations must run `npm run db:generate` and `npm run db:deploy` before starting the updated app; Docker applies migrations at startup.

- **Resources:** counts of currently saved Wordle and Word Search activities, stored word entries (including repeated words), and unique dictionary words. Custom entries override matching curated dictionary words without being counted twice. Deleting an activity reduces these library totals; these are not lifetime creation counters.
- **Generation:** each saved-activity or preview HTML download endpoint request records one success or failure. Success means the server prepared an HTML response, not that the recipient opened the file. Failed requests without a valid activity have no activity type. Live preview resets and client-side validation warnings are excluded.
- **Builder usage:** an anonymous visit starts on entry to `/wordle` or `/word-search`. Visible time is reported every 15 seconds, when visibility changes and on leaving. Each visit has a random ID; repeated/out-of-order updates cannot inflate visits or reduce recorded time. Durations are bounded at 24 hours per visit. No names, IP addresses or student responses are collected.
- **Average time:** total reported visible time divided by recorded builder visits, including ongoing visits. It is approximate if a browser closes before its final update. Most-used type is based on builder visits; ties and no-data states are displayed explicitly.
- **History:** generation and visit records survive activity deletion. Tracking starts with this version; past downloads are not reconstructed and seed data does not invent historical usage. Offline downloaded games do not send telemetry.
- **Availability:** health is checked independently of dashboard metrics. A failed refresh preserves the previous figures with a stale-data notice. If recording a generation metric fails, the server logs the problem and still serves the puzzle, so counts can under-report during a metrics outage.

The dashboard stage is implemented. JMeter and Lighthouse evidence are documented below; the Assessment 3 video remains separate work.

## JMeter load testing

The reproducible JMeter plan tests both builders, stored phonemes, activity creation, generated HTML downloads, deletion and dashboard summaries. The runner uses a separate production server and fresh temporary databases, keeping your saved activities untouched.

```powershell
powershell -NoProfile -File scripts/setup-jmeter.ps1
npm run test:load
```

The full run includes a smoke check followed by 1, 10, 25, 50 and 100 concurrent users, each for 60 seconds including ramp-up. Reports and raw samples are written to `artifacts/jmeter/`. See [test instructions and methodology](tests/load/README.md) and [recorded results](docs/LOAD_TEST_RESULTS.md).

## Lighthouse accessibility

```powershell
npm run test:lighthouse -- --label=check
```

This builds the production app and audits Home, Dashboard, Wordle and Word Search at desktop and mobile widths in both light and dark themes. Lighthouse snapshot mode waits for loaded content before checking accessibility. HTML and JSON reports are saved under `artifacts/lighthouse/`; it does not measure performance or certify WCAG compliance.

The runner starts an isolated local server on port 3300 and uses a temporary seeded database and browser profile. It does not change your normal data or browser preferences. Chrome is detected at common installation paths; set `CHROME_PATH` if needed. See [before/after findings and video notes](docs/ACCESSIBILITY_RESULTS.md) and the selected reports in `docs/evidence/`.

## API

| Method | Route | Result |
| --- | --- | --- |
| `GET` | `/health` | Returns 200 when the app can query its database |
| `GET` | `/api/dashboard` | Database-backed resource, generation and builder usage summaries |
| `POST` | `/api/usage` | Validates and records an anonymous builder visit or cumulative visible-time update |
| `GET` | `/api/activities` | Lists activities; accepts `?type=WORDLE` or `WORD_SEARCH` |
| `POST` | `/api/activities` | Validates and creates an activity and its words |
| `GET` | `/api/activities/:id` | Retrieves one activity and its ordered words |
| `PUT` | `/api/activities/:id` | Validates and replaces settings and words |
| `DELETE` | `/api/activities/:id` | Deletes the activity; related words cascade |
| `GET` | `/api/activities/:id/download` | Generates playable HTML from stored data |
| `POST` | `/api/download` | Downloads an unsaved preview example |
| `GET` | `/api/word-suggestions?word=chip` | Returns an editable suggestion from the local curated dictionary |
| `GET`, `POST` | `/api/dictionary` | Lists all dictionary entries or adds/updates a custom entry |
| `DELETE` | `/api/dictionary/:id` | Deletes a teacher-added dictionary entry |

Successful creation returns `201`; successful deletion returns `204`. Invalid input returns `400`, missing records return `404`, malformed stored phonemes return `422`, and unexpected failures return `500`.

## Data model

An `Activity` stores its title, type, difficulty, grid size, hint preference, and timestamps. Each related `Word` stores the written word, hint, position, target flag, and phonemes. Phonemes are JSON-encoded arrays of strings so one sound can contain multiple Unicode characters without being split.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the schema diagram, request flow, validation rules, and design decisions.

## Docker

```powershell
docker build -t phoneme-activity-builder:assessment2 .
docker run --name phoneme-builder-assessment2 -p 3000:3000 -v phoneme-activity-data:/data phoneme-activity-builder:assessment2
```

Open `http://localhost:3000` and `/health`. Startup applies migrations, seeds an empty database, and stores SQLite data in the named volume. This workflow has been verified through a container restart.

## Supporting assessment documents

- [Assessment 3 notes — requirements, results, video plan and submission checklist](docs/ASSESSMENT_3_NOTES.md)
- [Architecture and design](docs/ARCHITECTURE.md)
- [APA 7 references](docs/REFERENCES.md)
- [Git development history](docs/GIT_HISTORY.md)
- [JMeter results](docs/LOAD_TEST_RESULTS.md)
- [Lighthouse accessibility results](docs/ACCESSIBILITY_RESULTS.md)
- [Playwright browser results](docs/PLAYWRIGHT_RESULTS.md)

## Known limitations

- Authentication and per-teacher accounts are outside scope.
- SQLite suits this single-container teaching tool; a multi-user deployment would benefit from PostgreSQL.
- Downloaded files do not report student results to the server.
- The app validates IPA structure but cannot determine clinical suitability.
- Modern browser support is assumed.

## Submission

Do not include `.env`, `.db` files, `node_modules`, `.next`, transient `artifacts/` output or editor metadata in the ZIP. Keep the selected assessment evidence archives in `docs/evidence/`. Include the GitHub link, video, required AI acknowledgement, and APA 7 references.
