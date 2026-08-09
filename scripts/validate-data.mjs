import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const startedAt = performance.now();
const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(scriptDir, "../data");
const readJson = async (name) => JSON.parse(await readFile(resolve(dataDir, name), "utf8"));
const finalDamageMGroups = new Set([
  "wall",
  "neuroforce",
  "sniper",
  "tintedLens",
  "fluffyFire",
  "Mhalf",
  "Mfilter",
  "friendGuard",
  "expertBelt",
  "metronome",
  "lifeOrb",
  "resistBerry",
  "Mtwice",
]);

const [pokemon, moves, learnsets, battleEffects] = await Promise.all([
  readJson("pokemon.json"),
  readJson("moves.json"),
  readJson("learnsets.json"),
  readJson("battle-effects.json"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertUnique(entries, label) {
  const ids = new Set();
  for (const entry of entries) {
    assert(entry?.id, `${label}: IDがない項目があります。`);
    assert(!ids.has(entry.id), `${label}: IDが重複しています: ${entry.id}`);
    ids.add(entry.id);
  }
  return ids;
}

const pokemonIds = assertUnique(pokemon, "pokemon.json");
const moveIds = assertUnique(moves, "moves.json");

for (const entry of pokemon) {
  assert(typeof entry.championsTarget === "boolean", `pokemon.json: ${entry.id} の championsTarget が真偽値ではありません。`);
}
for (const entry of moves) {
  assert(typeof entry.championsTarget === "boolean", `moves.json: ${entry.id} の championsTarget が真偽値ではありません。`);
  if (Object.hasOwn(entry, "ignoresScreens")) {
    assert(typeof entry.ignoresScreens === "boolean", `moves.json: ${entry.id} の ignoresScreens が真偽値ではありません。`);
  }
  assert(!Object.hasOwn(entry, "users"), `moves.json: ${entry.id} に古い users 配列が残っています。`);
}

let learnedPairs = 0;
for (const pokemonId of pokemonIds) {
  assert(Array.isArray(learnsets[pokemonId]), `learnsets.json: ${pokemonId} の配列がありません。`);
}
for (const [pokemonId, pokemonMoves] of Object.entries(learnsets)) {
  assert(pokemonIds.has(pokemonId), `learnsets.json: 未知のポケモンID ${pokemonId}`);
  const seen = new Set();
  for (const moveId of pokemonMoves) {
    assert(moveIds.has(moveId), `learnsets.json: ${pokemonId} に未知の技ID ${moveId}`);
    assert(!seen.has(moveId), `learnsets.json: ${pokemonId} の ${moveId} が重複しています。`);
    seen.add(moveId);
    learnedPairs += 1;
  }
}

for (const [scope, effects] of Object.entries(battleEffects)) {
  if (scope === "weatherSetters") {
    for (const [weather, setter] of Object.entries(effects)) {
      assert(setter && typeof setter === "object" && !Array.isArray(setter), `battle-effects.json: ${weather} の天候特性定義が不正です。`);
      assert(typeof setter.abilityId === "string" && setter.abilityId, `battle-effects.json: ${weather} の特性IDがありません。`);
      assert(typeof setter.abilityName === "string" && setter.abilityName, `battle-effects.json: ${weather} の特性名がありません。`);
      const setterIds = setter.pokemonIds;
      assert(Array.isArray(setterIds), `battle-effects.json: ${weather} の天候特性ポケモン一覧が配列ではありません。`);
      for (const pokemonId of setterIds) {
        assert(pokemonIds.has(pokemonId), `battle-effects.json: ${weather} に未知のポケモンID ${pokemonId}`);
      }
    }
    continue;
  }
  assert(["attacker", "defender"].includes(scope), `battle-effects.json: 未知の区分 ${scope}`);
  for (const [key, effect] of Object.entries(effects)) {
    assert(["power", "damage", "weather"].includes(effect.stage), `battle-effects.json: ${key} の stage が不正です。`);
    if (effect.stage === "weather") {
      assert(scope === "attacker", `battle-effects.json: ${key} の天候上書きは攻撃側に設定してください。`);
      assert(["sunny", "rain", "sand", "snow"].includes(effect.weather), `battle-effects.json: ${key} の weather が不正です。`);
    } else {
      assert(Number.isFinite(effect.modifier) && effect.modifier > 0, `battle-effects.json: ${key} の modifier が不正です。`);
      if (effect.stage === "damage") {
        assert(finalDamageMGroups.has(effect.mGroup), `battle-effects.json: ${key} の mGroup が不正です。`);
      }
    }
    for (const pokemonId of effect.pokemonIds ?? []) {
      assert(pokemonIds.has(pokemonId), `battle-effects.json: ${key} に未知のポケモンID ${pokemonId}`);
    }
  }
}

console.log(JSON.stringify({
  pokemon: pokemon.length,
  moves: moves.length,
  learnedPairs,
  championsPokemon: pokemon.filter((entry) => entry.championsTarget).length,
  championsMoves: moves.filter((entry) => entry.championsTarget).length,
  elapsedMs: Math.round((performance.now() - startedAt) * 10) / 10,
}, null, 2));
