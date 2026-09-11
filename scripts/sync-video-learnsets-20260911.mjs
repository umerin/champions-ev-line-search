import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoDir = process.cwd();
const entriesDir = path.join(repoDir, "records", "champions-pokemon", "entries");
const pokemonPath = path.join(repoDir, "data", "pokemon.json");
const movesPath = path.join(repoDir, "data", "moves.json");
const learnsetsPath = path.join(repoDir, "data", "learnsets.json");
const videoSource = "local-input/videos/2026-09-11 22-24-42.mkv";

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

// The app does not load these entries. They retain video-confirmed status and
// variable-power moves in each Pokémon's AI-editable research record.
const specialMoves = new Map([
  special("roar", "ほえる"),
  special("scary-face", "こわいかお"),
  special("focus-energy", "きあいだめ"),
  special("screech", "いやなおと"),
  special("swords-dance", "つるぎのまい", "normal", "status", ["dance"]),
  special("tailwind", "おいかぜ", "flying"),
  special("roost", "はねやすめ", "flying", "status", ["heal"]),
  special("iron-defense", "てっぺき", "steel"),
  special("sunny-day", "にほんばれ", "fire"),
  special("rain-dance", "あまごい", "water", "status", ["dance"]),
  special("helping-hand", "てだすけ"),
  special("sleep-talk", "ねごと"),
  special("endure", "こらえる"),
  special("protect", "まもる"),
  special("substitute", "みがわり"),
  special("encore", "アンコール"),
  special("after-you", "おさきにどうぞ"),
  special("wish", "ねがいごと", "normal", "status", ["heal"]),
  special("psych-up", "じこあんじ"),
  special("safeguard", "しんぴのまもり"),
  special("baton-pass", "バトンタッチ"),
  special("sing", "うたう"),
  special("magic-room", "マジックルーム", "psychic"),
  special("wonder-room", "ワンダールーム", "psychic"),
  special("power-split", "パワーシェア", "psychic"),
  special("trick-room", "トリックルーム", "psychic"),
  special("power-swap", "パワースワップ", "psychic"),
  special("healing-wish", "いやしのねがい", "psychic", "status", ["heal"]),
  special("gravity", "じゅうりょく", "psychic"),
  special("calm-mind", "めいそう", "psychic"),
  special("imprison", "ふういん", "psychic"),
  special("skill-swap", "スキルスワップ", "psychic"),
  special("trick", "トリック", "psychic"),
  special("psychic-terrain", "サイコフィールド", "psychic"),
  special("heal-pulse", "いやしのはどう", "psychic", "status", ["heal"]),
  special("guard-split", "ガードシェア", "psychic"),
  special("guard-swap", "ガードスワップ", "psychic"),
  special("reflect", "リフレクター", "psychic"),
  special("light-screen", "ひかりのかべ", "psychic"),
  special("follow-me", "このゆびとまれ"),
  special("charm", "あまえる", "fairy"),
  special("spikes", "まきびし", "ground"),
  special("wide-guard", "ワイドガード", "rock"),
  special("snowscape", "ゆきげしき", "ice"),
  special("bulk-up", "ビルドアップ", "fighting"),
  special("agility", "こうそくいどう", "psychic"),
  special("dragon-cheer", "ドラゴンエール", "dragon"),
  special("dragon-dance", "りゅうのまい", "dragon", "status", ["dance"]),
  special("grassy-terrain", "グラスフィールド", "grass"),
  special("worry-seed", "なやみのタネ", "grass"),
  special("growth", "せいちょう"),
  special("leech-seed", "やどりぎのタネ", "grass"),
  special("noble-roar", "おたけび"),
  special("taunt", "ちょうはつ", "dark"),
  special("copycat", "まねっこ"),
  special("swagger", "いばる"),
  special("feather-dance", "フェザーダンス", "flying", "status", ["dance"]),
  special("parting-shot", "すてゼリフ", "dark"),
  special("fake-tears", "うそなき", "dark"),
  special("flatter", "おだてる", "dark"),
  special("torment", "いちゃもん", "dark"),
  special("howl", "とおぼえ"),
  special("attract", "メロメロ"),
  special("double-team", "かげぶんしん"),
  special("nasty-plot", "わるだくみ", "dark"),
  special("curse", "のろい", "ghost"),
  special("hypnosis", "さいみんじゅつ", "psychic"),
  special("spite", "うらみ", "ghost"),
  special("confuse-ray", "あやしいひかり", "ghost"),
  special("amnesia", "ドわすれ", "psychic"),
  special("quash", "さきおくり", "dark"),
  special("switcheroo", "すりかえ", "dark"),
  special("thunder-wave", "でんじは", "electric"),
  special("pain-split", "いたみわけ"),
  special("fling", "なげつける", "dark", "physical"),
  special("low-kick", "けたぐり", "fighting", "physical", [], true),
  special("beat-up", "ふくろだたき", "dark", "physical"),
  special("reversal", "きしかいせい", "fighting", "physical", [], true),
  special("flail", "じたばた", "normal", "physical", [], true),
  special("final-gambit", "いのちがけ", "fighting", "special"),
].map((move) => [move.id, move]));

const dataset = (forms, ids) => ({ forms, ids, source: videoSource });
const datasets = [
  dataset(["salamence", "salamence-mega"], [
    "giga-impact", "double-edge", "thrash", "body-slam", "slash", "facade", "hyper-beam", "hyper-voice", "round", "snore",
    "helping-hand", "sleep-talk", "endure", "scary-face", "protect", "substitute", "focus-energy", "roar",
    "temper-flare", "fire-blast", "fire-fang", "heat-wave", "flamethrower", "fire-spin", "sunny-day", "hydro-pump", "rain-dance",
    "thunder-fang", "fly", "aerial-ace", "dual-wingbeat", "hurricane", "air-slash", "tailwind", "roost", "stone-edge", "rock-slide",
    "rock-tomb", "earthquake", "bulldoze", "mud-slap", "brick-break", "psychic-fangs", "zen-headbutt", "rest", "shadow-claw",
    "outrage", "dragon-rush", "dragon-claw", "breaking-swipe", "dragon-tail", "draco-meteor", "dragon-pulse", "dragon-cheer", "dragon-dance",
    "crunch", "brutal-swing", "bite", "iron-defense", "steel-wing", "iron-head", "iron-tail",
  ]),
  dataset(["indeedee-male"], [
    "last-resort", "body-slam", "facade", "fake-out", "hyper-voice", "tri-attack", "terrain-pulse", "round", "snore", "encore",
    "psych-up", "helping-hand", "wish", "after-you", "sleep-talk", "endure", "protect", "substitute", "energy-ball", "mystical-fire",
    "drain-punch", "zen-headbutt", "future-sight", "psychic", "expanding-force", "psyshock", "extrasensory", "psychic-noise", "stored-power",
    "psychic-terrain", "magic-room", "wonder-room", "power-split", "trick-room", "power-swap", "healing-wish", "gravity", "calm-mind",
    "imprison", "skill-swap", "trick", "rest", "shadow-ball", "play-rough", "draining-kiss", "dazzling-gleam",
  ]),
  dataset(["golisopod", "golisopod-mega"], [
    "giga-impact", "slash", "facade", "double-hit", "hyper-beam", "round", "snore", "sleep-talk", "attract", "endure", "protect",
    "substitute", "screech", "swords-dance", "liquidation", "dive", "waterfall", "razor-shell", "aqua-jet", "muddy-water", "surf",
    "scald", "chilling-water", "rain-dance", "first-impression", "x-scissor", "leech-life", "skitter-smack", "u-turn", "bug-bite",
    "pounce", "pin-missile", "bug-buzz", "struggle-bug", "rock-slide", "rock-tomb", "wide-guard", "gunk-shot", "poison-jab",
    "sludge-wave", "sludge-bomb", "venoshock", "drill-run", "mud-shot", "spikes", "blizzard", "ice-beam", "icy-wind", "close-combat",
    "brick-break", "focus-blast", "bulk-up", "rest", "agility", "sucker-punch", "night-slash", "throat-chop", "spite", "shadow-claw",
    "lash-out", "payback", "fling", "dark-pulse", "snarl", "taunt", "iron-head", "iron-defense",
  ]),
  dataset(["baxcalibur", "baxcalibur-mega"], [
    "giga-impact", "double-edge", "body-slam", "facade", "hyper-beam", "helping-hand", "sleep-talk", "endure", "scary-face", "protect",
    "substitute", "focus-energy", "swords-dance", "aqua-tail", "rain-dance", "thunder-fang", "aerial-ace", "earthquake", "high-horsepower",
    "dig", "stomping-tantrum", "bulldoze", "icicle-crash", "ice-fang", "avalanche", "ice-shard", "icicle-spear", "blizzard", "ice-beam",
    "freeze-dry", "frost-breath", "icy-wind", "snowscape", "body-press", "brick-break", "zen-headbutt", "rest", "glaive-rush", "outrage",
    "dragon-rush", "dragon-claw", "breaking-swipe", "dragon-tail", "scale-shot", "draco-meteor", "dragon-pulse", "dragon-cheer", "dragon-dance",
    "crunch", "bite", "iron-head",
  ]),
  dataset(["indeedee-female"], [
    "body-slam", "facade", "fake-out", "hyper-voice", "round", "terrain-pulse", "snore", "wish", "helping-hand", "follow-me", "psych-up",
    "sleep-talk", "safeguard", "baton-pass", "endure", "protect", "substitute", "sing", "energy-ball", "mystical-fire", "drain-punch",
    "zen-headbutt", "future-sight", "psychic", "psyshock", "stored-power", "psychic-terrain", "heal-pulse", "guard-split", "trick-room",
    "guard-swap", "healing-wish", "calm-mind", "imprison", "skill-swap", "reflect", "rest", "trick", "light-screen", "shadow-ball",
    "play-rough", "alluring-voice", "dazzling-gleam", "draining-kiss", "charm",
  ]),
  dataset(["squawkabilly-green-plumage"], [
    "giga-impact", "double-edge", "facade", "quick-attack", "endeavor", "hyper-beam", "hyper-voice", "uproar", "copycat", "helping-hand",
    "sleep-talk", "swagger", "endure", "scary-face", "protect", "substitute", "seed-bomb", "heat-wave", "sunny-day", "lunge", "u-turn",
    "pounce", "brave-bird", "fly", "aerial-ace", "dual-wingbeat", "hurricane", "air-slash", "air-cutter", "tailwind", "roost",
    "feather-dance", "reversal", "final-gambit", "rest", "foul-play", "lash-out", "thief", "parting-shot", "fake-tears", "taunt",
    "flatter", "torment",
  ]),
  dataset(["rillaboom"], [
    "giga-impact", "double-edge", "mega-kick", "body-slam", "facade", "fake-out", "double-hit", "endeavor", "hyper-beam", "boomburst",
    "hyper-voice", "uproar", "round", "snore", "noble-roar", "sleep-talk", "endure", "scary-face", "protect", "substitute", "focus-energy",
    "screech", "swords-dance", "solar-blade", "wood-hammer", "trailblaze", "grassy-glide", "seed-bomb", "drum-beating", "bullet-seed",
    "frenzy-plant", "leaf-storm", "solar-beam", "energy-ball", "giga-drain", "grass-knot", "worry-seed", "grassy-terrain", "growth",
    "leech-seed", "sunny-day", "u-turn", "acrobatics", "earthquake", "high-horsepower", "stomping-tantrum", "bulldoze", "earth-power",
    "mud-shot", "focus-punch", "superpower", "hammer-arm", "body-press", "drain-punch", "brick-break", "low-sweep", "low-kick", "focus-blast", "bulk-up",
    "rest", "knock-off", "brutal-swing", "assurance", "thief", "fling", "snarl", "taunt",
  ]),
  dataset(["thievul"], [
    "giga-impact", "facade", "quick-attack", "tail-slap", "hyper-beam", "round", "snore", "howl", "baton-pass", "sleep-talk", "attract",
    "endure", "protect", "substitute", "double-team", "screech", "roar", "trailblaze", "grass-knot", "fire-fang", "burning-jealousy",
    "thunder-fang", "first-impression", "u-turn", "acrobatics", "dig", "mud-shot", "ice-fang", "expanding-force", "psychic", "rest",
    "agility", "shadow-claw", "shadow-ball", "foul-play", "crunch", "lash-out", "night-slash", "sucker-punch", "knock-off", "assurance",
    "thief", "beat-up", "dark-pulse", "snarl", "parting-shot", "nasty-plot", "fake-tears", "taunt", "torment", "play-rough",
  ]),
  dataset(["persian-alola"], [
    "giga-impact", "double-edge", "body-slam", "slash", "facade", "covet", "fake-out", "feint", "endeavor", "flail", "hyper-beam",
    "hyper-voice", "uproar", "round", "snore", "protect", "endure", "sleep-talk", "psych-up", "helping-hand", "substitute", "double-team",
    "screech", "roar", "seed-bomb", "trailblaze", "burning-jealousy", "sunny-day", "water-pulse", "chilling-water", "rain-dance", "thunder",
    "thunderbolt", "thunder-wave", "skitter-smack", "u-turn", "aerial-ace", "smack-down", "power-gem", "gunk-shot", "dig", "icy-wind",
    "rest", "amnesia", "agility", "hypnosis", "shadow-claw", "shadow-ball", "curse", "spite", "confuse-ray", "foul-play", "throat-chop",
    "lash-out", "night-slash", "knock-off", "assurance", "thief", "bite", "payback", "beat-up", "dark-pulse", "snarl", "parting-shot",
    "quash", "nasty-plot", "switcheroo", "fake-tears", "taunt", "flatter", "iron-tail", "play-rough", "charm",
  ]),
  dataset(["persian"], [
    "giga-impact", "last-resort", "double-edge", "body-slam", "slash", "facade", "covet", "fake-out", "feint", "endeavor", "flail",
    "hyper-beam", "hyper-voice", "uproar", "round", "snore", "helping-hand", "psych-up", "pain-split", "sleep-talk", "endure", "protect",
    "substitute", "double-team", "screech", "roar", "seed-bomb", "trailblaze", "sunny-day", "water-pulse", "chilling-water", "rain-dance",
    "thunder", "thunderbolt", "thunder-wave", "skitter-smack", "u-turn", "aerial-ace", "power-gem", "gunk-shot", "dig", "icy-wind",
    "rest", "amnesia", "agility", "hypnosis", "shadow-claw", "shadow-ball", "spite", "foul-play", "throat-chop", "lash-out", "knock-off",
    "assurance", "thief", "bite", "payback", "dark-pulse", "snarl", "nasty-plot", "switcheroo", "fake-tears", "taunt", "iron-tail",
    "play-rough", "charm",
  ]),
];

function resolveMove(id) {
  if (moveById.has(id)) return { kind: "master", move: moveById.get(id) };
  if (specialMoves.has(id)) return { kind: "special", move: specialMoves.get(id) };
  throw new Error(`Unknown move id: ${id}`);
}

const resolvedDatasets = datasets.map((entry) => {
  const verifiedIds = [...new Set(entry.ids)];
  const resolved = verifiedIds.map(resolveMove);
  const masterIds = resolved.filter(({ kind }) => kind === "master").map(({ move }) => move.id);
  const recordOnlyMoves = resolved.filter(({ kind }) => kind === "special").map(({ move }) => move);
  const searchableIds = masterIds.filter((id) => {
    const move = moveById.get(id);
    return move.searchable !== false
      && move.power > 0
      && ["physical", "special"].includes(move.category);
  });
  return { ...entry, verifiedIds, masterIds, recordOnlyMoves, searchableIds };
});

const targetIds = new Set(resolvedDatasets.flatMap(({ forms }) => forms));
for (const entry of pokemon) {
  if (targetIds.has(entry.id)) entry.championsTarget = true;
  if (entry.id === "squawkabilly-green-plumage") {
    entry.displayName = "イキリンコ（グリーンフェザー）";
    entry.name.ja = entry.displayName;
    entry.name.jaHrkt = entry.displayName;
  }
}
for (const id of targetIds) {
  if (!pokemon.some((entry) => entry.id === id)) throw new Error(`Unknown Pokémon id: ${id}`);
}
fs.writeFileSync(pokemonPath, `${JSON.stringify(pokemon, null, 2)}\n`);

// Create records and rebuild the index after adding the new Champions targets.
execFileSync(process.execPath, [path.join(repoDir, "scripts", "initialize-champions-pokemon-records.mjs")], {
  cwd: repoDir,
  stdio: "inherit",
});

for (const entry of resolvedDatasets) {
  for (const formId of entry.forms) {
    const entryPath = path.join(entriesDir, `${formId}.json`);
    const record = JSON.parse(fs.readFileSync(entryPath, "utf8"));
    const previous = [
      ...(record.learnset.moveIds ?? []),
      ...(record.learnset.specialMoves ?? []).map((move) => move.id),
    ];

    record.pokemon = pokemon.find((item) => item.id === formId);
    record.learnset.moveIds = entry.masterIds;
    record.learnset.specialMoves = entry.recordOnlyMoves;
    record.learnset.verification = {
      status: "verified",
      sources: [entry.source],
      verifiedMoveIds: entry.verifiedIds,
      rejectedMoveIds: previous.filter((id) => !entry.verifiedIds.includes(id)).sort(),
      notes: [
        `ゲーム内の「教える技」一覧を動画で全件確認（全${entry.verifiedIds.length}技）。`,
        `耐久ラインサーチには固定威力の攻撃技${entry.searchableIds.length}件だけを同期。変化技・未対応の変動威力技は個別記録のみに保存。`,
        formId !== entry.forms[0] ? "通常形態のゲーム内一覧をメガ形態へ同期。" : "",
      ].filter(Boolean),
    };
    fs.writeFileSync(entryPath, `${JSON.stringify(record, null, 2)}\n`);
    learnsets[formId] = [...entry.searchableIds];
  }

  for (const id of entry.masterIds) moveById.get(id).championsTarget = true;
  console.log(`${entry.forms.join(",")} verified=${entry.verifiedIds.length} searchable=${entry.searchableIds.length}`);
}

fs.writeFileSync(movesPath, `${JSON.stringify(moves, null, 2)}\n`);
fs.writeFileSync(learnsetsPath, `${JSON.stringify(learnsets, null, 2)}\n`);
