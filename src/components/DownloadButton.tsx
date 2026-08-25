import { WORD_SEARCH_GRID, WORD_SEARCH_HINTS, WORD_SEARCH_SIZE } from "@/lib/wordSearch";

type Activity = "wordle" | "word-search";
type Difficulty = "Foundation" | "Developing" | "Extending";

const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
export function createGameHtml(activity: Activity, title: string, answer: string, hint: string, words: string[], difficulty: Difficulty, searchGrid = WORD_SEARCH_GRID, searchSize = WORD_SEARCH_SIZE) {
  const searchTargets = JSON.stringify(words.map((word) => word.split(" ")));
  const difficultySettings = { Foundation: { attempts: 6, keys: 6 }, Developing: { attempts: 5, keys: 9 }, Extending: { attempts: 4, keys: 12 } } as const;
  const wordleSettings = difficultySettings[difficulty];
  const hintMarkup = difficulty === "Foundation" ? `<p class="hint">Hint: ${esc(hint)}</p>` : difficulty === "Developing" ? `<button id="hint-button" class="hint-button">Show hint</button><p id="hint" class="hint" hidden>Hint: ${esc(hint)}</p>` : "";
  const target = JSON.stringify(answer.split(" "));
  const game = activity === "wordle"
    ? `${hintMarkup}<p class="level">${difficulty} · ${wordleSettings.attempts} attempts</p><div id="board" class="board" aria-label="Phoneme Wordle board"></div><p id="message" aria-live="polite">Choose the phonemes in order.</p><div id="keyboard" class="keyboard" aria-label="Phoneme keyboard"></div>`
    : `<p class="hint">Search across, down, diagonally and backwards. Click the first and last sound in each word.</p><div id="search-grid" class="grid" aria-label="7 by 7 phoneme word search"></div><p id="message" aria-live="polite">Find all ${words.length} phoneme words.</p><ul id="targets" class="targets"></ul>`;
  const script = activity === "wordle" ? `<script>
const target=${target};const maxAttempts=${wordleSettings.attempts};const answerWord=${JSON.stringify(words[0] ?? "")};const sounds=[...new Set([...target,"θ","ʃ","tʃ","dʒ","ŋ","ɪ","æ","n","p","m","t","k"])].slice(0,${wordleSettings.keys});const soundHints={"θ":"TH as in thin","ʃ":"SH as in ship","tʃ":"CH as in chip","dʒ":"J as in jam","ŋ":"NG as in sing","ɪ":"I as in sit","æ":"A as in cat","n":"N as in nose","p":"P as in pen","m":"M as in map","t":"T as in top","k":"K as in kite"};let row=0;let current=[];let finished=false;
const board=document.getElementById("board");const keyboard=document.getElementById("keyboard");const message=document.getElementById("message");board.style.gridTemplateColumns="repeat("+target.length+",64px)";
for(let i=0;i<maxAttempts*target.length;i++){const cell=document.createElement("div");cell.className="cell";board.appendChild(cell)}
function draw(){for(let column=0;column<target.length;column++){board.children[row*target.length+column].textContent=current[column]?"/"+current[column]+"/":""}}
function add(sound){if(!finished&&row<maxAttempts&&current.length<target.length){current.push(sound);draw()}}
function removeSound(){if(!finished&&row<maxAttempts){current.pop();draw()}}
function enter(){if(finished)return;if(current.length!==target.length){message.textContent="Choose "+target.length+" phonemes first.";return}let won=true;for(let column=0;column<target.length;column++){const sound=current[column];const cell=board.children[row*target.length+column];const state=sound===target[column]?"correct":target.includes(sound)?"present":"absent";cell.classList.add(state);if(state!=="correct")won=false}row++;current=[];finished=won||row===maxAttempts;message.textContent=won?"Completed — the English word is "+answerWord+".":row===maxAttempts?"Finished — the word was "+answerWord+".":"Attempt "+row+" of "+maxAttempts+". Try again.";message.className=won?"completion complete":row===maxAttempts?"completion unsuccessful":""}
sounds.forEach(sound=>{const button=document.createElement("button");button.textContent="/"+sound+"/";button.title="/"+sound+"/ — "+soundHints[sound];button.setAttribute("aria-label","/"+sound+"/, "+soundHints[sound]);button.onclick=()=>add(sound);keyboard.appendChild(button)});[["Enter",enter],["⌫",removeSound]].forEach(item=>{const button=document.createElement("button");button.textContent=item[0];button.className="action";button.onclick=item[1];keyboard.appendChild(button)});
const hintButton=document.getElementById("hint-button");if(hintButton)hintButton.onclick=()=>{document.getElementById("hint").hidden=false;hintButton.remove()};
</script>` : `<script>
const size=${searchSize};const cells=${JSON.stringify(searchGrid.flat())};const targets=${searchTargets};const soundHints=${JSON.stringify(WORD_SEARCH_HINTS)};let start=null;const found=new Set();const foundCells=new Set();
const grid=document.getElementById("search-grid"),message=document.getElementById("message"),list=document.getElementById("targets");
function label(word){return word.map(sound=>"/"+sound+"/").join(" ")}function pathBetween(a,b){const ar=Math.floor(a/size),ac=a%size,br=Math.floor(b/size),bc=b%size,rd=br-ar,cd=bc-ac;if(rd!==0&&cd!==0&&Math.abs(rd)!==Math.abs(cd))return[];const length=Math.max(Math.abs(rd),Math.abs(cd))+1;return Array.from({length},(_,i)=>(ar+Math.sign(rd)*i)*size+ac+Math.sign(cd)*i)}
function renderList(){list.innerHTML="";targets.forEach((word,index)=>{const item=document.createElement("li");item.textContent=label(word);if(found.has(index))item.className="found-word";list.appendChild(item)})}
function choose(index){if(start===null){start=index;grid.children[index].classList.add("selected");message.textContent="Now click the final sound.";return}const path=pathBetween(start,index),chosen=path.map(cell=>cells[cell]).join("|"),reverse=path.map(cell=>cells[cell]).reverse().join("|");const match=targets.findIndex((word,i)=>!found.has(i)&&(word.join("|")===chosen||word.join("|")===reverse));grid.children[start].classList.remove("selected");start=null;if(match<0){message.textContent="That is not a target word. Try again.";return}found.add(match);path.forEach(cell=>{foundCells.add(cell);grid.children[cell].classList.add("found")});renderList();const complete=found.size===targets.length;message.textContent=complete?"Completed — you found every phoneme word!":found.size+" of "+targets.length+" words found.";message.className=complete?"completion complete":""}
cells.forEach((sound,index)=>{const button=document.createElement("button");button.textContent="/"+sound+"/";button.title="/"+sound+"/ — "+soundHints[sound];button.setAttribute("aria-label","/"+sound+"/, "+soundHints[sound]);button.onclick=()=>choose(index);grid.appendChild(button)});renderList();
</script>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;background:#121213;color:#fff;max-width:720px;margin:0 auto;padding:2rem 1rem;text-align:center}h1{margin:0 0 1.5rem}.hint{background:#24252a;padding:1rem;border-radius:.5rem}.board{display:grid;gap:7px;width:max-content;margin:28px auto}.cell{width:64px;height:64px;border:2px solid #3a3a3c;display:grid;place-items:center;font-size:1.1rem;font-weight:bold}.correct{background:#538d4e;border-color:#538d4e}.present{background:#b59f3b;border-color:#b59f3b}.absent{background:#3a3a3c}.keyboard{display:flex;justify-content:center;gap:7px;flex-wrap:wrap;margin:28px auto;max-width:620px}.keyboard button{height:56px;min-width:52px;padding:0 10px;border:0;border-radius:5px;background:#818384;color:white;font-weight:bold;font-size:1rem;cursor:pointer}.keyboard .action{min-width:76px}.grid{display:grid;grid-template-columns:repeat(${searchSize},1fr);gap:.4rem;max-width:490px;margin:2rem auto}.grid button{aspect-ratio:1;border:2px solid #555;background:#24252a;color:#fff;padding:.35rem;text-align:center;cursor:pointer}.grid button.selected{outline:3px solid #b59f3b}.grid button.found{background:#538d4e;border-color:#538d4e}.targets{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;list-style:none;padding:0}.targets li{padding:8px;background:#24252a}.targets .found-word{background:#538d4e;text-decoration:line-through}.completion{padding:12px 16px;font-weight:bold;border:2px solid #555}.completion.complete{background:#538d4e;border-color:#538d4e}.completion.unsuccessful{background:#7a3f31;border-color:#a65b42}.reset{margin:18px 0;padding:11px 18px;border:1px solid #777;background:#24252a;color:#fff;font-weight:bold;cursor:pointer}</style></head><body><h1>${esc(title)}</h1>${game}<button class="reset" type="button" onclick="location.reload()">Reset activity</button><hr><small>Created with Phoneme Play Builder</small>${script}</body></html>`;
}

export function DownloadButton({ activity, answer, hint, words, difficulty = "Foundation", searchGrid = WORD_SEARCH_GRID, searchSize = WORD_SEARCH_SIZE, savedActivityId }: { activity: Activity; answer: string; hint: string; words: string[]; difficulty?: Difficulty; searchGrid?: string[][]; searchSize?: number; savedActivityId?: number }) {
  const download = () => {
    if (savedActivityId) {
      const link = document.createElement("a");
      link.href = `/api/activities/${savedActivityId}/download`;
      link.click();
      return;
    }
    const title = activity === "wordle" ? "Phoneme Wordle" : "Phoneme Word Search";
    const html = createGameHtml(activity, title, answer, hint, words, difficulty, searchGrid, searchSize);
    const filename = `${activity}-phoneme-activity.html`;
    const form = document.createElement("form");
    const htmlField = document.createElement("textarea");

    form.method = "POST";
    form.action = `/api/download?filename=${encodeURIComponent(filename)}`;
    form.style.display = "none";
    htmlField.name = "html";
    htmlField.value = html;
    form.appendChild(htmlField);
    document.body.appendChild(form);
    form.submit();
    window.setTimeout(() => form.remove(), 1000);
  };
  return <button type="button" className="button primary" onClick={download}>{savedActivityId ? "Download saved activity" : "Generate & download HTML"} <span aria-hidden="true">↓</span></button>;
}
