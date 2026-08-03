import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const outputDir = process.cwd();
const repoDir = path.resolve(outputDir, "../..");
const dataDir = path.join(repoDir, "data");
const workbookPath = path.join(outputDir, "pokemon-data-editor2.xlsm");
const pokemonPath = path.join(dataDir, "pokemon.json");
const movesPath = path.join(dataDir, "moves.json");
const availabilityPath = path.join(dataDir, "champions-availability.json");

const compact = (value) => String(value ?? "").trim();
const normalize = (value) => compact(value).toLowerCase();
const isEnabled = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["1", "true", "yes", "on"].includes(normalize(value));
};
const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

function getRowsByHeaders(sheetName, requiredHeaders) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const values = sheet.getUsedRange()?.values ?? [];
  const headerIndex = values.findIndex((row) => {
    const headers = row.map(normalize);
    return requiredHeaders.every((header) => headers.includes(normalize(header)));
  });
  if (headerIndex < 0) throw new Error(`${sheetName}: ${requiredHeaders.join(", ")} の見出しが見つかりません。`);
  const headers = values[headerIndex].map(normalize);
  const indexes = Object.fromEntries(requiredHeaders.map((header) => [header, headers.indexOf(normalize(header))]));
  return values.slice(headerIndex + 1).map((row, index) => ({
    rowNumber: headerIndex + index + 2,
    values: Object.fromEntries(requiredHeaders.map((header) => [header, row[indexes[header]]])),
  }));
}

const pokemonRows = getRowsByHeaders("ポケモン一覧", [
  "ポケモンID", "表示名", "チャンピオンズ対象", "英名", "タイプ1_ID", "タイプ2_ID",
  "HP", "攻撃", "防御", "特攻", "特防", "素早さ", "最終進化",
]);
const moveRows = getRowsByHeaders("技一覧", [
  "技ID", "技名", "チャンピオンズ対象", "英名", "タイプ_ID", "威力", "分類_ID", "技範囲",
]);
const learnedCurrentRows = getRowsByHeaders("覚える技_現在", ["ポケモンID", "技ID", "習得"]);
const learnedAdditionalRows = getRowsByHeaders("覚える技_追加", ["ポケモンID", "技ID", "習得"]);

const pokemon = pokemonRows
  .filter(({ values }) => compact(values["ポケモンID"]))
  .map(({ values, rowNumber }) => {
    const id = compact(values["ポケモンID"]);
    const displayName = compact(values["表示名"]) || id;
    return {
      id,
      displayName,
      name: {
        en: compact(values["英名"]) || id,
        ja: displayName,
        jaHrkt: displayName,
      },
      types: [values["タイプ1_ID"], values["タイプ2_ID"]].map(compact).filter(Boolean),
      baseStats: {
        hp: toNumber(values.HP),
        atk: toNumber(values["攻撃"]),
        def: toNumber(values["防御"]),
        spa: toNumber(values["特攻"]),
        spd: toNumber(values["特防"]),
        spe: toNumber(values["素早さ"]),
      },
      isFinalEvolution: isEnabled(values["最終進化"]),
      championsTarget: isEnabled(values["チャンピオンズ対象"]),
      sourceRow: rowNumber,
    };
  });

const movesWithoutUsers = moveRows
  .filter(({ values }) => compact(values["技ID"]))
  .map(({ values, rowNumber }) => {
    const id = compact(values["技ID"]);
    const name = compact(values["技名"]) || id;
    return {
      id,
      name: {
        en: compact(values["英名"]) || id,
        ja: name,
        jaHrkt: name,
      },
      type: compact(values["タイプ_ID"]),
      category: compact(values["分類_ID"]),
      power: toNumber(values["威力"]),
      isSpreadMove: compact(values["技範囲"]).includes("複数"),
      championsTarget: isEnabled(values["チャンピオンズ対象"]),
      sourceRow: rowNumber,
    };
  });

function assertUnique(entries, label) {
  const seen = new Set();
  const duplicates = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) duplicates.push(entry.id);
    seen.add(entry.id);
  }
  if (duplicates.length) throw new Error(`${label}に重複IDがあります: ${duplicates.slice(0, 10).join(", ")}`);
}

assertUnique(pokemon, "ポケモン一覧");
assertUnique(movesWithoutUsers, "技一覧");
const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
const moveById = new Map(movesWithoutUsers.map((entry) => [entry.id, entry]));

const learnedPairs = new Map();
const pairKey = (pokemonId, moveId) => `${pokemonId}\t${moveId}`;
const addLearnedPair = (pokemonId, moveId, source) => {
  if (!pokemonById.has(pokemonId)) throw new Error(`${source}: 未知のポケモンID ${pokemonId}`);
  if (!moveById.has(moveId)) throw new Error(`${source}: 未知の技ID ${moveId}`);
  learnedPairs.set(pairKey(pokemonId, moveId), { pokemonId, moveId });
};
const removeLearnedPair = (pokemonId, moveId) => learnedPairs.delete(pairKey(pokemonId, moveId));

for (const { values, rowNumber } of learnedCurrentRows) {
  const pokemonId = compact(values["ポケモンID"]);
  const moveId = compact(values["技ID"]);
  if (!pokemonId && !moveId) continue;
  if (!pokemonId || !moveId) throw new Error(`覚える技_現在 ${rowNumber}行目: ポケモンIDと技IDが必要です。`);
  if (isEnabled(values["習得"])) addLearnedPair(pokemonId, moveId, `覚える技_現在 ${rowNumber}行目`);
  else {
    if (!pokemonById.has(pokemonId)) throw new Error(`覚える技_現在 ${rowNumber}行目: 未知のポケモンID ${pokemonId}`);
    if (!moveById.has(moveId)) throw new Error(`覚える技_現在 ${rowNumber}行目: 未知の技ID ${moveId}`);
    removeLearnedPair(pokemonId, moveId);
  }
}
for (const { values, rowNumber } of learnedAdditionalRows) {
  const pokemonId = compact(values["ポケモンID"]);
  const moveId = compact(values["技ID"]);
  if (!pokemonId && !moveId) continue;
  if (!pokemonId || !moveId) throw new Error(`覚える技_追加 ${rowNumber}行目: ポケモンIDと技IDが必要です。`);
  if (isEnabled(values["習得"])) addLearnedPair(pokemonId, moveId, `覚える技_追加 ${rowNumber}行目`);
}

const usersByMove = new Map(movesWithoutUsers.map((move) => [move.id, []]));
for (const { pokemonId, moveId } of learnedPairs.values()) usersByMove.get(moveId).push(pokemonId);
const moves = movesWithoutUsers.map(({ championsTarget, sourceRow, ...move }) => ({
  ...move,
  users: usersByMove.get(move.id) ?? [],
}));
const pokemonOutput = pokemon.map(({ championsTarget, sourceRow, ...entry }) => entry);

const availability = await readJson(availabilityPath);
availability.description = "pokemon-data-editor2.xlsmを正本として、ポケモン・技・習得技のデータとチャンピオンズ対象を取り込んだデータ。";
availability.source = {
  name: "pokemon-data-editor2.xlsm",
  file: "outputs/pokemon-data-editor-20260803/pokemon-data-editor2.xlsm",
  importedAt: new Date().toISOString().slice(0, 10),
  note: "ポケモン一覧・技一覧・覚える技_現在・覚える技_追加を参照。メガ形態もシートの対象列をそのまま使用する。",
};
availability.restrictPokemon = true;
availability.pokemon = pokemon.filter((entry) => entry.championsTarget).map((entry) => entry.id);
availability.restrictMoves = true;
availability.moves = movesWithoutUsers.filter((entry) => entry.championsTarget).map((entry) => entry.id);

await fs.writeFile(pokemonPath, `${JSON.stringify(pokemonOutput, null, 2)}\n`);
await fs.writeFile(movesPath, `${JSON.stringify(moves, null, 2)}\n`);
await fs.writeFile(availabilityPath, `${JSON.stringify(availability, null, 2)}\n`);

console.log(JSON.stringify({
  workbookPath,
  pokemon: pokemonOutput.length,
  moves: moves.length,
  learnedPairs: learnedPairs.size,
  enabledPokemon: availability.pokemon.length,
  enabledMoves: availability.moves.length,
  matchaGotcha: moves.find((move) => move.id === "matcha-gotcha"),
}, null, 2));
