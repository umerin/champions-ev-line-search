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

const special = (
  id,
  name,
  type = "normal",
  category = "status",
  moveCategories = [],
  isContactMove = false,
) => ({
  id,
  name,
  type,
  category,
  power: 0,
  searchable: false,
  isContactMove,
  moveCategories,
});

// 技マスターにない変化技・固定ダメージ技なども個別記録へ保存する。
// ここにある技は耐久ライン検索の対象にはしない。
const specialMoves = new Map([
  special("after-you", "おさきにどうぞ"),
  special("screech", "いやなおと"),
  special("roar", "ほえる"),
  special("cotton-guard", "コットンガード", "grass"),
  special("cotton-spore", "わたほうし", "grass"),
  special("electro-ball", "エレキボール", "electric", "special"),
  special("electric-terrain", "エレキフィールド", "electric"),
  special("magnetic-flux", "じばそうさ", "electric"),
  special("eerie-impulse", "かいでんぱ", "electric"),
  special("charge", "じゅうでん", "electric"),
  special("thunder-wave", "でんじは", "electric"),
  special("low-kick", "けたぐり", "fighting", "physical"),
  special("reflect", "リフレクター", "psychic"),
  special("light-screen", "ひかりのかべ", "psychic"),
  special("agility", "こうそくいどう", "psychic"),
  special("confuse-ray", "あやしいひかり", "ghost"),
  special("dragon-cheer", "ドラゴンエール", "dragon"),
  special("tickle", "くすぐる"),
  special("encore", "アンコール"),
  special("perish-song", "ほろびのうた"),
  special("belly-drum", "はらだいこ"),
  special("sing", "うたう"),
  special("soak", "みずびたし", "water"),
  special("aqua-ring", "アクアリング", "water"),
  special("snowscape", "ゆきげしき", "ice"),
  special("amnesia", "ドわすれ", "psychic"),
  special("fake-tears", "うそなき", "dark"),
].map((move) => [move.id, move]));

const unique = (ids) => [...new Set(ids)];

const datasets = {
  ampharos: {
    source: "local-input/picture/デンリュウ（スクリーンショット13枚）",
    ids: [
      "giga-impact", "double-edge", "mega-kick", "body-slam", "facade", "endeavor",
      "hyper-beam", "round", "snore", "after-you", "helping-hand", "safeguard", "sleep-talk",
      "endure", "protect", "substitute", "screech", "roar", "trailblaze", "cotton-guard",
      "cotton-spore", "fire-punch", "sunny-day", "rain-dance", "supercell-slam", "wild-charge",
      "thunder-punch", "zap-cannon", "thunder", "thunderbolt", "discharge", "rising-voltage",
      "volt-switch", "parabolic-charge", "electroweb", "charge-beam", "electro-ball",
      "electric-terrain", "magnetic-flux", "eerie-impulse", "charge", "thunder-wave", "meteor-beam",
      "power-gem", "dig", "stomping-tantrum", "bulldoze", "ice-punch", "focus-punch", "brick-break",
      "low-kick", "focus-blast", "rest", "reflect", "light-screen", "agility", "confuse-ray",
      "outrage", "breaking-swipe", "dragon-tail", "dragon-pulse", "dragon-cheer",
    ],
  },
  azumarill: {
    source: "local-input/picture/マリルリ（スクリーンショット13枚）",
    ids: [
      "giga-impact", "double-edge", "body-slam", "facade", "hyper-beam", "hyper-voice", "round",
      "uproar", "snore", "copycat", "tickle", "helping-hand", "encore", "sleep-talk", "endure",
      "perish-song", "belly-drum", "protect", "substitute", "sing", "trailblaze", "grass-knot",
      "aqua-tail", "aqua-jet", "dive", "waterfall", "muddy-water", "surf", "water-pulse",
      "chilling-water", "whirlpool", "soak", "aqua-ring", "rain-dance", "bounce", "dig", "bulldoze",
      "mud-shot", "ice-spinner", "ice-punch", "blizzard", "ice-beam", "icy-wind", "snowscape",
      "focus-punch", "superpower", "brick-break", "focus-blast", "future-sight", "rest", "amnesia",
      "light-screen", "knock-off", "brutal-swing", "fling", "fake-tears", "iron-tail", "play-rough",
      "misty-explosion", "alluring-voice", "draining-kiss", "misty-terrain", "baby-doll-eyes",
    ],
  },
};

function resolveMove(id) {
  if (moveById.has(id)) return { kind: "master", move: moveById.get(id) };
  if (specialMoves.has(id)) return { kind: "special", move: specialMoves.get(id) };
  throw new Error(`Unknown move id: ${id}`);
}

for (const id of Object.keys(datasets)) {
  const entry = pokemon.find((item) => item.id === id);
  if (!entry) throw new Error(`${id} が data/pokemon.json にありません`);
  entry.championsTarget = true;
}
fs.writeFileSync(pokemonPath, `${JSON.stringify(pokemon, null, 2)}\n`);

execFileSync(process.execPath, [path.join(repoDir, "scripts", "initialize-champions-pokemon-records.mjs")], {
  cwd: repoDir,
  stdio: "inherit",
});

const results = [];
for (const [id, dataset] of Object.entries(datasets)) {
  const verifiedIds = unique(dataset.ids);
  const resolved = verifiedIds.map(resolveMove);
  const masterIds = resolved.filter(({ kind }) => kind === "master").map(({ move }) => move.id);
  const recordOnlyMoves = resolved.filter(({ kind }) => kind === "special").map(({ move }) => move);
  const searchableIds = masterIds.filter((moveId) => {
    const move = moveById.get(moveId);
    return move.searchable !== false
      && move.power > 0
      && ["physical", "special"].includes(move.category);
  });

  const entryPath = path.join(entriesDir, `${id}.json`);
  const record = JSON.parse(fs.readFileSync(entryPath, "utf8"));
  const previous = [
    ...(record.learnset.moveIds ?? []),
    ...(record.learnset.specialMoves ?? []).map((move) => move.id),
  ];

  record.pokemon = pokemon.find((item) => item.id === id);
  record.learnset.moveIds = masterIds;
  record.learnset.specialMoves = recordOnlyMoves;
  record.learnset.verification = {
    status: "verified",
    sources: [dataset.source],
    verifiedMoveIds: verifiedIds,
    rejectedMoveIds: previous.filter((moveId) => !verifiedIds.includes(moveId)).sort(),
    notes: [
      `ゲーム内の「教える技」一覧をスクリーンショット13枚で確認（全${verifiedIds.length}技）。`,
      `耐久ラインサーチには固定威力の攻撃技${searchableIds.length}件だけを同期。変化技・固定ダメージ技は個別記録のみに保存。`,
    ],
  };
  fs.writeFileSync(entryPath, `${JSON.stringify(record, null, 2)}\n`);
  learnsets[id] = searchableIds;
  for (const moveId of masterIds) moveById.get(moveId).championsTarget = true;

  results.push({
    pokemon: id,
    championsTarget: record.pokemon.championsTarget,
    verifiedMoves: verifiedIds.length,
    searchMoves: searchableIds.length,
    recordOnlyMoves: recordOnlyMoves.length,
  });
}

fs.writeFileSync(movesPath, `${JSON.stringify(moves, null, 2)}\n`);
fs.writeFileSync(learnsetsPath, `${JSON.stringify(learnsets, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
