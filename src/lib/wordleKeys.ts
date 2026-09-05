const PHONEME_BANK = ["b", "d", "f", "g", "k", "l", "m", "n", "p", "r", "s", "t", "z", "θ", "ʃ", "tʃ", "dʒ", "ŋ", "ɪ", "æ", "ɒ", "ʊ", "ʌ", "iː", "uː", "aː", "eə", "eɪ"];

const PHONEME_HINTS: Record<string, string> = {
  b: "B as in book", d: "D as in dog", f: "F as in fish", g: "G as in dog", k: "K as in kite", l: "L as in look", m: "M as in map", n: "N as in nose", p: "P as in pen", r: "R as in ring", s: "S as in sun", t: "T as in top", z: "Z as in cheese",
  θ: "TH as in thin", ʃ: "SH as in ship", tʃ: "CH as in chip", dʒ: "J as in jump", ŋ: "NG as in sing", ɪ: "I as in sit", æ: "A as in cat", ɒ: "O as in dog", ʊ: "OO as in book", ʌ: "U as in sun", iː: "EE as in tree", uː: "OO as in moon", aː: "AR as in bath", eə: "AIR as in chair", eɪ: "AI as in train",
};

export function phonemeHint(sound: string) {
  return PHONEME_HINTS[sound] ?? `Phoneme /${sound}/`;
}

function hash(value: string) {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}

function shuffled<T>(values: T[], seedText: string) {
  const result = [...values];
  let seed = hash(seedText);
  for (let index = result.length - 1; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swap = seed % (index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function buildWordleKeys(target: string[], keyCount: number, seedText: string) {
  const uniqueTarget = [...new Set(target)];
  const distractors = shuffled(PHONEME_BANK.filter((sound) => !uniqueTarget.includes(sound)), `${seedText}-distractors`)
    .slice(0, Math.max(0, keyCount - uniqueTarget.length));
  return shuffled([...uniqueTarget, ...distractors], `${seedText}-keyboard`);
}
