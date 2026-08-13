import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const dataDir = resolve(rootDir, "data");
const recordsDir = resolve(rootDir, "records/champions-pokemon");
const entriesDir = resolve(recordsDir, "entries");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const [pokemon, moves, index, filenames] = await Promise.all([
  readJson(resolve(dataDir, "pokemon.json")),
  readJson(resolve(dataDir, "moves.json")),
  readJson(resolve(recordsDir, "index.json")),
  readdir(entriesDir),
]);

const expectedPokemon = pokemon.filter((entry) => entry.championsTarget === true);
const expectedIds = new Set(expectedPokemon.map((entry) => entry.id));
const moveIds = new Set(moves.map((move) => move.id));
const recordFiles = filenames.filter((name) => name.endsWith(".json"));
const seenIds = new Set();
let learnedPairs = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(index.count === expectedPokemon.length, `index.json: countが不正です (${index.count})`);
assert(index.entries.length === expectedPokemon.length, "index.json: entries件数が不正です。");
assert(recordFiles.length === expectedPokemon.length, `記録ファイル数が不正です (${recordFiles.length})`);

for (const item of index.entries) {
  assert(expectedIds.has(item.id), `index.json: 対象外または未知のID ${item.id}`);
  assert(!seenIds.has(item.id), `index.json: ID重複 ${item.id}`);
  seenIds.add(item.id);

  const record = await readJson(resolve(recordsDir, item.path));
  assert(record.schemaVersion === 1, `${item.id}: schemaVersionが不正です。`);
  assert(record.pokemon?.id === item.id, `${item.id}: pokemon.idが一致しません。`);
  assert(record.pokemon.championsTarget === true, `${item.id}: championsTargetがtrueではありません。`);
  assert(record.weight && typeof record.weight === "object" && !Array.isArray(record.weight), `${item.id}: weightがありません。`);
  assert(record.weight.kg === null || (Number.isFinite(record.weight.kg) && record.weight.kg >= 0), `${item.id}: weight.kgが不正です。`);
  assert(["not-recorded", "checking", "partially-verified", "verified"].includes(record.weight.verification?.status), `${item.id}: weightの検証状況が不正です。`);
  assert(Array.isArray(record.weight.verification.sources), `${item.id}: weightの根拠が配列ではありません。`);
  assert(Array.isArray(record.weight.verification.notes), `${item.id}: weightのメモが配列ではありません。`);
  assert(Array.isArray(record.abilities), `${item.id}: abilitiesが配列ではありません。`);
  assert(Array.isArray(record.learnset?.moveIds), `${item.id}: learnset.moveIdsがありません。`);
  assert(Array.isArray(record.learnset?.specialMoves), `${item.id}: learnset.specialMovesがありません。`);
  const specialMoveIds = new Set();
  for (const move of record.learnset.specialMoves) {
    assert(move && typeof move === "object" && typeof move.id === "string" && move.id, `${item.id}: 特殊技データが不正です。`);
    assert(!moveIds.has(move.id), `${item.id}: 特殊技 ${move.id} はmoves.jsonに登録しないでください。`);
    assert(!specialMoveIds.has(move.id), `${item.id}: 特殊技ID重複 ${move.id}`);
    specialMoveIds.add(move.id);
  }
  assert(Array.isArray(record.battleEffects), `${item.id}: battleEffectsが配列ではありません。`);

  const learned = new Set();
  for (const moveId of record.learnset.moveIds) {
    assert(moveIds.has(moveId), `${item.id}: 未知の技ID ${moveId}`);
    assert(!learned.has(moveId), `${item.id}: 技ID重複 ${moveId}`);
    learned.add(moveId);
    learnedPairs += 1;
  }
}

for (const expectedId of expectedIds) {
  assert(seenIds.has(expectedId), `index.json: ${expectedId} がありません。`);
}

console.log(JSON.stringify({
  records: seenIds.size,
  learnedPairs,
  status: "ok",
}, null, 2));
