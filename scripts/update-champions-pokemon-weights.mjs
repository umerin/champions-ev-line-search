import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const dataDir = resolve(rootDir, "data");
const recordsDir = resolve(rootDir, "records/champions-pokemon");
const apiBase = "https://pokeapi.co/api/v2/pokemon";
const concurrency = 8;

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const [pokemon, index] = await Promise.all([
  readJson(resolve(dataDir, "pokemon.json")),
  readJson(resolve(recordsDir, "index.json")),
]);

const targets = pokemon.filter((entry) => entry.championsTarget === true);
const recordPathById = new Map(index.entries.map((entry) => [entry.id, resolve(recordsDir, entry.path)]));

async function fetchWeight(entry) {
  const url = `${apiBase}/${entry.id}`;
  const response = await fetch(url);
  if (response.status === 404) return { entry, url, missing: true };
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const data = await response.json();
  if (!Number.isFinite(data.weight)) throw new Error(`${entry.id}: PokeAPIに体重がありません。`);
  return { entry, url, kg: data.weight / 10 };
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

const results = await mapLimit(targets, concurrency, fetchWeight);
const missing = [];
let updated = 0;

for (const result of results) {
  const recordPath = recordPathById.get(result.entry.id);
  if (!recordPath) throw new Error(`${result.entry.id}: 個別記録がありません。`);
  const record = await readJson(recordPath);

  if (result.missing) {
    missing.push(result.entry.id);
    continue;
  }

  const previousSources = record.weight?.verification?.sources ?? [];
  const previousNotes = record.weight?.verification?.notes ?? [];
  record.weight = {
    kg: result.kg,
    verification: {
      status: "verified",
      sources: [...new Set([...previousSources, result.url])],
      notes: [...new Set([
        ...previousNotes,
        "PokéAPIのweight（ヘクトグラム）をkgへ換算。",
      ])],
    },
  };
  await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  updated += 1;
}

console.log(JSON.stringify({
  targets: targets.length,
  updated,
  missingCount: missing.length,
  missing,
}, null, 2));
