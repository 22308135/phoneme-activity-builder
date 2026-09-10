# Assessment 2 video script — Louis

Aim for roughly 9–10 minutes including clicking and typing. That is a rehearsal estimate, not a limit specified in the supplied brief; follow any separate lecturer instructions. Read only the blockquotes aloud. Everything else is a cue for what to show.

Use this as speaking notes and change phrases you would not normally say. Pause while pages load. Make sure you understand the code you show. Complete the unit's AI acknowledgement accurately for assistance with the project and script.

## Before recording

- Keep your face visible and microphone on throughout. Have your student ID ready for the first 30 seconds.
- Open `http://localhost:3001`, `/health`, VS Code, Docker Desktop, and your GitHub commits page.
- Prepare `prisma/schema.prisma`, `src/lib/activity.ts`, `src/app/api/activities/[id]/route.ts`, `src/app/api/activities/[id]/download/route.ts`, `src/lib/gameHtml.ts`, and `Dockerfile` in VS Code.
- Run the commands below beforehand. Keep the actual successful output ready to show.
- Confirm your latest commits are on GitHub before claiming they are. The previous readiness check showed seven local commits awaiting a push.
- Use the existing Docker container on port 3001; do not start a second container on that port.
- Rehearse once and download fresh HTML files. Old downloads do not update when the app changes.

```powershell
npm run check
npm run test:browser
git status --short
git log -12 --oneline
docker ps
curl.exe -i http://localhost:3001/health
```

### Demonstration values

| Use | Value |
| --- | --- |
| New dictionary word | `chat` |
| Ordered phonemes | `tʃ, æ, t` |
| Initial hint | `A short talk` |
| Updated dictionary hint | `A friendly talk` |
| Wordle difficulty | Developing |
| Wordle name | `Week 2 - CH practice` |
| Updated activity name | `Week 2 - CH revision` |
| Updated activity hint | `A friendly conversation` |
| Extra activity word | `chip` / `tʃ, ɪ, p` / `A small piece` |
| Word Search name | `Week 2 - Sound search` |

If a custom `chat` entry exists from rehearsal, remove that rehearsal entry before recording. Leave unrelated resources alone.

## 0:00–0:30 — introduction

Show your face and student ID, then Home.

> Hi, I'm Louis Callander, and my student number is 22308135. This is my second assessment for Phoneme Play Builder.
>
> The first assessment was mainly the frontend. This part adds the database and backend, so a teacher can save their words and activities, come back to edit them, and download them again later. I'll show that working and then go through how the backend handles it.

## 0:30–1:10 — changes since Assessment 1

Show About and play a few seconds of its video. Show Settings: System, Light, Dark, and layout density. Briefly resize the browser and restore it.

> A few of the changes came directly from my first assessment feedback. The short walkthrough is now actually on the About page. Settings has a System theme option as well as Light and Dark, and there's a shared provider for those preferences. The theme and layout choice are saved in cookies.
>
> The other big change is custom content. There's now a Word Dictionary, the two builders, and Activities for the saved puzzles. That gives each page a clear job.

## 1:10–2:20 — dictionary: create, read and update

Open Word Dictionary. Add `chat`, `tʃ, æ, t`, and `A short talk`. Click **Add to dictionary**. Find its Custom card and refresh.

> I'll add chat as a new word. This field holds the written word, this one holds the sounds in order, and this is the hint.
>
> The dictionary comes with a starter set, but teachers can add extra entries. This one goes into the database. I'll refresh the page so you can see it's still there.

Enter `chat` again with the same phonemes and the updated hint `A friendly talk`. Click **Add to dictionary** and show the changed card.

> Entering the same word updates its custom entry. I've changed the hint here, and you can see the card has picked that up. So that's creating, reading and updating a dictionary word.

## 2:20–3:25 — build and save Wordle

Open Wordle. Choose **chat**, then **Developing**. Focus a sound button to show its tooltip. Enter a wrong guess, then `tʃ`, `æ`, `t` and Enter. Click **Save Wordle to Activities**, enter `Week 2 - CH practice`, and click **Confirm save**.

> Chat is now available in the builder with its phonemes and hint. Difficulty changes the number of attempts, the number of sound keys and how the hint is shown.
>
> The answer sounds are mixed with the other keys. I'll put in a wrong guess first, then the correct sounds. At the end it shows the English word.
>
> When I save, this little panel lets me name the activity. I'm calling it Week 2 - CH practice so it's easy to recognise in the library.

Open Activities and show the card.

> Here's the saved puzzle. I can open it, download it, edit it or delete it from here.

## 3:25–4:40 — activity and related-word CRUD

Click **Edit** on that card. Show the loaded word and settings. Rename it `Week 2 - CH revision`; change chat's hint to `A friendly conversation`. Add `chip` with `tʃ, ɪ, p` and `A small piece`, keeping chat as the target. Click **Save changes**. Reopen Edit and point out both saved words.

> This is loading the saved record from the backend. I'll change the title and hint, and add chip to the activity's word list. Chat stays as the target for this Wordle.
>
> After saving, I'll open it again. Both words and the updated hint are still here, so those changes have been stored.

Remove only chip, save, and reopen Edit to show chat remains. Return to Activities.

> I'll remove chip and save again. Now the activity has just chat. That shows adding, reading, changing and removing word content within a saved activity as well.

## 4:40–5:20 — download Wordle from stored data

Click **Download HTML** on the saved card. Open the new file and solve it using `tʃ`, `æ`, `t`. Show a tooltip in the file.

> This download comes from the saved activity. The server reads its words and settings from the database and puts them into a standalone HTML file.
>
> I've opened that file here. It has the game code and styling inside it, so it can run without the Next.js server. The teacher can share it with a class and download another copy from Activities later.

## 5:20–6:20 — Word Search

Open Word Search. Keep the initial five selected words. Search for `chat`, check it, and clear the search. Choose **9 × 9**. Click **Generate & download HTML**, enter `Week 2 - Sound search`, then **Save & download**. Open the file and find a word by selecting its first and last sound. Return to Activities and show both named cards.

> Word Search uses the same dictionary. The search box makes it easier to find a word without scrolling through the whole list. I'll add chat to this selection and use a nine-by-nine grid.
>
> Generate and download asks for a name, saves the settings, and then downloads the activity. In the downloaded game, I select the first and last sound of a word. Words can run across, down, diagonally or backwards.
>
> Back in Activities, both puzzles are saved separately. They have their own words and settings, and I can download either one again.

## 6:20–7:25 — explain the backend and schema

Show the Prisma schema, `src/lib/activity.ts`, and the activity PUT route. Point to the relevant fields and transaction as you explain them.

> This is a Next.js project using the create-next-app starter. The React pages call the API routes, the routes validate the data, and Prisma handles reading and writing to SQLite.
>
> Activity stores things like the title, type, difficulty and grid size. Each activity has related Word records, with the written word, hint, position and target flag. DictionaryWord is separate because those entries are reusable vocabulary. A saved activity keeps its own copy of the words.
>
> The phonemes are stored as a JSON array. For chat, that's these three entries: tʃ, æ and t. That matters because tʃ is one sound token even though it uses more than one character.
>
> This update runs inside a transaction. It replaces the activity's word rows and updates the settings together, so they either succeed together or roll back together.

## 7:25–8:05 — validation and errors

In Word Dictionary, try submitting an empty form. Then show `activityInputSchema`. Run this read-only request to show a backend error and HTTP 400:

```powershell
curl.exe -i http://localhost:3001/api/activities/not-a-number
```

> The form catches missing fields, but there's server-side validation as well. Zod checks the activity data before it gets written to the database. For example, Wordle needs exactly one target, and Word Search needs at least two words.
>
> Here's an invalid activity ID returning a clear error. The activity routes also handle missing records, and the download route rejects missing or empty phoneme lists. Those checks help stop invalid content reaching a generated game.

## 8:05–8:45 — Docker and health

Show the running app container in Docker Desktop and its published port. Show `Dockerfile`, then run:

```powershell
docker ps
curl.exe -i http://localhost:3001/health
```

> The app I've been using is running in Docker on port 3001. The Dockerfile installs the dependencies, builds Next.js, and starts the production app. On startup it also applies the database migrations and seeds the example activities if needed.
>
> The database is in the mounted data volume, so it can survive replacing the container. This health endpoint checks the database connection as well as the app. You can see HTTP 200 and database connected here.

## 8:45–9:25 — tests, history and submission

Show the successful check output prepared earlier. Show `git log -12 --oneline`, then GitHub's commits page. Point to `b40d23d` (dictionary), `0cd1e2b` (downloaded hints), `effc660` (naming), and `5a655a8` (Word Search). Briefly open README, references and the source ZIP.

> These are the checks for the build and browser workflows. The browser tests cover saving, editing, deleting and downloading activities, with desktop and mobile checks. There are also automated accessibility checks; they help catch issues, though they don't replace checking the interface manually.
>
> The commit history shows the changes over time, including the dictionary, the download fixes and the naming panels. The README has the setup instructions and repository link, and the supporting documents include the architecture and APA references. The source ZIP excludes node_modules and the local environment files.

Only claim commits are on GitHub if you can show them there. Inspect the actual ZIP before describing its contents. Submit the required AI acknowledgement separately.

## 9:25–9:55 — delete and finish

In Word Dictionary, remove the custom `chat` entry and confirm. Refresh. In Activities, point out the saved Wordle still exists, then delete `Week 2 - CH revision` and confirm. Refresh again.

> Finally, I'll remove the custom dictionary word. The activity still has its saved copy, which means changing the reusable dictionary doesn't wipe an existing teaching resource.
>
> Now I'll delete the demonstration Wordle as well. Deleting an activity removes its related word records. After refreshing, it's gone from the library.
>
> That's the full workflow: add the content, build an activity, save it, edit it and download it again. Thanks for watching.

## Final rehearsal checklist

- Student ID in the first 30 seconds; face and narration throughout.
- Dictionary word created, read after refresh, updated and deleted.
- Activity named, saved, reopened, edited and deleted.
- Related word added, read back and removed with saves between changes.
- Both newly downloaded HTML files opened and played.
- Health response visibly shows HTTP 200; Docker visibly runs the app.
- Actual check results and inspectable Git history shown.
- AI acknowledgement and required submission documents completed.

## Accuracy notes for preparation — do not read aloud

- The dictionary supplies curated vocabulary and teacher-entered content, not automatic pronunciation for arbitrary words. Teachers still need to review phonemes and dialect choices.
- Dictionary changes do not automatically alter existing saved activities.
- Word Search saves selected words and grid size, not a frozen copy of its preview grid. A download can have a different arrangement.
- Word Search now builds its preview from the checked words. Generation returns a complete puzzle or reports that the selection cannot fit; it does not silently omit targets. For a visible validation example, a custom word longer than the grid produces a message asking for a larger grid or removal of that word.
- Automated accessibility tests do not establish that every custom phoneme has a useful tooltip. Check the exact files you will show.
- No captions file was present at the previous readiness check. Show the About video, but do not claim it has captions unless they have been added and verified.
- The spoken sections describe a successful demonstration. Only make claims about passing checks, GitHub or archive contents when the visible evidence supports them.
