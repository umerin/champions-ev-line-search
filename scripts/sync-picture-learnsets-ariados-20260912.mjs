import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoDir = process.cwd();
const entriesDir = path.join(repoDir, "records", "champions-pokemon", "entries");
const pokemonPath = path.join(repoDir, "data", "pokemon.json");
const movesPath = path.join(repoDir, "data", "moves.json");
const learnsetsPath = path.join(repoDir, "data", "learnsets.json");
const pictureSource = "local-input/picture/アリアドス（スクリーンショット12枚）";

const pokemon = JSON.parse(fs.readFileSync(pokemonPath, "utf8"));
const moves = JSON.parse(fs.readFileSync(movesPath, "utf8"));
const learnsets = JSON.parse(fs.readFileSync(learnsetsPath, "utf8"));
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

// 変化技・固定ダメージ技など、ダメージ検索の技マスターにない技も
// 個別記録には残す。検索対象にはしない。
const specialMoves = new Map([
  special("scary-face", "こわいかお"),
  special("focus-energy", "きあいだめ"),
  special("screech", "いやなおと"),
  special("disable", "かなしばり"),
  special("swords-dance", "つるぎのまい", "normal", "status", ["dance"]),
  special("sticky-web", "ねばねばネット", "bug"),
  special("rage-powder", "いかりのこな", "bug", "status", ["powder"]),
  special("string-shot", "いとをはく", "bug"),
  special("toxic-thread", "どくのいと", "poison"),
  special("toxic-spikes", "どくびし", "poison"),
  special("toxic", "どくどく", "poison"),
  special("agility", "こうそくいどう", "psychic"),
  special("night-shade", "ナイトヘッド", "ghost", "special"),
  special("spite", "うらみ", "ghost"),
].map((move) => [move.id, move]));

const verifiedIds = [
  "giga-impact", "body-slam", "facade", "hyper-beam", "round", "snore",
  "baton-pass", "sleep-talk", "endure", "protect", "substitute", "focus-energy",
  "scary-face", "screech", "disable", "swords-dance", "trailblaze", "solar-beam",
  "giga-drain", "sunny-day", "electroweb", "megahorn", "first-impression", "lunge",
  "x-scissor", "leech-life", "skitter-smack", "bug-bite", "pounce", "fell-stinger",
  "pin-missile", "bug-buzz", "struggle-bug", "infestation", "sticky-web", "rage-powder",
  "string-shot", "bounce", "poison-jab", "cross-poison", "sludge-wave", "sludge-bomb",
  "venoshock", "acid-spray", "toxic-thread", "toxic-spikes", "toxic", "dig",
  "stomping-tantrum", "psychic", "rest", "agility", "shadow-sneak", "hex",
  "night-shade", "spite", "foul-play", "throat-chop", "night-slash", "sucker-punch",
  "knock-off", "assurance", "thief", "smart-strike",
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

const entry = pokemon.find((item) => item.id === "ariados");
if (!entry) throw new Error("ariados が data/pokemon.json にありません");
entry.championsTarget = true;
fs.writeFileSync(pokemonPath, `${JSON.stringify(pokemon, null, 2)}\n`);

execFileSync(process.execPath, [path.join(repoDir, "scripts", "initialize-champions-pokemon-records.mjs")], {
  cwd: repoDir,
  stdio: "inherit",
});

const entryPath = path.join(entriesDir, "ariados.json");
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
    `ゲーム内の「教える技」一覧をスクリーンショット12枚で確認（全${verifiedIds.length}技）。`,
    `耐久ラインサーチには固定威力の攻撃技${searchableIds.length}件だけを同期。変化技・固定ダメージ技は個別記録のみに保存。`,
  ],
};
fs.writeFileSync(entryPath, `${JSON.stringify(record, null, 2)}\n`);
learnsets.ariados = searchableIds;

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
