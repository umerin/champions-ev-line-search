import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const availabilityPath = resolve(__dirname, "../data/champions-availability.json");
const sourceUrl = "https://web-view.app.pokemonchampions.jp/battle/pages/events/rs178066986988lmoqpm/ja/pokemon.html";
const api = "https://pokeapi.co/api/v2";
const concurrency = 12;

const formOverrides = new Map(Object.entries({
  "0026-001": "raichu-alola",
  "0038-001": "ninetales-alola",
  "0059-001": "arcanine-hisui",
  "0080-002": "slowbro-galar",
  "0128-001": "tauros-paldea-combat-breed",
  "0128-002": "tauros-paldea-blaze-breed",
  "0128-003": "tauros-paldea-aqua-breed",
  "0157-001": "typhlosion-hisui",
  "0199-001": "slowking-galar",
  "0479-001": "rotom-heat",
  "0479-002": "rotom-wash",
  "0479-003": "rotom-frost",
  "0479-004": "rotom-fan",
  "0479-005": "rotom-mow",
  "0503-001": "samurott-hisui",
  "0571-001": "zoroark-hisui",
  "0618-001": "stunfisk-galar",
  "0666-018": "vivillon",
  "0670-005": "floette-eternal",
  "0678-000": "meowstic-male",
  "0678-001": "meowstic-female",
  "0706-001": "goodra-hisui",
  "0711-000": "gourgeist-average",
  "0711-001": "gourgeist-small",
  "0711-002": "gourgeist-large",
  "0711-003": "gourgeist-super",
  "0713-001": "avalugg-hisui",
  "0724-001": "decidueye-hisui",
  "0745-000": "lycanroc-midday",
  "0745-001": "lycanroc-midnight",
  "0745-002": "lycanroc-dusk",
  "0902-000": "basculegion-male",
  "0902-001": "basculegion-female",
}));

async function getText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
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

const html = await getText(sourceUrl);
const serialized = html.match(/const pokemons = (\[.*?\]);const noPrefix/s)?.[1];
if (!serialized) throw new Error("公式ページからポケモン一覧を抽出できませんでした。");
const officialPokemon = JSON.parse(serialized);

const pokemonIds = await mapLimit(officialPokemon, concurrency, async ([code]) => {
  if (formOverrides.has(code)) return formOverrides.get(code);
  const nationalDex = Number(code.slice(0, 4));
  return (await getJson(`${api}/pokemon/${nationalDex}`)).name;
});

const availability = JSON.parse(await readFile(availabilityPath, "utf8"));
availability.description = "Pokémon Champions公式イベントページの参加可能ポケモンと、それらに付随するメガシンカを絞り込むためのデータ。";
availability.source = {
  name: "Pokémon Champions - 参加できるポケモン",
  url: sourceUrl,
  importedAt: new Date().toISOString().slice(0, 10),
  note: "公式ページ内のpokemons配列から取得。メガシンカ形態はアプリ側で通常形態に紐づけて追加する。",
};
availability.restrictPokemon = true;
availability.pokemon = [...new Set(pokemonIds)];

await writeFile(availabilityPath, `${JSON.stringify(availability, null, 2)}\n`);
console.log(`Updated ${availability.pokemon.length} Pokemon from the official page.`);
