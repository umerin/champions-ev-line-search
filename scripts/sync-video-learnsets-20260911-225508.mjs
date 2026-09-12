import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoDir = process.cwd();
const entriesDir = path.join(repoDir, "records", "champions-pokemon", "entries");
const pokemonPath = path.join(repoDir, "data", "pokemon.json");
const movesPath = path.join(repoDir, "data", "moves.json");
const learnsetsPath = path.join(repoDir, "data", "learnsets.json");
const videoSource = "local-input/videos/2026-09-11 22-55-08.mkv";

const pokemon = JSON.parse(fs.readFileSync(pokemonPath, "utf8"));
const moves = JSON.parse(fs.readFileSync(movesPath, "utf8"));
const learnsets = JSON.parse(fs.readFileSync(learnsetsPath, "utf8"));
const moveById = new Map(moves.map((move) => [move.id, move]));
if (moveById.has("comeuppance")) moveById.get("comeuppance").searchable = false;

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

// Reuse metadata already recorded for status/variable-power moves. These moves
// stay in the AI-editable per-Pokémon records and are not added to the search.
const specialMoves = new Map();
for (const fileName of fs.readdirSync(entriesDir).filter((name) => name.endsWith(".json"))) {
  const record = JSON.parse(fs.readFileSync(path.join(entriesDir, fileName), "utf8"));
  for (const move of record.learnset?.specialMoves ?? []) specialMoves.set(move.id, move);
}
const addSpecial = (move) => {
  if (!specialMoves.has(move.id)) specialMoves.set(move.id, move);
};

[
  special("self-destruct", "じばく", "normal", "physical"),
  special("stockpile", "たくわえる"),
  special("swallow", "のみこむ", "normal", "status", ["heal"]),
  special("simple-beam", "シンプルビーム", "normal"),
  special("recycle", "リサイクル", "normal"),
  special("stuff-cheeks", "ほおばる", "normal"),
  special("disable", "かなしばり"),
  special("perish-song", "ほろびのうた"),
  special("teeter-dance", "フラフラダンス", "normal", "status", ["dance"]),
  special("ally-switch", "サイドチェンジ", "psychic"),
  special("role-play", "なりきり", "psychic"),
  special("stuff-cheeks", "ほおばる"),
  special("yawn", "あくび"),
  special("court-change", "コートチェンジ", "normal"),
  special("super-fang", "いかりのまえば", "normal", "physical", [], true),
  special("tearful-look", "なみだめ"),
  special("octolock", "たこがため", "fighting"),
  special("topsy-turvy", "ひっくりかえす", "dark"),
  special("revival-blessing", "さいきのいのり", "normal", "status", ["heal"]),
  special("entrainment", "なかまづくり", "normal"),
  special("acupressure", "つぼをつく", "normal"),
  special("memento", "おきみやげ", "dark"),
  special("metal-burst", "メタルバースト", "steel", "physical"),
  special("double-shock", "でんこうそうげき", "electric", "physical"),
  special("coaching", "コーチング", "fighting"),
  special("defog", "きりばらい", "flying"),
  special("detect", "みきり", "fighting"),
  special("metal-sound", "きんぞくおん", "steel"),
  special("milk-drink", "ミルクのみ", "normal", "status", ["heal"]),
  special("quick-guard", "ファストガード", "fighting"),
  special("shift-gear", "ギアチェンジ", "steel"),
  special("soak", "みずびたし", "water"),
].forEach(addSpecial);

const dataset = (forms, ids) => ({ forms, ids, source: videoSource });
const datasets = [
  dataset(["wigglytuff"], [
    "self-destruct", "giga-impact", "last-resort", "double-edge", "mega-kick", "body-slam", "facade", "covet", "endeavor", "hyper-beam",
    "hyper-voice", "uproar", "tri-attack", "round", "snore", "spit-up", "swallow", "stockpile", "copycat", "wish", "helping-hand",
    "psych-up", "encore", "baton-pass", "pain-split", "safeguard", "sleep-talk", "endure", "perish-song", "protect", "substitute", "disable", "sing",
    "trailblaze", "solar-beam", "energy-ball", "grass-knot", "fire-punch", "fire-blast", "flamethrower", "sunny-day", "water-pulse", "chilling-water", "rain-dance",
    "wild-charge", "thunder-punch", "thunder", "thunderbolt", "thunder-wave", "bounce", "stealth-rock", "sandstorm", "dig", "ice-spinner", "ice-punch", "blizzard", "ice-beam", "icy-wind",
    "focus-punch", "body-press", "drain-punch", "brick-break", "focus-blast", "zen-headbutt", "psychic", "expanding-force", "psyshock", "psychic-noise", "stored-power", "heal-pulse",
    "magic-room", "gravity", "calm-mind", "skill-swap", "rest", "amnesia", "reflect", "light-screen", "shadow-ball", "knock-off", "thief", "fling", "dark-pulse", "nasty-plot", "fake-tears", "taunt",
    "iron-head", "gyro-ball", "play-rough", "moonblast", "misty-explosion", "alluring-voice", "dazzling-gleam", "draining-kiss", "misty-terrain", "charm", "sweet-kiss",
  ]),
  dataset(["farfetchd"], [
    "body-slam", "slash", "facade", "covet", "quick-attack", "feint", "flail", "uproar", "round", "snore", "simple-beam", "helping-hand", "sleep-talk", "baton-pass", "attract", "endure", "protect", "substitute", "focus-energy", "swords-dance",
    "trailblaze", "leaf-blade", "solar-blade", "first-impression", "sunny-day", "heat-wave", "u-turn", "brave-bird", "fly", "aerial-ace", "acrobatics", "dual-wingbeat", "air-slash", "air-cutter", "roost", "feather-dance", "poison-jab", "close-combat", "final-gambit", "agility", "rest", "curse", "throat-chop", "night-slash", "knock-off", "brutal-swing", "thief", "iron-tail", "steel-wing",
  ]),
  dataset(["mr-mime"], [
    "giga-impact", "mega-kick", "body-slam", "facade", "fake-out", "hyper-beam", "uproar", "round", "snore", "copycat", "tickle", "teeter-dance", "recycle", "helping-hand", "encore", "attract", "sleep-talk", "safeguard", "baton-pass", "endure", "protect", "substitute", "solar-beam", "energy-ball", "grass-knot", "fire-punch", "mystical-fire", "sunny-day", "rain-dance", "thunder-punch", "thunder", "thunderbolt", "charge-beam", "thunder-wave", "wide-guard", "ice-punch", "icy-wind", "drain-punch", "quick-guard", "focus-blast", "brick-break", "zen-headbutt", "future-sight", "psychic", "expanding-force", "psyshock", "stored-power", "magic-room", "ally-switch", "psychic-terrain", "wonder-room", "power-split", "trick-room", "guard-swap", "power-swap", "calm-mind", "skill-swap", "role-play", "trick", "rest", "reflect", "light-screen", "hypnosis", "shadow-ball", "confuse-ray", "foul-play", "sucker-punch", "thief", "payback", "fling", "nasty-plot", "taunt", "torment", "iron-defense", "dazzling-gleam", "misty-terrain", "charm",
  ]),
  dataset(["swalot"], [
    "self-destruct", "giga-impact", "double-edge", "body-slam", "facade", "hyper-beam", "round", "snore", "spit-up", "stuff-cheeks", "yawn", "helping-hand", "swallow", "stockpile", "encore", "pain-split", "sleep-talk", "substitute", "protect", "endure", "swords-dance", "seed-bomb", "bullet-seed", "solar-beam", "giga-drain", "fire-punch", "sunny-day", "water-pulse", "rain-dance", "thunder-punch", "thunder-wave", "skitter-smack", "gunk-shot", "poison-jab", "acid-spray", "sludge-wave", "sludge-bomb", "venoshock", "clear-smog", "corrosive-gas", "toxic-spikes", "gastro-acid", "acid-armor", "toxic", "earthquake", "bulldoze", "mud-shot", "mud-slap", "ice-punch", "ice-beam", "body-press", "brick-break", "zen-headbutt", "rest", "amnesia", "shadow-ball", "curse", "destiny-bond", "fling", "thief", "knock-off",
  ]),
  dataset(["gogoat"], [
    "giga-impact", "double-edge", "body-slam", "facade", "endeavor", "hyper-beam", "round", "snore", "helping-hand", "sleep-talk", "milk-drink", "endure", "protect", "substitute", "roar", "leaf-blade", "seed-bomb", "horn-leech", "grassy-glide", "trailblaze", "bullet-seed", "leaf-storm", "solar-beam", "energy-ball", "giga-drain", "grass-knot", "grassy-terrain", "worry-seed", "synthesis", "growth", "leech-seed", "sunny-day", "surf", "rain-dance", "wild-charge", "megahorn", "aerial-ace", "rock-slide", "earthquake", "high-horsepower", "dig", "stomping-tantrum", "bulldoze", "mud-shot", "mud-slap", "superpower", "brick-break", "bulk-up", "zen-headbutt", "rest", "throat-chop", "payback", "iron-tail", "play-rough",
  ]),
  dataset(["cinderace"], [
    "giga-impact", "double-edge", "mega-kick", "facade", "quick-attack", "feint", "super-fang", "hyper-beam", "round", "weather-ball", "snore", "helping-hand", "baton-pass", "court-change", "sleep-talk", "endure", "protect", "substitute", "focus-energy", "swords-dance", "trailblaze", "pyro-ball", "flare-blitz", "blaze-kick", "temper-flare", "fire-punch", "fire-fang", "flame-charge", "blast-burn", "overheat", "fire-blast", "heat-wave", "flamethrower", "burning-jealousy", "fire-spin", "will-o-wisp", "sunny-day", "electro-ball", "u-turn", "bounce", "acrobatics", "smack-down", "gunk-shot", "scorching-sands", "mud-shot", "mud-slap", "high-jump-kick", "low-sweep", "reversal", "counter", "low-kick", "focus-blast", "coaching", "bulk-up", "zen-headbutt", "rest", "agility", "shadow-ball", "sucker-punch", "assurance", "fling", "snarl", "taunt", "iron-head",
  ]),
  dataset(["toxtricity-amped"], [
    "giga-impact", "mega-kick", "facade", "endeavor", "flail", "hyper-beam", "boomburst", "hyper-voice", "uproar", "noble-roar", "tearful-look", "snore", "round", "helping-hand", "encore", "sleep-talk", "swagger", "endure", "scary-face", "protect", "substitute", "screech", "trailblaze", "fire-punch", "sunny-day", "rain-dance", "wild-charge", "thunder-punch", "thunder-fang", "nuzzle", "zap-cannon", "thunder", "thunderbolt", "overdrive", "discharge", "rising-voltage", "volt-switch", "electroweb", "charge-beam", "electro-ball", "electric-terrain", "eerie-impulse", "charge", "thunder-wave", "gunk-shot", "poison-jab", "acid-spray", "sludge-wave", "sludge-bomb", "venoshock", "toxic-spikes", "toxic", "drain-punch", "brick-break", "psychic-noise", "stored-power", "rest", "hex", "throat-chop", "thief", "payback", "fling", "snarl", "taunt", "shift-gear", "metal-sound", "charm",
  ]),
  dataset(["grapploct"], [
    "giga-impact", "body-slam", "facade", "feint", "bind", "hyper-beam", "round", "snore", "pain-split", "sleep-talk", "attract", "endure", "scary-face", "protect", "substitute", "liquidation", "dive", "waterfall", "hydro-pump", "muddy-water", "surf", "chilling-water", "soak", "lunge", "dig", "stomping-tantrum", "mud-shot", "ice-punch", "close-combat", "superpower", "drain-punch", "brick-break", "circle-throw", "storm-throw", "mach-punch", "reversal", "seismic-toss", "focus-blast", "coaching", "octolock", "bulk-up", "detect", "rest", "sucker-punch", "brutal-swing", "payback", "topsy-turvy", "taunt",
  ]),
  dataset(["perrserker"], [
    "giga-impact", "double-edge", "thrash", "body-slam", "slash", "facade", "covet", "fake-out", "endeavor", "flail", "hyper-beam", "hyper-voice", "uproar", "round", "snore", "helping-hand", "baton-pass", "sleep-talk", "swagger", "endure", "protect", "substitute", "screech", "swords-dance", "seed-bomb", "trailblaze", "sunny-day", "chilling-water", "rain-dance", "thunder", "thunderbolt", "thunder-wave", "x-scissor", "u-turn", "aerial-ace", "stealth-rock", "gunk-shot", "dig", "spikes", "close-combat", "brick-break", "bulk-up", "rest", "amnesia", "shadow-claw", "shadow-ball", "spite", "curse", "foul-play", "throat-chop", "crunch", "lash-out", "night-slash", "knock-off", "assurance", "thief", "bite", "payback", "dark-pulse", "fling", "nasty-plot", "fake-tears", "taunt", "iron-tail", "iron-head", "heavy-slam", "metal-burst", "gyro-ball", "steel-beam", "flash-cannon", "iron-defense", "metal-sound", "play-rough", "charm",
  ]),
  dataset(["sirfetchd"], [
    "slash", "facade", "covet", "quick-attack", "feint", "flail", "round", "snore", "simple-beam", "helping-hand", "sleep-talk", "attract", "endure", "protect", "substitute", "focus-energy", "swords-dance", "solar-blade", "leaf-blade", "grassy-glide", "sunny-day", "first-impression", "sky-attack", "brave-bird", "aerial-ace", "dual-wingbeat", "defog", "feather-dance", "poison-jab", "meteor-assault", "close-combat", "superpower", "brick-break", "counter", "final-gambit", "coaching", "quick-guard", "detect", "rest", "curse", "throat-chop", "night-slash", "knock-off", "brutal-swing", "assurance", "steel-wing", "iron-defense",
  ]),
  dataset(["pincurchin"], [
    "self-destruct", "giga-impact", "body-slam", "facade", "hyper-beam", "round", "snore", "acupressure", "pain-split", "sleep-talk", "endure", "protect", "substitute", "recover", "liquidation", "hydro-pump", "muddy-water", "surf", "scald", "chilling-water", "rain-dance", "supercell-slam", "wild-charge", "zing-zap", "thunder", "thunderbolt", "discharge", "rising-voltage", "electroweb", "charge-beam", "electro-ball", "electric-terrain", "charge", "thunder-wave", "pin-missile", "poison-jab", "venoshock", "toxic-spikes", "spikes", "reversal", "rest", "curse", "hex", "throat-chop", "sucker-punch", "assurance", "payback", "memento",
  ]),
  dataset(["pawmot"], [
    "giga-impact", "double-edge", "facade", "fake-out", "quick-attack", "super-fang", "hyper-beam", "revival-blessing", "entrainment", "wish", "helping-hand", "encore", "baton-pass", "sleep-talk", "endure", "protect", "substitute", "seed-bomb", "grass-knot", "fire-punch", "sunny-day", "rain-dance", "double-shock", "supercell-slam", "wild-charge", "thunder-punch", "thunder-fang", "nuzzle", "thunder", "thunderbolt", "discharge", "volt-switch", "electroweb", "charge-beam", "electro-ball", "electric-terrain", "eerie-impulse", "charge", "thunder-wave", "rock-tomb", "dig", "ice-punch", "focus-punch", "close-combat", "body-press", "brick-break", "upper-hand", "low-sweep", "mach-punch", "low-kick", "focus-blast", "coaching", "bulk-up", "agility", "throat-chop", "crunch", "knock-off", "thief", "bite", "fling", "play-rough", "charm", "sweet-kiss",
  ]),
  dataset(["mabosstiff"], [
    "giga-impact", "double-edge", "body-slam", "facade", "endeavor", "hyper-beam", "hyper-voice", "helping-hand", "pain-split", "sleep-talk", "swagger", "endure", "scary-face", "protect", "substitute", "focus-energy", "roar", "trailblaze", "fire-fang", "sunny-day", "rain-dance", "wild-charge", "thunder-fang", "dig", "ice-fang", "reversal", "psychic-fangs", "rest", "destiny-bond", "spite", "curse", "outrage", "jaw-lock", "crunch", "lash-out", "thief", "bite", "payback", "comeuppance", "dark-pulse", "snarl", "fake-tears", "taunt", "play-rough",
  ]),
];

const unknownMoves = new Set();
function resolveMove(id) {
  if (moveById.has(id)) return { kind: "master", move: moveById.get(id) };
  if (specialMoves.has(id)) return { kind: "special", move: specialMoves.get(id) };
  unknownMoves.add(id);
  return { kind: "special", move: special(id, id) };
}

const resolvedDatasets = datasets.map((entry) => {
  const verifiedIds = [...new Set(entry.ids)];
  const resolved = verifiedIds.map(resolveMove);
  const masterIds = resolved.filter(({ kind }) => kind === "master").map(({ move }) => move.id);
  const recordOnlyMoves = resolved.filter(({ kind }) => kind === "special").map(({ move }) => move);
  const searchableIds = masterIds.filter((id) => {
    const move = moveById.get(id);
    return move.searchable !== false && move.power > 0 && ["physical", "special"].includes(move.category);
  });
  return { ...entry, verifiedIds, masterIds, recordOnlyMoves, searchableIds };
});
if (unknownMoves.size) throw new Error(`Unknown move ids: ${[...unknownMoves].sort().join(", ")}`);

const targetIds = new Set(resolvedDatasets.flatMap(({ forms }) => forms));
for (const entry of pokemon) if (targetIds.has(entry.id)) entry.championsTarget = true;
for (const id of targetIds) if (!pokemon.some((entry) => entry.id === id)) throw new Error(`Unknown Pokémon id: ${id}`);
fs.writeFileSync(pokemonPath, `${JSON.stringify(pokemon, null, 2)}\n`);

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
      ],
    };
    fs.writeFileSync(entryPath, `${JSON.stringify(record, null, 2)}\n`);
    learnsets[formId] = [...entry.searchableIds];
  }
  for (const id of entry.masterIds) moveById.get(id).championsTarget = true;
  console.log(`${entry.forms.join(",")} verified=${entry.verifiedIds.length} searchable=${entry.searchableIds.length}`);
}

fs.writeFileSync(movesPath, `${JSON.stringify(moves, null, 2)}\n`);
fs.writeFileSync(learnsetsPath, `${JSON.stringify(learnsets, null, 2)}\n`);
