export type WordSuggestion = {
  phonemes: string[];
  hint: string;
};

const suggestions: Record<string, WordSuggestion> = {
  bath: { phonemes: ["b", "aː", "θ"], hint: "A place to wash in water" },
  book: { phonemes: ["b", "ʊ", "k"], hint: "Something with pages to read" },
  cat: { phonemes: ["k", "æ", "t"], hint: "A small animal that says meow" },
  chair: { phonemes: ["tʃ", "eə"], hint: "Something you sit on" },
  cheese: { phonemes: ["tʃ", "iː", "z"], hint: "A food made from milk" },
  chip: { phonemes: ["tʃ", "ɪ", "p"], hint: "A small piece" },
  chop: { phonemes: ["tʃ", "ɒ", "p"], hint: "To cut into pieces" },
  dog: { phonemes: ["d", "ɒ", "g"], hint: "An animal that may bark" },
  duck: { phonemes: ["d", "ʌ", "k"], hint: "A bird that swims and quacks" },
  fish: { phonemes: ["f", "ɪ", "ʃ"], hint: "An animal that lives in water" },
  frog: { phonemes: ["f", "r", "ɒ", "g"], hint: "A small animal that jumps" },
  jump: { phonemes: ["dʒ", "ʌ", "m", "p"], hint: "To push off the ground" },
  look: { phonemes: ["l", "ʊ", "k"], hint: "To use your eyes" },
  moon: { phonemes: ["m", "uː", "n"], hint: "A bright object seen in the night sky" },
  ring: { phonemes: ["r", "ɪ", "ŋ"], hint: "A small band worn on a finger" },
  sheep: { phonemes: ["ʃ", "iː", "p"], hint: "A farm animal with wool" },
  ship: { phonemes: ["ʃ", "ɪ", "p"], hint: "A large boat" },
  shop: { phonemes: ["ʃ", "ɒ", "p"], hint: "A place where things are sold" },
  sing: { phonemes: ["s", "ɪ", "ŋ"], hint: "To make music with your voice" },
  sun: { phonemes: ["s", "ʌ", "n"], hint: "The star that lights the daytime sky" },
  thick: { phonemes: ["θ", "ɪ", "k"], hint: "Not thin" },
  thin: { phonemes: ["θ", "ɪ", "n"], hint: "Not thick" },
  thing: { phonemes: ["θ", "ɪ", "ŋ"], hint: "An object without a specific name" },
  three: { phonemes: ["θ", "r", "iː"], hint: "The number after two" },
  train: { phonemes: ["t", "r", "eɪ", "n"], hint: "A vehicle that travels on tracks" },
  tree: { phonemes: ["t", "r", "iː"], hint: "A tall plant with a trunk and branches" },
};

export function findWordSuggestion(word: string) {
  return suggestions[word.trim().toLocaleLowerCase("en-AU")] ?? null;
}

export function suggestionCount() {
  return Object.keys(suggestions).length;
}
