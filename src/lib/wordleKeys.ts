const PHONEME_BANK = ["b", "d", "f", "g", "k", "l", "m", "n", "p", "r", "s", "t", "z", "θ", "ʃ", "tʃ", "dʒ", "ŋ", "ɪ", "æ", "ɒ", "ʊ", "ʌ", "iː", "uː", "aː", "eə", "eɪ"];

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
