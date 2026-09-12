import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const rootDir = resolve(scriptDir, "..");
const dataDir = resolve(rootDir, "data");

const readJson = async (fileName) =>
  JSON.parse(await readFile(resolve(dataDir, fileName), "utf8"));

const pokemon = await readJson("pokemon.json");
const learnsets = await readJson("learnsets.json");

const requestedIds = [
  "salamence-mega",
  "garchomp-mega-z",
  "lucario-mega-z",
  "absol-mega-z",
  "golisopod-mega",
  "baxcalibur-mega",
];

const fallbackSources = {
  "garchomp-mega-z": "garchomp-mega",
  "lucario-mega-z": "lucario-mega",
  "absol-mega-z": "absol-mega",
};

const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));

for (const id of requestedIds) {
  const entry = pokemonById.get(id);
  if (!entry) throw new Error(`Missing Pokémon data: ${id}`);
  entry.championsTarget = true;

  if (!Array.isArray(learnsets[id])) {
    const sourceId = fallbackSources[id];
    if (!sourceId || !Array.isArray(learnsets[sourceId])) {
      throw new Error(`Missing learnset data: ${id}`);
    }
    learnsets[id] = [...learnsets[sourceId]];
  }
}

await writeFile(resolve(dataDir, "pokemon.json"), `${JSON.stringify(pokemon, null, 2)}\n`, "utf8");
await writeFile(resolve(dataDir, "learnsets.json"), `${JSON.stringify(learnsets, null, 2)}\n`, "utf8");

await import("./initialize-champions-pokemon-records.mjs");

console.log(JSON.stringify({
  requestedIds,
  enabledIds: requestedIds.filter((id) => pokemonById.get(id).championsTarget === true),
}, null, 2));
