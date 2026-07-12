import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pokemonPath = resolve(__dirname, "../data/pokemon.json");
const api = "https://pokeapi.co/api/v2";
const concurrency = Number(process.env.POKEAPI_CONCURRENCY ?? 8);
const chainPromises = new Map();

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function collectFinalSpecies(node, result = new Set()) {
  if (!node.evolves_to.length) result.add(node.species.name);
  node.evolves_to.forEach((child) => collectFinalSpecies(child, result));
  return result;
}

function getFinalSpecies(chainUrl) {
  if (!chainPromises.has(chainUrl)) {
    chainPromises.set(chainUrl, getJson(chainUrl).then((chain) => collectFinalSpecies(chain.chain)));
  }
  return chainPromises.get(chainUrl);
}

async function mapLimit(items, limit, mapper) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await mapper(items[index], index);
      if ((index + 1) % 100 === 0) console.log(`${index + 1}/${items.length}`);
    }
  });
  await Promise.all(workers);
}

const pokemon = JSON.parse(await readFile(pokemonPath, "utf8"));
await mapLimit(pokemon, concurrency, async (entry) => {
  const pokemonData = await getJson(`${api}/pokemon/${entry.id}`);
  const species = await getJson(pokemonData.species.url);
  const finalSpecies = await getFinalSpecies(species.evolution_chain.url);
  entry.isFinalEvolution = finalSpecies.has(species.name);
});

await writeFile(pokemonPath, `${JSON.stringify(pokemon, null, 2)}\n`);
console.log(`Updated ${pokemon.length} Pokemon.`);
