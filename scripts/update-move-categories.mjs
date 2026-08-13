import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const movePath = resolve(rootDir, "data/moves.json");
const sourceUrl = "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/moves.ts";
const categories = [
  "bite",
  "bullet",
  "charge",
  "dance",
  "defrost",
  "distance",
  "heal",
  "powder",
  "pulse",
  "punch",
  "recharge",
  "slicing",
  "sound",
  "wind",
];

function parseMoveBlocks(source) {
  const blocks = new Map();
  let currentId = null;
  let currentLines = [];

  for (const line of source.split("\n")) {
    const match = line.match(/^\t(?:"([a-z0-9-]+)"|([a-z0-9-]+)): \{$/);
    if (match) {
      if (currentId) blocks.set(currentId, currentLines.join("\n"));
      currentId = match[1] ?? match[2];
      currentLines = [line];
      continue;
    }
    if (currentId) currentLines.push(line);
  }
  if (currentId) blocks.set(currentId, currentLines.join("\n"));
  return blocks;
}

function normalizeMoveId(id) {
  return id.replaceAll("-", "");
}

function getCategories(block) {
  const flagsMatch = block.match(/flags:\s*\{([\s\S]*?)\}/);
  if (!flagsMatch) return [];
  return categories.filter((category) => new RegExp(`\\b${category}\\s*:\\s*1\\b`).test(flagsMatch[1]));
}

function hasFlag(block, flag) {
  const flagsMatch = block.match(/flags:\s*\{([\s\S]*?)\}/);
  return Boolean(flagsMatch && new RegExp(`\\b${flag}\\s*:\\s*1\\b`).test(flagsMatch[1]));
}

const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`技カテゴリの取得に失敗しました: ${response.status}`);
const source = await response.text();
const blocks = parseMoveBlocks(source);
const moveMetadata = new Map([...blocks].map(([id, block]) => [normalizeMoveId(id), {
  categories: getCategories(block),
  isContactMove: hasFlag(block, "contact"),
}]));
const moves = JSON.parse(await readFile(movePath, "utf8"));
const updated = moves.map((move) => {
  const next = {};
  const metadata = moveMetadata.get(normalizeMoveId(move.id));
  const categoriesForMove = metadata?.categories ?? [];
  for (const [key, value] of Object.entries(move)) {
    next[key] = key === "moveCategories" ? categoriesForMove : key === "isContactMove" ? Boolean(metadata?.isContactMove) : value;
    if (key === "isContactMove" && !Object.hasOwn(move, "moveCategories")) {
      next.moveCategories = categoriesForMove;
    }
  }
  if (Object.hasOwn(move, "isContactMove")) next.isContactMove = Boolean(metadata?.isContactMove);
  if (!Object.hasOwn(move, "moveCategories")) next.moveCategories = categoriesForMove;
  return next;
});

await writeFile(movePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  moves: updated.length,
  contactMoves: updated.filter((move) => move.isContactMove).length,
  categorizedMoves: updated.filter((move) => move.moveCategories.length > 0).length,
  categories: Object.fromEntries(categories.map((category) => [
    category,
    updated.filter((move) => move.moveCategories.includes(category)).length,
  ])),
}, null, 2));
