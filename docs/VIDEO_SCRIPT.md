# Assessment 2 video walkthrough script

Target length: **8–10 minutes**. Keep your face visible and narrate continuously. Record the browser, terminal, editor and Docker Desktop at readable zoom. Do not speed up the final recording.

## Before recording

1. Start Docker Desktop and wait until the engine is ready.
2. Push the latest `main` branch to `https://github.com/22308135/phoneme-activity-builder`.
3. Open the project in VS Code and prepare browser tabs for the app, `/health`, and GitHub.
4. Use a clean Docker container on port 3001 so it does not conflict with the local app.
5. Confirm your camera, microphone and screen capture are recorded.
6. Keep your student ID ready to show in the first 30 seconds.

Run these before recording:

```powershell
npm run check
npm run test:browser
git status --short
git log --oneline --decorate --graph --all
docker build -t phoneme-activity-builder:assessment2 .
```

The Git worktree should be clean. Pre-building Docker keeps installation output out of the presentation.

## Demonstration data

Create this Wordle during the recording:

| Field | Value |
| --- | --- |
| Title | Video phoneme Wordle |
| Type | Wordle |
| Difficulty | Developing |
| Hints | Enabled |
| Word 1 | chip |
| Ordered phonemes | `tʃ, ɪ, p` |
| Hint | A small piece |
| Target | Yes |
| Word 2 | ship |
| Ordered phonemes | `ʃ, ɪ, p` |
| Hint | A large boat |

`tʃ` is deliberately used because it must remain one ordered sound token even though it contains multiple Unicode characters.

## 0:00–0:30 — identity and purpose

**On screen:** Show your face and student ID clearly, then the home page.

**Say:**

> My name is Louis Callander, and my student number is 22308135. This is my Assessment 2 submission, Phoneme Play Builder. The project began with the required `npx create-next-app` starter workflow. It extends my Assessment 1 Next.js frontend with a database, backend route handlers, validation, CRUD operations, stored-data activity generation, automated checks and Docker support.

## 0:30–1:15 — frontend continuity and Assessment 1 feedback

**On screen:** Briefly show Home, About, Settings, Wordle, Word Search and Activities. Show the embedded About video and the System, Light, Dark, Compact and Comfortable settings.

**Say:**

> The original frontend remains available as App Router pages. I also addressed the Assessment 1 feedback. The About page now contains its video. A shared preference context provides System, Light and Dark themes and layout density, persisted in one-year cookies. Teachers can enter their own content instead of relying on fixed examples, and phoneme help appears on pointer hover and keyboard focus in both live and downloaded activities.

## 1:15–2:15 — architecture and database schema

**On screen:** Open `docs/ARCHITECTURE.md`, `prisma/schema.prisma`, `src/lib/activity.ts`, and the API route folders.

**Say:**

> The request flow is React interface, Next.js route handler, Zod validation, Prisma ORM and SQLite. Activity stores the title, type, difficulty, optional grid size, hint preference and timestamps. Each Activity has many ordered Word records. A Word stores its written form, hint, list position, target state and parent activity ID. Cascade deletion prevents orphaned words.
>
> Phonemes are stored as a JSON-encoded ordered string array. For example, chip is stored as `tʃ`, `ɪ`, `p`. This preserves `tʃ` as one phoneme instead of splitting it into characters. Multiple Activity records support multiple Wordle and Word Search configurations.
>
> Zod validates lengths, enums, phoneme arrays, grid settings and activity-specific rules before Prisma writes anything. Wordle requires exactly one target, while Word Search requires at least two words.

## 2:15–4:35 — complete CRUD demonstration

### Create

**On screen:** Open `/activities`, select **New activity**, enter the demonstration data, use **Add word** for `ship`, and submit.

**Say:**

> The Activity library reads existing records from the backend. I will create a database-backed activity rather than use temporary values. It contains custom teacher-entered words, phonemes, hints, difficulty and target information. Adding the second word also demonstrates creating related Word records.

### Read

**On screen:** Point to the new card, select **Edit**, and show that both words and settings reload.

**Say:**

> The activity appears after a backend read. Edit retrieves the stored record and ordered words through `GET /api/activities/:id`. These fields are populated from SQLite rather than hard-coded defaults.

### Update words and settings

**On screen:** Rename it `Updated video phoneme Wordle`, choose Extending, change the `ship` hint to `Travels across water`, add `thin` with `θ, ɪ, n` and `Not thick`, remove `ship`, and save.

**Say:**

> I am updating both activity settings and related words. I changed a hint, added a word, removed a word, changed difficulty and renamed the activity. The PUT route validates the payload and performs related-word replacement inside a Prisma transaction, preventing a partial update from leaving inconsistent data.

### Read updated data

**On screen:** Open Edit again, show the saved changes, then return to the library.

**Say:**

> Reading the record again confirms the updated title, difficulty, phonemes and word list were persisted.

## 4:35–5:45 — stored-data Wordle and download

**On screen:** Select **Open builder** on the updated card. Show the saved selector and difficulty, enter a phoneme guess, tab to a phoneme button to expose its tooltip, download the saved activity, and open the HTML.

**Say:**

> Open Builder passes the saved activity ID to Wordle. The frontend fetches its stored target, phonemes, hint and difficulty. Feedback uses text as well as colour, and keyboard users receive the same phoneme explanation through a focus-visible tooltip.
>
> The download route retrieves the record by ID and generates self-contained HTML with embedded CSS, JavaScript and activity data. Generation is separated into `src/lib/gameHtml.ts`; the download component only handles the browser action. The file runs independently without the Next.js server.

## 5:45–6:35 — stored-data Word Search and download

**On screen:** Return to Activities, open the seeded Word Search, show its stored words and grid size, select endpoints, download it, and open the standalone HTML.

**Say:**

> Word Search uses a separate stored configuration. Database values determine its words and grid size. The generator places phoneme sequences horizontally, vertically and diagonally, forwards and in reverse. Cells are semantic buttons, making endpoint selection keyboard operable. This download also comes from stored data and runs independently.

## 6:35–7:15 — validation and error handling

**On screen:** Open New activity, submit an empty or incomplete form, and show the message. Then show `src/lib/activity.ts` and an API route.

**Say:**

> Invalid data is rejected before storage and the interface presents clear feedback. At API level, invalid input and malformed JSON return 400, missing records return 404, malformed stored phonemes return 422, and unexpected failures return a controlled 500 without exposing internal details.

## 7:15–7:40 — health endpoint

**On screen:** Open `/health`, then run:

```powershell
curl.exe -i http://localhost:3000/health
```

**Say:**

> The health route returns HTTP 200 with status OK and database connected. It performs a real `SELECT 1` through Prisma and returns 503 if the database is unavailable.

## 7:40–8:40 — Docker demonstration

**On screen:** Show the Dockerfile, then run:

```powershell
docker run --rm --name phoneme-builder-demo -p 3001:3000 -v phoneme-activity-demo:/data phoneme-activity-builder:assessment2
```

In another terminal:

```powershell
docker ps
curl.exe -i http://localhost:3001/health
```

Open `http://localhost:3001/activities` and show that it works.

**Say:**

> The multi-stage image installs locked dependencies, generates Prisma Client and builds the production app. Startup deploys committed migrations, runs the idempotent seed and starts Next.js. SQLite lives in `/data`, so records persist independently of the container. Docker also checks the database-aware health endpoint.

## 8:40–9:20 — tests, accessibility and Git history

**On screen:** Show successful output from:

```powershell
npm run check
npm run test:browser
git status --short
git log --oneline --decorate --graph --all
```

Open GitHub and show the commits. Point out `26505f6`, `2e35048`, `47a284d`, `25e7b96`, and the latest commit.

**Say:**

> The project passes lint, unit tests, TypeScript and a production build. Playwright verifies health, CRUD, stored downloads and preference persistence in desktop and mobile projects. Axe checks key routes for serious and critical accessibility violations. Git history shows incremental frontend, backend, accessibility, testing and documentation work rather than one final upload. The worktree is clean, and these commits are visible on GitHub.

## 9:20–9:45 — submission documentation

**On screen:** Briefly show `README.md`, `docs/REFERENCES.md`, `docs/ARCHITECTURE.md`, and the clean submission ZIP.

**Say:**

> The submitted ZIP contains the application source, Prisma schema and migration, tests, Dockerfile and supporting documentation. It excludes dependencies, builds, environment secrets and local database files. The README contains the GitHub URL and setup instructions. The written documentation includes architecture decisions, limitations and more than five APA 7 industry references. I will also submit the unit's required AI acknowledgement separately.

## 9:45–10:15 — delete and conclusion

**On screen:** Delete `Updated video phoneme Wordle` and show that it disappears.

**Say:**

> Finally, deleting the demonstration activity calls the DELETE route, and the cascade removes its related words. This completes create, read, update and delete for the activity and word data.
>
> Phoneme Play Builder is now a data-driven application for Speech Pathology teachers. It stores multiple custom configurations, validates specialist phoneme content, generates portable Wordle and Word Search activities, and runs reproducibly in Docker. Thank you.

## Recording checklist

- [ ] Student ID shown within the first 30 seconds.
- [ ] Face visible and narration present throughout.
- [ ] Assessment 1 frontend and feedback improvements identified.
- [ ] Activity and Word schema explained.
- [ ] Multi-character `tʃ` storage explained.
- [ ] Custom Wordle created with at least two words.
- [ ] Activity and individual word values read back.
- [ ] Word added, edited and removed during update.
- [ ] Updated values retrieved again.
- [ ] Wordle loaded and downloaded from stored data.
- [ ] Word Search loaded and downloaded from stored data.
- [ ] Both standalone HTML files opened.
- [ ] Validation failure shown.
- [ ] `/health` visibly returns HTTP 200.
- [ ] Docker container visibly running and healthy.
- [ ] Tests shown passing.
- [ ] Git log and GitHub commit history visibly demonstrated.
- [ ] Demonstration activity deleted.

## If something fails while recording

- If port 3001 is occupied, use `-p 3002:3000` and open port 3002.
- If the container name exists, run `docker rm -f phoneme-builder-demo` before recording.
- If the demonstration activity exists, delete it before starting the take.
- If Docker Desktop is not running, stop recording, start it, wait for the engine, and begin a clean take.
- Do not claim GitHub is current unless the latest commit is visibly present on the repository page.
