import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoDir = process.cwd();
const entriesDir = path.join(repoDir, "records", "champions-pokemon", "entries");
const pokemonPath = path.join(repoDir, "data", "pokemon.json");
const movesPath = path.join(repoDir, "data", "moves.json");
const learnsetsPath = path.join(repoDir, "data", "learnsets.json");
const pictureSource = "local-input/picture/インテレオン（スクリーンショット10枚）";

const pokemon = JSON.parse(fs.readFileSync(pokemonPath, "utf8"));
const moves = JSON.parse(fs.readFileSync(movesPath, "utf8"));
const learnsets = JSON.parse(fs.readFileSync(learnsetsPath, "utf8"));

// 「なげつける」は持ち物依存で通常のダメージ検索には使わないが、
// チャンピオンズに登場する技として技マスターには登録する。
if (!moves.some((move) => move.id === "fling")) {
  moves.push({
    id: "fling",
    name: {
      en: "Fling",
      ja: "なげつける",
      jaHrkt: "なげつける",
    },
    championsTarget: true,
    type: "dark",
    category: "physical",
    power: 0,
    isSpreadMove: false,
    isContactMove: false,
    moveCategories: [],
    searchable: false,
  });
}
const moveById = new Map(moves.map((move) => [move.id, move]));

const special = (
  id,
  name,
  type = "normal",
  category = "status",
  moveCategories = [],
  isContactMove = false,
) => ({
  id,
  name,
  type,
  category,
  power: 0,
  searchable: false,
  isContactMove,
  moveCategories,
});

const specialMoves = new Map([
  special("psych-up", "じこあんじ"),
  special("focus-energy", "きあいだめ"),
  special("double-team", "かげぶんしん"),
  special("swords-dance", "つるぎのまい", "normal", "status", ["dance"]),
  special("soak", "みずびたし", "water"),
  special("aqua-ring", "アクアリング", "water"),
  special("snowscape", "ゆきげしき", "ice"),
  special("haze", "くろいきり", "ice"),
  special("reflect", "リフレクター", "psychic"),
  special("light-screen", "ひかりのかべ", "psychic"),
  special("agility", "こうそくいどう", "psychic"),
  special("taunt", "ちょうはつ", "dark"),
].map((move) => [move.id, move]));

const verifiedIds = [
  "bind", "hyper-beam", "round", "weather-ball", "snore", "tearful-look",
  "psych-up", "baton-pass", "sleep-talk", "endure", "protect", "substitute",
  "focus-energy", "double-team", "swords-dance", "liquidation", "dive", "waterfall",
  "flip-turn", "aqua-jet", "hydro-cannon", "hydro-pump", "muddy-water", "surf",
  "snipe-shot", "scald", "water-pulse", "chilling-water", "whirlpool", "soak",
  "aqua-ring", "rain-dance", "skitter-smack", "u-turn", "fell-stinger", "bounce",
  "acrobatics", "air-slash", "air-cutter", "smack-down", "mud-shot", "ice-shard",
  "icicle-spear", "blizzard", "ice-beam", "icy-wind", "snowscape", "haze",
  "vacuum-wave", "rest", "reflect", "light-screen", "agility", "shadow-ball",
  "breaking-swipe", "scale-shot", "sucker-punch", "fling", "dark-pulse", "taunt",
];

function resolveMove(id) {
  if (moveById.has(id)) return { kind: "master", move: moveById.get(id) };
  if (specialMoves.has(id)) return { kind: "special", move: specialMoves.get(id) };
  throw new Error(`Unknown move id: ${id}`);
}

const resolved = verifiedIds.map(resolveMove);
const masterIds = resolved.filter(({ kind }) => kind === "master").map(({ move }) => move.id);
const recordOnlyMoves = resolved.filter(({ kind }) => kind === "special").map(({ move }) => move);
const searchableIds = masterIds.filter((id) => {
  const move = moveById.get(id);
  return move.searchable !== false
    && move.power > 0
    && ["physical", "special"].includes(move.category);
});

const entry = pokemon.find((item) => item.id === "inteleon");
if (!entry) throw new Error("inteleon が data/pokemon.json にありません");
entry.championsTarget = true;
fs.writeFileSync(pokemonPath, `${JSON.stringify(pokemon, null, 2)}\n`);

// Create the new AI-editable record and refresh its index before writing the verified data.
execFileSync(process.execPath, [path.join(repoDir, "scripts", "initialize-champions-pokemon-records.mjs")], {
  cwd: repoDir,
  stdio: "inherit",
});

// 以前は個別記録だけに保存していたため、既存記録も技マスター側へ移行する。
for (const fileName of fs.readdirSync(entriesDir).filter((name) => name.endsWith(".json"))) {
  const existingPath = path.join(entriesDir, fileName);
  const existing = JSON.parse(fs.readFileSync(existingPath, "utf8"));
  const specialMoveIds = existing.learnset?.specialMoves ?? [];
  if (!specialMoveIds.some((move) => move.id === "fling")) continue;
  existing.learnset.specialMoves = specialMoveIds.filter((move) => move.id !== "fling");
  existing.learnset.moveIds = [...new Set([...(existing.learnset.moveIds ?? []), "fling"])];
  fs.writeFileSync(existingPath, `${JSON.stringify(existing, null, 2)}\n`);
}

const entryPath = path.join(entriesDir, "inteleon.json");
const record = JSON.parse(fs.readFileSync(entryPath, "utf8"));
const previous = [
  ...(record.learnset.moveIds ?? []),
  ...(record.learnset.specialMoves ?? []).map((move) => move.id),
];

record.pokemon = entry;
record.learnset.moveIds = masterIds;
record.learnset.specialMoves = recordOnlyMoves;
record.learnset.verification = {
  status: "verified",
  sources: [pictureSource],
  verifiedMoveIds: verifiedIds,
  rejectedMoveIds: previous.filter((id) => !verifiedIds.includes(id)).sort(),
  notes: [
    "ゲーム内の「教える技」一覧をスクリーンショット10枚で全件確認（全60技）。",
    `耐久ラインサーチには固定威力の攻撃技${searchableIds.length}件だけを同期。変化技は個別記録のみに保存。`,
  ],
};
fs.writeFileSync(entryPath, `${JSON.stringify(record, null, 2)}\n`);
learnsets.inteleon = searchableIds;

for (const id of masterIds) moveById.get(id).championsTarget = true;
fs.writeFileSync(movesPath, `${JSON.stringify(moves, null, 2)}\n`);
fs.writeFileSync(learnsetsPath, `${JSON.stringify(learnsets, null, 2)}\n`);

console.log(JSON.stringify({
  pokemon: entry.id,
  championsTarget: entry.championsTarget,
  verifiedMoves: verifiedIds.length,
  searchMoves: searchableIds.length,
  recordOnlyMoves: recordOnlyMoves.length,
  source: pictureSource,
}, null, 2));
