import fs from "node:fs";
import path from "node:path";

const repoDir = process.cwd();
const pokemonPath = path.join(repoDir, "data", "pokemon.json");
const battleEffectsPath = path.join(repoDir, "data", "battle-effects.json");
const entriesDir = path.join(repoDir, "records", "champions-pokemon", "entries");

const levitatePokemonIds = [
  "chimecho",
  "chimecho-mega",
  "garchomp-mega-z",
  "rotom",
  "rotom-heat",
  "rotom-wash",
  "rotom-frost",
  "rotom-fan",
  "rotom-mow",
  "eelektross",
  "hydreigon",
  "delphox-mega",
];

const pokemon = JSON.parse(fs.readFileSync(pokemonPath, "utf8"));
const battleEffects = JSON.parse(fs.readFileSync(battleEffectsPath, "utf8"));
battleEffects.grounding ??= {};
battleEffects.grounding.levitate = {
  abilityId: "levitate",
  abilityName: "ふゆう",
  pokemonIds: levitatePokemonIds,
};
fs.writeFileSync(battleEffectsPath, `${JSON.stringify(battleEffects, null, 2)}\n`);

const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
const abilityRecord = {
  id: "levitate",
  name: "ふゆう",
  verification: {
    status: "inherited-unverified",
    sources: [],
    notes: ["ユーザー指示により追加。接地判定では非接地として扱う。"],
  },
};

for (const pokemonId of levitatePokemonIds) {
  const pokemonEntry = pokemonById.get(pokemonId);
  if (!pokemonEntry?.championsTarget) continue;
  const entryPath = path.join(entriesDir, `${pokemonId}.json`);
  if (!fs.existsSync(entryPath)) continue;
  const record = JSON.parse(fs.readFileSync(entryPath, "utf8"));
  record.abilities = (record.abilities ?? []).filter((ability) => ability.id !== "levitate");
  record.abilities.push(structuredClone(abilityRecord));
  fs.writeFileSync(entryPath, `${JSON.stringify(record, null, 2)}\n`);
}

console.log(`levitate registered for ${levitatePokemonIds.length} Pokémon/forms`);
