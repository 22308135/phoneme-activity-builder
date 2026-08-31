# Submission checklist

## Technical evidence

- [ ] Run `npm ci` from a clean copy.
- [ ] Run local database setup with `npm run db:setup`.
- [ ] Run `npm run check` and `npm run test:browser`.
- [ ] Build and run Docker; show healthy status.
- [ ] Confirm `/health` returns 200.
- [ ] Demonstrate create, read, update, and delete.
- [ ] Download and open both saved activity types.

## Video

- [ ] Show student ID in the first 30 seconds.
- [ ] Keep face visible and narrate throughout.
- [ ] Explain backend and schema.
- [ ] Demonstrate word/activity CRUD.
- [ ] Demonstrate both builders and downloads using stored data.
- [ ] Show `/health` and Docker.
- [ ] Show `git log --oneline --decorate --graph --all` and explain the development milestones.
- [x] Include the final walkthrough at `public/walkthrough.mkv` and confirm it plays on `/about`.
- [ ] Add accessible captions at `public/walkthrough.vtt`.

## Written and administrative work

- [x] Include at least five APA 7 industry sources.
- [x] Include architecture, database, API, and Docker documentation.
- [ ] Complete the unit’s official AI acknowledgement form.
- [ ] Add the final GitHub repository URL.
- [ ] Confirm repository visibility matches unit instructions.
- [ ] Confirm the submitted ZIP and presentation both expose inspectable Git history or the repository link.

## ZIP audit

- [ ] Include source, Prisma schema/migrations, tests, Dockerfile, and documentation.
- [ ] Exclude `.env`, secrets, local databases, dependencies, builds, and reports.
- [ ] Open the ZIP and inspect its contents before uploading.
