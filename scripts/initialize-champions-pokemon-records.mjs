import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const dataDir = resolve(rootDir, "data");
const recordsDir = resolve(rootDir, "records/champions-pokemon");
const entriesDir = resolve(recordsDir, "entries");

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const pathExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const [pokemon, moves, learnsets, battleEffects] = await Promise.all([
  readJson(resolve(dataDir, "pokemon.json")),
  readJson(resolve(dataDir, "moves.json")),
  readJson(resolve(dataDir, "learnsets.json")),
  readJson(resolve(dataDir, "battle-effects.json")),
]);

const moveIds = new Set(moves.map((move) => move.id));
const championsPokemon = pokemon
  .filter((entry) => entry.championsTarget === true)
  .sort((a, b) => (a.dexNumber ?? Number.MAX_SAFE_INTEGER) - (b.dexNumber ?? Number.MAX_SAFE_INTEGER)
    || a.id.localeCompare(b.id));

function effectsForPokemon(pokemonId) {
  const result = [];

  for (const scope of ["defender", "attacker"]) {
    for (const [effectKey, definition] of Object.entries(battleEffects[scope] ?? {})) {
      if (!(definition.pokemonIds ?? []).includes(pokemonId)) continue;
      const { pokemonIds: _pokemonIds, ...effectDefinition } = definition;
      result.push({ scope, effectKey, definition: effectDefinition });
    }
  }

  for (const [weather, definition] of Object.entries(battleEffects.weatherSetters ?? {})) {
    if (!(definition.pokemonIds ?? []).includes(pokemonId)) continue;
    const { pokemonIds: _pokemonIds, ...effectDefinition } = definition;
    result.push({
      scope: "weatherSetter",
      effectKey: weather,
      definition: effectDefinition,
    });
  }

  return result;
}

function createRecord(entry) {
  const learnedMoveIds = learnsets[entry.id] ?? [];
  for (const moveId of learnedMoveIds) {
    if (!moveIds.has(moveId)) {
      throw new Error(`${entry.id}: 未知の技ID ${moveId}`);
    }
  }

  return {
    $schema: "../schema.json",
    schemaVersion: 1,
    pokemon: entry,
    learnset: {
      moveIds: learnedMoveIds,
      specialMoves: [],
      verification: {
        status: "inherited-unverified",
        sources: [],
        verifiedMoveIds: [],
        rejectedMoveIds: [],
        notes: [],
      },
    },
    weight: {
      kg: null,
      verification: {
        status: "not-recorded",
        sources: [],
        notes: [],
      },
    },
    abilities: [],
    battleEffects: effectsForPokemon(entry.id),
    research: {
      profileStatus: "inherited-unverified",
      battleEffectsStatus: "inherited-unverified",
      sources: [],
      notes: [],
    },
    extensions: {},
  };
}

await mkdir(entriesDir, { recursive: true });

let created = 0;
let preserved = 0;
const indexEntries = [];

for (const entry of championsPokemon) {
  const relativePath = `entries/${entry.id}.json`;
  const outputPath = resolve(recordsDir, relativePath);

  if (await pathExists(outputPath)) {
    preserved += 1;
  } else {
    await writeFile(outputPath, `${JSON.stringify(createRecord(entry), null, 2)}\n`, "utf8");
    created += 1;
  }

  indexEntries.push({
    id: entry.id,
    dexNumber: entry.dexNumber,
    displayName: entry.displayName,
    path: relativePath,
  });
}

const index = {
  schemaVersion: 1,
  purpose: "AI-editable research records for Champions-target Pokemon. The web app does not load this directory.",
  count: indexEntries.length,
  entries: indexEntries,
};

await writeFile(resolve(recordsDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  championsPokemon: championsPokemon.length,
  created,
  preserved,
  recordsDir,
}, null, 2));
