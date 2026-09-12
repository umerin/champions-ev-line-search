import fs from "node:fs";
import path from "node:path";

const repoDir = process.cwd();
const pokemonPath = path.join(repoDir, "data", "pokemon.json");
const recordsDir = path.join(repoDir, "records", "champions-pokemon", "entries");
const outputPath = path.join(repoDir, "data", "精査ポケモンリスト.md");

const pokemon = JSON.parse(fs.readFileSync(pokemonPath, "utf8"));
const verifiedIds = new Set();

for (const fileName of fs.readdirSync(recordsDir).filter((name) => name.endsWith(".json"))) {
  const record = JSON.parse(fs.readFileSync(path.join(recordsDir, fileName), "utf8"));
  if (record.learnset?.verification?.status === "verified") {
    verifiedIds.add(record.pokemon?.id ?? path.basename(fileName, ".json"));
  }
}

const sortedPokemon = pokemon
  .filter((entry) => entry.championsTarget === true && !/-mega(?:-|$)/.test(entry.id))
  .sort((a, b) => (
  (a.dexNumber ?? Number.MAX_SAFE_INTEGER) - (b.dexNumber ?? Number.MAX_SAFE_INTEGER)
  || String(a.id).localeCompare(String(b.id))
  ));

const lines = [
  "# 精査ポケモンリスト",
  "",
  `チャンピオンズ登録済み・メガ形態除外：全${sortedPokemon.length}件 / 精査済み${sortedPokemon.filter((entry) => verifiedIds.has(entry.id)).length}件`,
  "",
  "精査済み判定は、チャンピオンズ用個別記録の技一覧が `verified` になっているかで管理する。",
  "",
  ...sortedPokemon.map((entry) => {
    const checked = verifiedIds.has(entry.id) ? "x" : " ";
    const dexNumber = String(entry.dexNumber ?? "----").padStart(4, "0");
    return `- [${checked}] ${dexNumber} ${entry.displayName} \`${entry.id}\``;
  }),
  "",
];

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({
  outputPath,
  total: sortedPokemon.length,
  verified: sortedPokemon.filter((entry) => verifiedIds.has(entry.id)).length,
}, null, 2));
