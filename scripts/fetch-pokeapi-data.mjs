import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../data");
const api = "https://pokeapi.co/api/v2";
const allMode = process.argv.includes("--all");
const concurrency = Number(process.env.POKEAPI_CONCURRENCY ?? 8);
const evolutionChainPromises = new Map();

const samplePokemonIds = [
  "pikachu",
  "garchomp",
  "gholdengo",
  "dragonite",
  "flutter-mane",
  "incineroar",
];

const sampleMoveIds = [
  "earthquake",
  "dragon-claw",
  "make-it-rain",
  "shadow-ball",
  "moonblast",
  "flare-blitz",
  "thunderbolt",
];

const sampleMoveUsers = {
  earthquake: ["garchomp", "dragonite"],
  "dragon-claw": ["garchomp", "dragonite"],
  "make-it-rain": ["gholdengo"],
  "shadow-ball": ["gholdengo", "flutter-mane"],
  moonblast: ["flutter-mane"],
  "flare-blitz": ["incineroar"],
  thunderbolt: ["pikachu"],
};

const spreadTargets = new Set([
  "all-opponents",
  "all-other-pokemon",
  "entire-field",
]);

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function listResource(resource) {
  const result = await getJson(`${api}/${resource}?limit=20000`);
  return result.results.map((item) => item.name);
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
      if ((index + 1) % 100 === 0) {
        console.log(`  ${index + 1}/${items.length}`);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function localizedName(resource, fallback) {
  const names = resource.names ?? [];
  return {
    en: names.find((item) => item.language.name === "en")?.name ?? fallback,
    ja: names.find((item) => item.language.name === "ja")?.name ?? fallback,
    jaHrkt: names.find((item) => item.language.name === "ja-hrkt")?.name ?? fallback,
  };
}

function collectFinalSpecies(node, result = new Set()) {
  if (!node.evolves_to.length) result.add(node.species.name);
  node.evolves_to.forEach((child) => collectFinalSpecies(child, result));
  return result;
}

function getFinalSpecies(chainUrl) {
  if (!evolutionChainPromises.has(chainUrl)) {
    evolutionChainPromises.set(chainUrl, getJson(chainUrl).then((chain) => collectFinalSpecies(chain.chain)));
  }
  return evolutionChainPromises.get(chainUrl);
}

async function fetchPokemon(id) {
  const pokemon = await getJson(`${api}/pokemon/${id}`);
  const species = await getJson(pokemon.species.url);
  const finalSpecies = await getFinalSpecies(species.evolution_chain.url);
  const stats = Object.fromEntries(pokemon.stats.map((entry) => [entry.stat.name, entry.base_stat]));
  const name = localizedName(species, pokemon.name);
  return {
    id: pokemon.name,
    dexNumber: species.id,
    displayName: name.ja,
    name,
    championsTarget: false,
    types: pokemon.types
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.type.name),
    isFinalEvolution: finalSpecies.has(species.name),
    baseStats: {
      hp: stats.hp,
      atk: stats.attack,
      def: stats.defense,
      spa: stats["special-attack"],
      spd: stats["special-defense"],
      spe: stats.speed,
    },
    moveIds: pokemon.moves.map((entry) => entry.move.name),
  };
}

async function fetchMove(id) {
  const move = await getJson(`${api}/move/${id}`);
  if (!["physical", "special"].includes(move.damage_class.name)) return null;
  if (!move.power) return null;

  return {
    id: move.name,
    name: localizedName(move, move.name),
    championsTarget: false,
    type: move.type.name,
    category: move.damage_class.name,
    power: move.power,
    priority: move.priority,
    isSpreadMove: spreadTargets.has(move.target.name),
  };
}

function buildUsersByMove(pokemonRows) {
  const usersByMove = new Map();
  for (const pokemon of pokemonRows) {
    for (const moveId of pokemon.moveIds) {
      if (!usersByMove.has(moveId)) usersByMove.set(moveId, []);
      usersByMove.get(moveId).push(pokemon.id);
    }
  }
  return usersByMove;
}

function stripInternalPokemonFields(pokemonRows) {
  return pokemonRows.map(({ moveIds, ...pokemon }) => pokemon);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const pokemonIds = allMode ? await listResource("pokemon") : samplePokemonIds;
  const moveIds = allMode ? await listResource("move") : sampleMoveIds;

  console.log(allMode ? "全件モードで取得します。" : "サンプルモードで取得します。");
  console.log(`pokemon: ${pokemonIds.length}, moves: ${moveIds.length}`);

  console.log("ポケモンデータ取得中...");
  const pokemonWithMoves = await mapLimit(pokemonIds, concurrency, fetchPokemon);
  const usersByMove = allMode ? buildUsersByMove(pokemonWithMoves) : new Map(Object.entries(sampleMoveUsers));

  console.log("技データ取得中...");
  const rawMoves = await mapLimit(moveIds, concurrency, fetchMove);
  const moves = rawMoves
    .filter(Boolean)
    .filter((move) => usersByMove.has(move.id))
    .sort((a, b) => a.id.localeCompare(b.id));
  const includedMoveIds = new Set(moves.map((move) => move.id));
  const learnsets = Object.fromEntries(pokemonWithMoves.map((entry) => [
    entry.id,
    entry.moveIds.filter((moveId) => includedMoveIds.has(moveId)).sort((a, b) => a.localeCompare(b)),
  ]));
  const pokemon = stripInternalPokemonFields(pokemonWithMoves)
    .sort((a, b) => a.id.localeCompare(b.id));

  await writeFile(resolve(outDir, "pokemon.json"), `${JSON.stringify(pokemon, null, 2)}\n`);
  await writeFile(resolve(outDir, "moves.json"), `${JSON.stringify(moves, null, 2)}\n`);
  await writeFile(resolve(outDir, "learnsets.json"), `${JSON.stringify(learnsets, null, 2)}\n`);
  console.log(`wrote ${pokemon.length} pokemon, ${moves.length} damaging moves, and their learnsets`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
