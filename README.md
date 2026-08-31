# Phoneme Play Builder

Phoneme Play Builder is a database-backed Next.js application for Speech Pathology teachers. Teachers can create phoneme word lists, save Wordle and Word Search configurations, reopen and edit them, preview playable activities, and download standalone HTML files for classroom use.

## Author

- Louis Callander
- Student number: 22308135
- Assessment 2: Backend and Database Development

## Assessment features

- Teacher-facing create, read, update, and delete workflow at `/activities`
- Teacher-entered words, ordered phonemes, English labels, and hints rather than fixed activity-only content
- System, Light, and Dark themes plus Comfortable and Compact layouts, synchronised through a shared preference provider and one-year cookies
- Ordered IPA phoneme storage, including multi-character units such as `tʃ` and `dʒ`
- Multiple saved Wordle and Word Search configurations
- Difficulty, hints, target words, grid size, and timestamps stored in SQLite
- Zod validation before database writes
- Prisma schema, migration history, seed data, and cascading word deletion
- Live Wordle and Word Search previews driven by saved data
- Server-generated, standalone HTML downloads from saved activity IDs
- Database-aware `GET /health` endpoint
- Docker image with automatic migration, seed data, health check, and persistent volume
- Automated unit, API, desktop/mobile browser, and accessibility checks

## Technology

- Next.js 16 and React 19
- TypeScript
- Prisma ORM 6 and SQLite
- Zod
- Vitest, Playwright, and axe-core
- Docker

## Local setup

Requirements: Node.js 22 LTS and npm. The Docker image uses Node.js 22 to keep the Prisma engine and application runtime reproducible.

```powershell
Copy-Item .env.example .env
npm ci
npm run db:generate
npm run db:setup
npm run dev
```

Open `http://localhost:3000`. Local setup synchronizes the schema and then runs the idempotent seed. Docker and production use the committed migration history through `db:deploy`.

To embed the assessed walkthrough on the About page, add `public/walkthrough.mp4` and its captions at `public/walkthrough.vtt`. A hosted video file can instead be supplied through `NEXT_PUBLIC_WALKTHROUGH_VIDEO_URL`.

## Quality checks

```powershell
npm run lint
npm run test
npm run build
npm run test:browser
```

Unit tests cover schemas and activity generation. Browser tests check health, CRUD, downloads, desktop/mobile behaviour, and serious or critical axe accessibility violations in installed Microsoft Edge.

## API

| Method | Route | Result |
| --- | --- | --- |
| `GET` | `/health` | Returns 200 when the app can query its database |
| `GET` | `/api/activities` | Lists activities; accepts `?type=WORDLE` or `WORD_SEARCH` |
| `POST` | `/api/activities` | Validates and creates an activity and its words |
| `GET` | `/api/activities/:id` | Retrieves one activity and its ordered words |
| `PUT` | `/api/activities/:id` | Validates and replaces settings and words |
| `DELETE` | `/api/activities/:id` | Deletes the activity; related words cascade |
| `GET` | `/api/activities/:id/download` | Generates playable HTML from stored data |
| `POST` | `/api/download` | Downloads an unsaved preview example |

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

- [Architecture and design](docs/ARCHITECTURE.md)
- [APA 7 references](docs/REFERENCES.md)
- [Video walkthrough script](docs/VIDEO_SCRIPT.md)
- [Submission checklist](docs/SUBMISSION_CHECKLIST.md)
- [Git development history](docs/GIT_HISTORY.md)

## Known limitations

- Authentication and per-teacher accounts are outside scope.
- SQLite suits this single-container teaching tool; a multi-user deployment would benefit from PostgreSQL.
- Downloaded files do not report student results to the server.
- The app validates IPA structure but cannot determine clinical suitability.
- Modern browser support is assumed.

## Submission

Do not include `.env`, `.db` files, `node_modules`, `.next`, test reports, or editor metadata in the ZIP. Include the GitHub link, video, required AI acknowledgement, and APA 7 references.
