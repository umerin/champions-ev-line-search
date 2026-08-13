import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const dataDir = resolve(rootDir, "data");
const recordsDir = resolve(rootDir, "records/champions-pokemon");
const apiBase = "https://pokeapi.co/api/v2/pokemon";
const concurrency = 8;
const retrievedAt = new Date().toISOString();

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const [pokemon, index] = await Promise.all([
  readJson(resolve(dataDir, "pokemon.json")),
  readJson(resolve(recordsDir, "index.json")),
]);

const targets = pokemon.filter((entry) => entry.championsTarget === true);
const recordPathById = new Map(index.entries.map((entry) => [entry.id, resolve(recordsDir, entry.path)]));

function parseId(url) {
  return Number(url.replace(/\/$/, "").split("/").at(-1));
}

function normalizeStats(stats) {
  const values = Object.fromEntries(stats.map((entry) => [entry.stat.name, entry.base_stat]));
  return {
    hp: values.hp,
    atk: values.attack,
    def: values.defense,
    spa: values["special-attack"],
    spd: values["special-defense"],
    spe: values.speed,
  };
}

async function fetchPokemon(entry) {
  const url = `${apiBase}/${entry.id}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const data = await response.json();
  return {
    id: entry.id,
    url,
    dexNumber: parseId(data.species.url),
    types: data.types.sort((a, b) => a.slot - b.slot).map((item) => item.type.name),
    baseStats: normalizeStats(data.stats),
    weightKg: data.weight / 10,
    abilities: data.abilities
      .sort((a, b) => a.slot - b.slot)
      .map((item) => ({
        id: item.ability.name,
        slot: item.slot,
        isHidden: item.is_hidden,
      })),
  };
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

const snapshots = await mapLimit(targets, concurrency, fetchPokemon);
let updatedPokemon = 0;
let updatedRecords = 0;
let changedCoreValues = 0;

const snapshotById = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
const nextPokemon = pokemon.map((entry) => {
  const snapshot = snapshotById.get(entry.id);
  if (!snapshot) return entry;
  const changed = entry.dexNumber !== snapshot.dexNumber
    || JSON.stringify(entry.types) !== JSON.stringify(snapshot.types)
    || JSON.stringify(entry.baseStats) !== JSON.stringify(snapshot.baseStats);
  if (changed) changedCoreValues += 1;
  updatedPokemon += 1;
  return {
    ...entry,
    dexNumber: snapshot.dexNumber,
    types: snapshot.types,
    baseStats: snapshot.baseStats,
  };
});

await writeFile(resolve(dataDir, "pokemon.json"), `${JSON.stringify(nextPokemon, null, 2)}\n`, "utf8");

for (const snapshot of snapshots) {
  const recordPath = recordPathById.get(snapshot.id);
  if (!recordPath) throw new Error(`${snapshot.id}: 個別記録がありません。`);
  const record = await readJson(recordPath);
  record.pokemon = {
    ...record.pokemon,
    dexNumber: snapshot.dexNumber,
    types: snapshot.types,
    baseStats: snapshot.baseStats,
  };
  record.weight = {
    kg: snapshot.weightKg,
    verification: {
      status: "verified",
      sources: [...new Set([...(record.weight?.verification?.sources ?? []), snapshot.url])],
      notes: [...new Set([...(record.weight?.verification?.notes ?? []), "PokéAPIのweight（ヘクトグラム）をkgへ換算。"])]
    },
  };
  record.sourceData = {
    ...(record.sourceData ?? {}),
    pokeApi: {
      retrievedAt,
      source: snapshot.url,
      dexNumber: snapshot.dexNumber,
      types: snapshot.types,
      baseStats: snapshot.baseStats,
      weightKg: snapshot.weightKg,
      abilities: snapshot.abilities,
    },
  };
  record.research = {
    ...record.research,
    pokeApiStatus: "verified",
    sources: [...new Set([...(record.research?.sources ?? []), snapshot.url])],
  };
  await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  updatedRecords += 1;
}

console.log(JSON.stringify({
  targetCount: targets.length,
  updatedPokemon,
  updatedRecords,
  changedCoreValues,
  snapshotFields: ["dexNumber", "types", "baseStats", "weightKg", "abilities"],
}, null, 2));
