import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoDir = process.cwd();
const entriesDir = path.join(repoDir, "records", "champions-pokemon", "entries");
const pokemonPath = path.join(repoDir, "data", "pokemon.json");
const movesPath = path.join(repoDir, "data", "moves.json");
const learnsetsPath = path.join(repoDir, "data", "learnsets.json");

const pokemon = JSON.parse(fs.readFileSync(pokemonPath, "utf8"));
const moves = JSON.parse(fs.readFileSync(movesPath, "utf8"));
const learnsets = JSON.parse(fs.readFileSync(learnsetsPath, "utf8"));
const moveById = new Map(moves.map((move) => [move.id, move]));
const highPath = path.join(entriesDir, "toxtricity-amped.json");
const lowPath = path.join(entriesDir, "toxtricity-low-key.json");
const high = JSON.parse(fs.readFileSync(highPath, "utf8"));

const special = (id, name, type) => ({
  id,
  name,
  type,
  category: "status",
  power: 0,
  searchable: false,
  isContactMove: false,
  moveCategories: [],
});

const lowPokemon = pokemon.find((entry) => entry.id === "toxtricity-low-key");
if (!lowPokemon) throw new Error("toxtricity-low-key が pokemon.json にありません。");
lowPokemon.championsTarget = true;
fs.writeFileSync(pokemonPath, `${JSON.stringify(pokemon, null, 2)}\n`);

execFileSync(process.execPath, [path.join(repoDir, "scripts", "initialize-champions-pokemon-records.mjs")], {
  cwd: repoDir,
  stdio: "inherit",
});

const low = JSON.parse(fs.readFileSync(lowPath, "utf8"));
const moveIds = high.learnset.moveIds.filter((id) => id !== "venoshock");
const specialMoves = high.learnset.specialMoves
  .filter((move) => move.id !== "shift-gear")
  .concat([
    special("magnetic-flux", "じばそうさ", "electric"),
    special("venom-trap", "ベノムトラップ", "poison"),
  ]);

low.pokemon = lowPokemon;
low.learnset.moveIds = moveIds;
low.learnset.specialMoves = specialMoves;
low.learnset.verification = {
  status: "inherited-unverified",
  sources: [],
  verifiedMoveIds: [],
  rejectedMoveIds: [],
  notes: [
    "動画確認前の暫定登録。ストリンダー（ハイなすがた）の確認済み技一覧をベースにした。",
    "ハイなすがた限定と想定したギアチェンジ・ベノムショックを外し、ローなすがた限定と想定したじばそうさ・ベノムトラップを追加。",
    "チャンピオンズのゲーム画面でローなすがたの全技一覧を確認後、正式データへ更新する。",
  ],
};
fs.writeFileSync(lowPath, `${JSON.stringify(low, null, 2)}\n`);

learnsets["toxtricity-low-key"] = moveIds.filter((id) => {
  const move = moveById.get(id);
  return move && move.searchable !== false && move.power > 0 && ["physical", "special"].includes(move.category);
});
fs.writeFileSync(learnsetsPath, `${JSON.stringify(learnsets, null, 2)}\n`);

console.log(`toxtricity-low-key provisional moveIds=${moveIds.length} specialMoves=${specialMoves.length} searchable=${learnsets["toxtricity-low-key"].length}`);
