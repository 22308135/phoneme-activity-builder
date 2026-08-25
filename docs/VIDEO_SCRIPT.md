# Video walkthrough script

Target length: 6–8 minutes. Keep your face visible and narrate throughout.

## 0:00–0:30 — identity and purpose

- Show “Louis Callander — 22308135”.
- Explain that Assessment 2 extends the frontend with a backend, database, CRUD, validation, persistence, and Docker.

## 0:30–1:20 — architecture

- Show `docs/ARCHITECTURE.md` and its diagram.
- Explain React → Route Handlers → Zod → Prisma → SQLite.
- Open `prisma/schema.prisma`; identify the Activity/Word relationship and cascade.
- Explain that `["tʃ", "ɪ", "p"]` preserves multi-character phonemes.

## 1:20–3:20 — CRUD

- Open `/activities` and create “Video demonstration”.
- Enter “chip”, `tʃ, ɪ, p`, a hint, and its target selection.
- Save and identify the list entry (create/read).
- Edit its title or difficulty and save (update).
- Open its builder and show that database data populated the game.
- Return and delete the demonstration activity (delete).

## 3:20–4:35 — generated activities

- Load the seeded Wordle, play one input, and download the saved activity.
- Open the standalone HTML and explain that it no longer needs the server.
- Repeat with the seeded Word Search, pointing out its stored grid size and words.

## 4:35–5:05 — validation

- Try an empty title or incomplete word and show the message.
- Mention the API’s 400, 404, 422, and 500 handling.

## 5:05–5:35 — health

- Visit `/health` or use `Invoke-WebRequest`.
- Show HTTP 200 and `{"status":"ok","database":"connected"}`.
- Explain that health performs a real database query.

## 5:35–6:40 — Docker

- Show the Dockerfile and persistent `/data` configuration.
- Run or show:

```powershell
docker build -t phoneme-activity-builder:assessment2 .
docker run --name phoneme-builder-assessment2 -p 3000:3000 -v phoneme-activity-data:/data phoneme-activity-builder:assessment2
docker ps
```

- Open the containerized app and `/health`.
- Point out healthy status, automatic migration, seeding, and the volume.

## 6:40–7:20 — conclusion

- Show `npm run check` and `npm run test:browser`.
- Mention desktop/mobile and axe accessibility checks.
- Summarize that multiple stored configurations drive both activity types and downloads.
