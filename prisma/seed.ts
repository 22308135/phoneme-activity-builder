import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (await prisma.activity.count()) return;

  await prisma.activity.create({
    data: {
      title: "Foundation phoneme Wordle",
      type: "WORDLE",
      difficulty: "FOUNDATION",
      words: {
        create: [
          { text: "thin", phonemes: JSON.stringify(["θ", "ɪ", "n"]), hint: "A slim shape or object", isTarget: true },
          { text: "ship", phonemes: JSON.stringify(["ʃ", "ɪ", "p"]), hint: "It travels on water", position: 1 },
          { text: "chip", phonemes: JSON.stringify(["tʃ", "ɪ", "p"]), hint: "A small piece, or a snack", position: 2 },
        ],
      },
    },
  });

  await prisma.activity.create({
    data: {
      title: "Mixed phoneme Word Search",
      type: "WORD_SEARCH",
      gridSize: 7,
      words: {
        create: [
          { text: "thin", phonemes: JSON.stringify(["θ", "ɪ", "n"]), hint: "A slim shape or object" },
          { text: "ship", phonemes: JSON.stringify(["ʃ", "ɪ", "p"]), hint: "It travels on water", position: 1 },
          { text: "chip", phonemes: JSON.stringify(["tʃ", "ɪ", "p"]), hint: "A small piece, or a snack", position: 2 },
          { text: "jam", phonemes: JSON.stringify(["dʒ", "æ", "m"]), hint: "A fruit spread", position: 3 },
          { text: "sing", phonemes: JSON.stringify(["s", "ɪ", "ŋ"]), hint: "Make music with your voice", position: 4 },
        ],
      },
    },
  });
}

main().finally(() => prisma.$disconnect());
