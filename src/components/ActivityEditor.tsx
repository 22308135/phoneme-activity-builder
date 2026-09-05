"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { SavedActivity, SavedWord } from "@/lib/activityTypes";

type EditableWord = SavedWord & { phonemeText: string };
type Editor = { title: string; type: "WORDLE" | "WORD_SEARCH"; difficulty: "FOUNDATION" | "DEVELOPING" | "EXTENDING"; gridSize: number; hintEnabled: boolean; words: EditableWord[] };
const blankWord = (target = false): EditableWord => ({ text: "", phonemes: [], phonemeText: "", hint: "", isTarget: target });
const blankEditor = (type: Editor["type"] = "WORDLE"): Editor => ({ title: "", type, difficulty: "FOUNDATION", gridSize: 7, hintEnabled: true, words: [blankWord(type === "WORDLE")] });
const fromSaved = (activity: SavedActivity): Editor => ({ title: activity.title, type: activity.type, difficulty: activity.difficulty, gridSize: activity.gridSize ?? 7, hintEnabled: activity.hintEnabled, words: activity.words.map((word) => ({ ...word, phonemeText: word.phonemes.join(", ") })) });

export function ActivityEditor({ activityId, initialType = "WORDLE", embedded = false, returnToBuilder }: { activityId?: number; initialType?: Editor["type"]; embedded?: boolean; returnToBuilder?: "/wordle" | "/word-search" }) {
  const router = useRouter();
  const [editor, setEditor] = useState<Editor>(() => blankEditor(initialType));
  const [message, setMessage] = useState(activityId ? "Loading activity…" : "");
  const [busy, setBusy] = useState(Boolean(activityId));
  const [suggesting, setSuggesting] = useState<number | null>(null);
  const [suggestionMessages, setSuggestionMessages] = useState<Record<number, string>>({});
  const suggestionRequests = useRef(new Set<number>());

  useEffect(() => {
    if (!activityId) return;
    fetch(`/api/activities/${activityId}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Could not load activity")))
      .then((activity) => { setEditor(fromSaved(activity)); setMessage(""); setBusy(false); })
      .catch((error) => { setMessage(error.message); setBusy(false); });
  }, [activityId]);

  const updateWord = (index: number, patch: Partial<EditableWord>) => setEditor((current) => ({ ...current, words: current.words.map((word, wordIndex) => wordIndex === index ? { ...word, ...patch } : word) }));
  const suggestWord = async (index: number) => {
    const word = editor.words[index];
    if (!word.text.trim() || suggestionRequests.current.has(index)) return;
    suggestionRequests.current.add(index); setSuggesting(index);
    try {
      const response = await fetch(`/api/word-suggestions?word=${encodeURIComponent(word.text)}`);
      const result = await response.json();
      if (!response.ok) { setSuggestionMessages((current) => ({ ...current, [index]: result.error })); return; }
      setEditor((current) => ({ ...current, words: current.words.map((item, wordIndex) => wordIndex === index ? { ...item, phonemeText: item.phonemeText.trim() || result.phonemes.join(", "), hint: item.hint?.trim() || result.hint } : item) }));
      setSuggestionMessages((current) => ({ ...current, [index]: "Curated suggestion added. Please review before saving." }));
    } catch {
      setSuggestionMessages((current) => ({ ...current, [index]: "Could not load a suggestion." }));
    } finally {
      suggestionRequests.current.delete(index); setSuggesting(null);
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("Saving…");
    const payload = { ...editor, gridSize: editor.type === "WORD_SEARCH" ? editor.gridSize : null, words: editor.words.map(({ text, phonemeText, hint, isTarget }) => ({ text, hint, isTarget: editor.type === "WORDLE" && isTarget, phonemes: phonemeText.split(/[,\s]+/u).map((sound) => sound.trim()).filter(Boolean) })) };
    const response = await fetch(activityId ? `/api/activities/${activityId}` : "/api/activities", { method: activityId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setMessage(result?.issues?.[0]?.message ?? result?.error ?? "Could not save activity"); setBusy(false); return; }
    if (returnToBuilder) { router.push(`${returnToBuilder}?activity=${result.id}`); return; }
    router.push("/activities");
  };

  const activityName = initialType === "WORD_SEARCH" ? "Word Search" : "Wordle";
  return <section id={embedded ? "custom-activity" : undefined} className={embedded ? "inline-activity-editor" : "editor-page"}>
    <div className="editor-page-heading"><div><p className="eyebrow">Activity setup</p><h1>{activityId ? "Edit activity" : embedded ? `Create a custom ${activityName}` : "Create activity"}</h1><p className="lead">Enter custom words and phonemes, then choose how the activity should work.</p></div>{!embedded && <Link className="button secondary" href="/activities">Back to library</Link>}</div>
    <form className="editor-card standalone-editor" onSubmit={save} aria-busy={busy}>
      <label>Activity title<input required maxLength={120} value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></label>
      <div className="form-row">{embedded ? <label>Activity type<span className="activity-type-display">{activityName}</span></label> : <label>Activity type<select value={editor.type} onChange={(event) => { const type = event.target.value as Editor["type"]; setEditor({ ...editor, type, words: editor.words.map((word, index) => ({ ...word, isTarget: type === "WORDLE" && index === 0 })) }); }}><option value="WORDLE">Wordle</option><option value="WORD_SEARCH">Word Search</option></select></label>}
      {editor.type === "WORDLE" ? <label>Difficulty<select value={editor.difficulty} onChange={(event) => setEditor({ ...editor, difficulty: event.target.value as Editor["difficulty"] })}><option value="FOUNDATION">Foundation</option><option value="DEVELOPING">Developing</option><option value="EXTENDING">Extending</option></select></label> : <label>Grid size<select value={editor.gridSize} onChange={(event) => setEditor({ ...editor, gridSize: Number(event.target.value) })}><option value="7">7 × 7</option><option value="8">8 × 8</option><option value="9">9 × 9</option></select></label>}</div>
      <label className="check-row"><input type="checkbox" checked={editor.hintEnabled} onChange={(event) => setEditor({ ...editor, hintEnabled: event.target.checked })} /> Enable hints</label>
      <div className="word-editor-heading"><h2>Words and phonemes</h2><button type="button" className="text-button" onClick={() => setEditor({ ...editor, words: [...editor.words, blankWord()] })}>+ Add word</button></div><p className="field-help">Separate phonemes with spaces or commas. A sound such as tʃ remains one token.</p>
      {editor.words.map((word, index) => <fieldset className="word-editor" key={index}><legend>Word {index + 1}</legend><label>Written word<input required value={word.text} onChange={(event) => { updateWord(index, { text: event.target.value }); setSuggestionMessages((current) => ({ ...current, [index]: "" })); }} onBlur={() => suggestWord(index)} /></label><button type="button" className="suggest-button" disabled={!word.text.trim() || suggesting === index} onClick={() => suggestWord(index)} aria-describedby={`suggestion-${index}`}>{suggesting === index ? "Suggesting…" : `Suggest details for word ${index + 1}`}</button><p id={`suggestion-${index}`} className="suggestion-message" aria-live="polite">{suggestionMessages[index]}</p><label>Ordered phonemes<input required placeholder="tʃ, ɪ, p" value={word.phonemeText} onChange={(event) => updateWord(index, { phonemeText: event.target.value })} /></label><label>Hint<input value={word.hint ?? ""} onChange={(event) => updateWord(index, { hint: event.target.value })} /></label><div className="word-actions">{editor.type === "WORDLE" && <label className="check-row"><input type="radio" name="target" checked={word.isTarget} onChange={() => setEditor({ ...editor, words: editor.words.map((item, itemIndex) => ({ ...item, isTarget: itemIndex === index })) })} /> Target word</label>}<button type="button" className="danger-link" disabled={editor.words.length === 1} onClick={() => setEditor({ ...editor, words: editor.words.filter((_, wordIndex) => wordIndex !== index) })}>Remove</button></div></fieldset>)}
      <div className="form-actions"><button disabled={busy} className="button primary" type="submit">{activityId ? "Save changes" : embedded ? "Save and load preview" : "Create activity"}</button>{!embedded && <Link className="button secondary" href="/activities">Cancel</Link>}</div><p role="status" className="form-message">{message}</p>
    </form>
  </section>;
}
