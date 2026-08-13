import fs from "node:fs";
import path from "node:path";

const repoDir = process.cwd();
const entriesDir = path.join(repoDir, "records", "champions-pokemon", "entries");
const movesPath = path.join(repoDir, "data", "moves.json");
const learnsetsPath = path.join(repoDir, "data", "learnsets.json");
const moves = JSON.parse(fs.readFileSync(movesPath, "utf8"));
const learnsets = JSON.parse(fs.readFileSync(learnsetsPath, "utf8"));
const moveById = new Map(moves.map((move) => [move.id, move]));

const special = (id, name, type = "normal", category = "status", categories = []) => ({
  id, name, type, category, power: 0, searchable: false,
  isContactMove: false, moveCategories: categories,
});

// This catalog is only used when a video-confirmed move is not part of the
// damage-search master move list. It keeps status/variable-power moves in each
// Pokémon record without making them searchable.
const extra = new Map([
  special("roar", "ほえる"), special("scary-face", "こわいかお"),
  special("swords-dance", "つるぎのまい", "normal", "status", ["dance"]),
  special("attract", "メロメロ"), special("howl", "とおぼえ"),
  special("sweet-scent", "あまいかおり"), special("tickle", "くすぐる"),
  special("wish", "ねがいごと"), special("encore", "アンコール"),
  special("pain-split", "いたみわけ"), special("whirlwind", "ふきとばし", "flying"),
  special("focus-energy", "きあいだめ"), special("belly-drum", "はらだいこ"),
  special("screech", "いやなおと"), special("disable", "かなしばり"),
  special("aqua-ring", "アクアリング", "water"), special("acid-armor", "とける", "poison"),
  special("thunder-wave", "でんじは", "electric"), special("will-o-wisp", "おにび", "fire"),
  special("tailwind", "おいかぜ", "flying"), special("roost", "はねやすめ", "flying", "status", ["heal"]),
  special("wide-guard", "ワイドガード", "rock"), special("stealth-rock", "ステルスロック", "rock"),
  special("sandstorm", "すなあらし", "rock"), special("agility", "こうそくいどう", "psychic"),
  special("curse", "のろい", "ghost"), special("dragon-dance", "りゅうのまい", "dragon", "status", ["dance"]),
  special("taunt", "ちょうはつ", "dark"), special("yawn", "あくび"),
  special("liquidation-variable", "なげつける", "dark", "physical"),
  special("fling", "なげつける", "dark", "physical"), special("mud-slap", "どろかけ", "ground", "special"),
  special("mirror-coat", "ミラーコート", "psychic", "special"), special("counter", "カウンター", "fighting", "physical"),
  special("haze", "くろいきり", "ice"), special("snowscape", "ゆきげしき", "ice"),
  special("aurora-veil", "オーロラベール", "ice"), special("light-screen", "ひかりのかべ", "psychic"),
  special("reflect", "リフレクター", "psychic"), special("hypnosis", "さいみんじゅつ", "psychic"),
  special("confuse-ray", "あやしいひかり", "ghost"), special("spite", "うらみ", "ghost"),
  special("nasty-plot", "わるだくみ", "dark"), special("fake-tears", "うそなき", "dark"),
  special("memento", "おきみやげ", "dark"), special("charm", "あまえる", "fairy"),
  special("baby-doll-eyes-special", "つぶらなひとみ", "fairy"), special("sweet-kiss", "てんしのキッス", "fairy"),
  special("follow-me", "このゆびとまれ"), special("after-you", "おさきにどうぞ"),
  special("psych-up", "じこあんじ"), special("gravity", "じゅうりょく", "psychic"),
  special("wonder-room", "ワンダールーム", "psychic"), special("magic-room", "マジックルーム", "psychic"),
  special("trick-room", "トリックルーム", "psychic"), special("heal-pulse", "いやしのはどう", "psychic", "status", ["heal"]),
  special("healing-wish", "いやしのねがい", "psychic", "status", ["heal"]),
  special("cosmic-power", "コスモパワー", "psychic"), special("imprison", "ふういん", "psychic"),
  special("amnesia", "ドわすれ", "psychic"), special("power-swap", "パワースワップ", "psychic"),
  special("guard-swap", "ガードスワップ", "psychic"), special("guard-split", "ガードシェア", "psychic"),
  special("role-play", "なりきり", "psychic"), special("moonlight", "つきのひかり", "fairy", "status", ["heal"]),
  special("misty-terrain-special", "ミストフィールド", "fairy"),
  special("flatter", "おだてる", "dark"), special("corrosive-gas", "ふしょくガス", "poison"),
  special("toxic", "どくどく", "poison"), special("toxic-spikes", "どくびし", "poison"),
  special("poison-powder", "どくのこな", "poison", "status", ["powder"]),
  special("string-shot", "いとをはく", "bug"), special("iron-defense", "てっぺき", "steel"),
  special("feather-dance", "フェザーダンス", "flying", "status", ["dance"]),
  special("charge", "じゅうでん", "electric"), special("eerie-impulse", "かいでんぱ", "electric"),
  special("electric-terrain", "エレキフィールド", "electric"), special("double-team", "かげぶんしん"),
  special("growth", "せいちょう"), special("leech-seed", "やどりぎのタネ", "grass"),
  special("ingrain", "ねをはる", "grass", "status", ["heal"]), special("worry-seed", "なやみのタネ", "grass"),
  special("sleep-powder", "ねむりごな", "grass", "status", ["powder"]),
  special("poison-gas", "どくガス", "poison"), special("slack-off", "なまける", "normal", "status", ["heal"]),
  special("shell-smash", "からをやぶる"), special("life-dew", "いのちのしずく", "water", "status", ["heal"]),
  special("heat-crash", "ヒートスタンプ", "fire", "physical"),
  special("stomping-tantrum", "じだんだ", "ground", "physical"),
  special("dragon-cheer", "ドラゴンエール", "dragon"),
  special("beat-up", "ふくろだたき", "dark", "physical"),
  special("gyro-ball", "ジャイロボール", "steel", "physical"),
  special("electro-ball", "エレキボール", "electric", "special"),
  special("reversal", "きしかいせい", "fighting", "physical"),
  special("night-shade", "ナイトヘッド", "ghost", "special"),
  special("flail", "じたばた", "normal", "physical"),
  special("dragon-dive", "ドラゴンダイブ", "dragon", "physical"),
  special("iron-defense", "てっぺき", "steel"), special("teeter-dance", "フラフラダンス", "normal", "status", ["dance"]),
  special("sing", "うたう"), special("metronome", "ゆびをふる"),
  special("recover", "じこさいせい", "normal", "status", ["heal"]),
  special("spit-up", "はきだす", "normal", "special"),
  special("strength-sap", "ちからをすいとる", "grass", "status", ["heal"]),
  special("stun-spore", "しびれごな", "grass", "status", ["powder"]),
  special("gastro-acid", "いえき", "poison"), special("sucker-punch", "ふいうち", "dark", "physical"),
  special("teleport", "テレポート", "psychic"), special("psychic-terrain", "サイコフィールド", "psychic"),
  special("destiny-bond", "みちづれ", "ghost"), special("mean-look", "くろいまなざし", "normal"),
  special("perish-song", "ほろびのうた", "normal"), special("minimize", "ちいさくなる"),
  special("bulk-up", "ビルドアップ", "fighting"), special("seismic-toss", "ちきゅうなげ", "fighting", "physical"),
  special("rage-fist", "ふんどのこぶし", "ghost", "physical"), special("upper-hand", "はやてがえし", "fighting", "physical"),
  special("low-kick", "けたぐり", "fighting", "physical"),
  special("arm-hammer", "アームハンマー", "fighting", "physical"),
  special("raging-bull-water", "レイジングブル", "water", "physical"),
  special("fissure", "じわれ", "ground", "physical"),
  special("heavy-slam", "ヘビーボンバー", "steel", "physical"),
].map((move) => [move.id, move]));

const v = (source, forms, ids) => ({ source, forms, ids });
const datasets = {
  venusaur: v("local-input/videos/HJOM8092.MP4", ["venusaur", "venusaur-mega"], [
    "giga-impact","double-edge","body-slam","facade","hyper-beam","round","terrain-pulse","weather-ball","snore","helping-hand","sweet-scent","sleep-talk","scary-face","endure","protect","substitute","roar","swords-dance","power-whip","petal-blizzard","seed-bomb","grassy-glide","trailblaze","bullet-seed","frenzy-plant","leaf-storm","petal-dance","solar-beam","energy-ball","giga-drain","grass-knot","grassy-terrain","synthesis","sunny-day","poison-jab","sludge-wave","sludge-bomb","venoshock","acid-spray","earthquake","bulldoze","earth-power","knock-off","outrage","worry-seed","ingrain","leech-seed","growth","sleep-powder","toxic","poison-powder","curse","light-screen","amnesia","charm"
  ]),
  charizard: v("local-input/videos/0006.mov", ["charizard", "charizard-mega-x", "charizard-mega-y"], [
    "giga-impact","double-edge","mega-kick","body-slam","facade","hyper-beam","round","weather-ball","snore","helping-hand","sleep-talk","endure","belly-drum","scary-face","protect","substitute","roar","swords-dance","solar-beam","flare-blitz","temper-flare","fire-punch","fire-fang","flame-charge","heat-crash","blast-burn","overheat","fire-blast","inferno","heat-wave","flamethrower","fire-spin","will-o-wisp","sunny-day","thunder-punch","fly","aerial-ace","acrobatics","hurricane","air-slash","air-cutter","roost","rock-slide","rock-tomb","ancient-power","sandstorm","earthquake","dig","bulldoze","scorching-sands","focus-punch","brick-break","counter","focus-blast","rest","shadow-claw","outrage","dragon-rush","dragon-claw","breaking-swipe","dragon-tail","scale-shot","dragon-pulse","dragon-cheer","dragon-dance","crunch","brutal-swing","bite","fling","beat-up","iron-tail","steel-wing"
  ]),
  blastoise: v("local-input/videos/HJOM8092.MP4", ["blastoise", "blastoise-mega"], [
    "giga-impact","double-edge","mega-kick","body-slam","facade","rapid-spin","hyper-beam","round","terrain-pulse","weather-ball","snore","shell-smash","yawn","helping-hand","sleep-talk","scary-face","protect","substitute","roar","wave-crash","aqua-tail","liquidation","dive","waterfall","flip-turn","aqua-jet","hydro-pump","hydro-cannon","water-spout","muddy-water","surf","water-pulse","chilling-water","whirlpool","life-dew","aqua-ring","rain-dance","rock-slide","rock-tomb","smack-down","earthquake","dig","bulldoze","mud-shot","ice-spinner","ice-punch","avalanche","blizzard","ice-beam","icy-wind","haze","focus-punch","body-press","brick-break","focus-blast","aura-sphere","zen-headbutt","mirror-coat","rest","outrage","dragon-pulse","crunch","bite","fling","dark-pulse","iron-tail","iron-head","gyro-ball","flash-cannon","iron-defense"
  ]),
  pidgeot: v("local-input/videos/HJOM8092.MP4", ["pidgeot", "pidgeot-mega"], [
    "giga-impact","quick-attack","facade","hyper-beam","round","attract","endure","protect","substitute","whirlwind","heat-wave","sunny-day","rain-dance","u-turn","sky-attack","brave-bird","fly","aerial-ace","dual-wingbeat","hurricane","air-slash","tailwind","roost","feather-dance","rest","agility","throat-chop","steel-wing"
  ]),
  beedrill: v("local-input/videos/HJOM8092.MP4", ["beedrill", "beedrill-mega"], [
    "giga-impact","double-edge","facade","double-hit","endeavor","hyper-beam","round","snore","baton-pass","sleep-talk","attract","endure","protect","substitute","swords-dance","screech","focus-energy","solar-beam","giga-drain","sunny-day","electroweb","lunge","x-scissor","leech-life","u-turn","bug-bite","pounce","fell-stinger","pin-missile","pollen-puff","bug-buzz","string-shot","aerial-ace","acrobatics","dual-wingbeat","air-cutter","cross-poison","poison-jab","toxic","toxic-spikes","venoshock","sludge-bomb","drill-run","brick-break","rest","agility","throat-chop","knock-off","brutal-swing","lash-out","dark-pulse","payback","iron-defense"
  ]),
  pikachu: v("local-input/videos/PLAZ2307.MP4", ["pikachu"], [
    "giga-impact","mega-kick","body-slam","facade","fake-out","quick-attack","feint","endeavor","hyper-beam","round","snore","tickle","wish","helping-hand","sleep-talk","encore","endure","protect","substitute","double-team","trailblaze","grass-knot","surf","rain-dance","volt-tackle","wild-charge","thunder-punch","nuzzle","zap-cannon","thunder","thunderbolt","discharge","rising-voltage","volt-switch","electroweb","charge-beam","electro-ball","electric-terrain","eerie-impulse","charge","thunder-wave","dig","focus-punch","focus-blast","reversal","counter","brick-break","drain-punch","rest","reflect","light-screen","agility","knock-off","throat-chop","fling","nasty-plot","fake-tears","iron-tail","play-rough","alluring-voice","dazzling-gleam","draining-kiss","charm","sweet-kiss"
  ]),
  clefable: v("local-input/videos/PLAZ2307.MP4", ["clefable", "clefable-mega"], [
    "giga-impact","double-edge","body-slam","facade","endeavor","hyper-beam","hyper-voice","tri-attack","round","snore","uproar","after-you","copycat","tickle","wish","helping-hand","follow-me","psych-up","encore","baton-pass","safeguard","sleep-talk","endure","protect","substitute","sing","solar-beam","grass-knot","fire-punch","fire-blast","flamethrower","mystical-fire","sunny-day","water-pulse","chilling-water","life-dew","rain-dance","thunder-punch","thunder","thunderbolt","charge-beam","thunder-wave","bounce","dual-wingbeat","air-slash","stealth-rock","meteor-beam","dig","ice-punch","blizzard","ice-beam","icy-wind","focus-punch","drain-punch","brick-break","focus-blast","zen-headbutt","future-sight","psychic","psyshock","stored-power","heal-pulse","wonder-room","healing-wish","gravity","calm-mind","cosmic-power","imprison","amnesia","rest","trick","skill-swap","reflect","light-screen","shadow-ball","night-shade","knock-off","throat-chop","fling","fake-tears","meteor-mash","play-rough","misty-explosion","moonblast","alluring-voice","dazzling-gleam","draining-kiss","misty-terrain","moonlight","charm","sweet-kiss"
  ]),
  ninetales: v("local-input/videos/PLAZ2307.MP4", ["ninetales"], [
    "giga-impact","double-edge","body-slam","facade","tail-slap","quick-attack","hyper-beam","round","weather-ball","snore","roar","helping-hand","psych-up","encore","baton-pass","pain-split","safeguard","sleep-talk","attract","endure","protect","substitute","disable","solar-beam","energy-ball","flare-blitz","flame-charge","overheat","fire-blast","inferno","heat-wave","flamethrower","mystical-fire","burning-jealousy","fire-spin","will-o-wisp","sunny-day","dig","scorching-sands","zen-headbutt","psyshock","extrasensory","stored-power","power-swap","healing-wish","calm-mind","imprison","hypnosis","rest","shadow-ball","hex","night-shade","spite","confuse-ray","foul-play","payback","dark-pulse","snarl","nasty-plot","fake-tears","memento","iron-tail","baby-doll-eyes-special","charm"
  ]),
  ninetalesAlola: v("local-input/videos/PLAZ2307.MP4", ["ninetales-alola"], [
    "giga-impact","double-edge","body-slam","facade","tail-slap","hyper-beam","round","weather-ball","snore","roar","helping-hand","pain-split","baton-pass","encore","psych-up","safeguard","sleep-talk","attract","endure","protect","substitute","disable","chilling-water","rain-dance","dig","avalanche","ice-shard","icicle-spear","triple-axel","blizzard","ice-beam","freeze-dry","icy-wind","snowscape","aurora-veil","zen-headbutt","psyshock","extrasensory","stored-power","wonder-room","power-swap","calm-mind","imprison","rest","hypnosis","agility","confuse-ray","spite","hex","foul-play","payback","dark-pulse","nasty-plot","fake-tears","iron-tail","play-rough","moonblast","dazzling-gleam","draining-kiss","baby-doll-eyes-special","misty-terrain-special","charm"
  ]),
  alakazam: v("local-input/videos/2026-08-13 23-43-08.mkv", ["alakazam", "alakazam-mega"], [
    "giga-impact","mega-kick","body-slam","facade","hyper-beam","tri-attack","snore","round","attract","endure","protect","substitute","recover","double-team","energy-ball","disable","ice-punch","thunder-wave","thunder-punch","rain-dance","sunny-day","fire-punch","drain-punch","magic-room","wonder-room","guard-split","trick-room","guard-swap","power-swap","role-play","trick","rest","reflect","light-screen","shadow-ball","throat-chop","fling","nasty-plot","taunt","iron-tail","dazzling-gleam"
  ]),
  machamp: v("local-input/videos/2026-08-13 23-43-08.mkv", ["machamp"], [
    "giga-impact","double-edge","mega-kick","body-slam","facade","hyper-beam","round","snore","scary-face","protect","substitute","focus-energy","fire-punch","fire-blast","flamethrower","sunny-day","rain-dance","thunder-punch","stone-edge","rock-slide","earthquake","high-horsepower","dig","stomping-tantrum","bulldoze","ice-punch","close-combat","superpower","low-kick","brick-break","drain-punch","dynamic-punch","cross-chop","focus-blast","rest","light-screen","darkest-lariat","throat-chop","knock-off","brutal-swing","assurance","mud-slap"
  ]),
  victreebel: v("local-input/videos/2026-08-13 23-43-08.mkv", ["victreebel", "victreebel-mega"], [
    "giga-impact","body-slam","facade","wrap","hyper-beam","round","weather-ball","snore","tickle","spit-up","sleep-talk","endure","scary-face","protect","substitute","bullet-seed","trailblaze","grassy-glide","seed-bomb","leaf-blade","power-whip","strength-sap","grass-knot","giga-drain","energy-ball","solar-beam","leaf-storm","grassy-terrain","worry-seed","ingrain","synthesis","sleep-powder","stun-spore","growth","sunny-day","bug-bite","leech-life","lunge","poison-powder","toxic","gastro-acid","toxic-spikes","reflect","rest","sucker-punch","knock-off","mud-slap"
  ]),
  slowbro: v("local-input/videos/2026-08-13 23-43-08.mkv", ["slowbro", "slowbro-mega"], [
    "giga-impact","body-slam","facade","hyper-beam","tri-attack","round","weather-ball","snore","teleport","slack-off","yawn","helping-hand","psych-up","safeguard","grass-knot","disable","liquidation","sunny-day","flamethrower","fire-blast","muddy-water","hydro-pump","razor-shell","waterfall","surf","scald","water-pulse","whirlpool","thunder-wave","rain-dance","chilling-water","earthquake","dig","bulldoze","mud-shot","ice-punch","avalanche","brick-break","drain-punch","focus-blast","zen-headbutt","future-sight","psychic","psyshock","stored-power","psychic-noise","expanding-force","psychic-terrain","heal-pulse","rest","amnesia","light-screen","shadow-ball","curse","foul-play","fling","nasty-plot","iron-tail","iron-defense"
  ]),
  slowbroGalar: v("local-input/videos/2026-08-13 23-43-08.mkv", ["slowbro-galar"], [
    "giga-impact","double-edge","body-slam","facade","hyper-beam","tri-attack","round","weather-ball","snore","teleport","slack-off","yawn","helping-hand","psych-up","safeguard","sleep-talk","belly-drum","scary-face","protect","substitute","disable","grass-knot","fire-blast","flamethrower","sunny-day","razor-shell","waterfall","dive","liquidation","hydro-pump","muddy-water","surf","water-pulse","chilling-water","whirlpool","thunder-wave","rain-dance","smack-down","rock-blast","power-gem","meteor-beam","sandstorm","shell-side-arm","sludge-wave","sludge-bomb","venoshock","acid-spray","toxic-spikes","toxic","earthquake","dig","bulldoze","mud-shot","ice-punch","ice-fang","avalanche","blizzard","ice-beam","icy-wind","snowscape","haze","body-press","drain-punch","brick-break","focus-blast","zen-headbutt","psychic-terrain","stored-power","psyshock","expanding-force","psychic","future-sight","trick","rest","amnesia","light-screen","curse","shadow-ball","foul-play","fling","nasty-plot","iron-tail","iron-defense"
  ]),
  gengar: v("local-input/videos/2026-08-13 23-43-08.mkv", ["gengar", "gengar-mega"], [
    "giga-impact","body-slam","facade","hyper-beam","round","snore","tera-blast","psych-up","pain-split","sleep-talk","mean-look","endure","perish-song","scary-face","protect","substitute","giga-drain","energy-ball","disable","thunder","thunder-punch","rain-dance","sunny-day","will-o-wisp","fire-punch","sludge-bomb","venoshock","clear-smog","acid-spray","corrosive-gas","toxic-spikes","toxic","ice-punch","icy-wind","haze","focus-punch","drain-punch","brick-break","trick-room","wonder-room","psychic-noise","psychic","imprison","skill-swap","trick","rest","hypnosis","poltergeist","shadow-ball","curse","spite","destiny-bond","night-shade","hex","knock-off","mud-slap","payback","fling","dark-pulse","nasty-plot","taunt","dazzling-gleam"
  ]),
  kangaskhan: v("local-input/videos/2026-08-13 23-43-08.mkv", ["kangaskhan", "kangaskhan-mega"], [
    "giga-impact","last-resort","double-edge","mega-kick","body-slam","facade","fake-out","double-hit","helping-hand","safeguard","sleep-talk","attract","endure","protect","substitute","focus-energy","disable","fire-blast","fire-punch","solar-beam","flamethrower","sunny-day","whirlpool","surf","hydro-pump","rain-dance","thunder-punch","thunder","thunderbolt","rock-slide","rock-tomb","sandstorm","ice-beam","icy-wind","arm-hammer","brick-break","drain-punch","dynamic-punch","focus-blast","low-kick","upper-hand","reversal","endeavor","rest","shadow-claw","shadow-ball","outrage","crunch","sucker-punch","assurance","mud-slap","bite","fling","beat-up","iron-tail"
  ]),
  starmie: v("local-input/videos/2026-08-13 23-43-08.mkv", ["starmie", "starmie-mega"], [
    "giga-impact","double-edge","facade","rapid-spin","hyper-beam","tri-attack","round","snore","safeguard","sleep-talk","endure","protect","substitute","minimize","recover","grass-knot","liquidation","dive","waterfall","chilling-water","whirlpool","rain-dance","thunder","thunderbolt","thunder-wave","meteor-beam","power-gem","ancient-power","ice-spinner","avalanche","blizzard","ice-beam","icy-wind","bulk-up","zen-headbutt","psycho-cut","rest","trick","skill-swap","cosmic-power","gravity","light-screen","agility","dazzling-gleam","flash-cannon","shadow-ball","confuse-ray"
  ]),
  pinsir: v("local-input/videos/2026-08-13 23-43-08.mkv", ["pinsir", "pinsir-mega"], [
    "giga-impact","thrash","body-slam","facade","quick-attack","double-hit","feint","bind","helping-hand","sleep-talk","attract","endure","protect","substitute","focus-energy","swords-dance","sunny-day","rain-dance","lunge","x-scissor","bug-bite","aerial-ace","stone-edge","rock-slide","rock-tomb","stealth-rock","earthquake","superpower","close-combat","bulldoze","dig","high-horsepower","focus-blast","seismic-toss","reversal","storm-throw","rage-fist","brick-break","bulk-up","throat-chop","brutal-swing","mud-slap"
  ]),
  tauros: v("local-input/videos/2026-08-13 23-43-08.mkv", ["tauros"], [
    "giga-impact","double-edge","thrash","raging-bull","body-slam","facade","endeavor","hyper-beam","uproar","round","snore","sleep-talk","endure","scary-face","protect","substitute","trailblaze","wild-charge","megahorn","stone-edge","rock-slide","rock-tomb","sandstorm","earthquake","high-horsepower","drill-run","dig","stomping-tantrum","bulldoze","close-combat","body-press","reversal","bulk-up","mud-slap","lash-out","outrage","curse","rest","zen-headbutt","iron-tail","iron-head","smart-strike"
  ]),
  taurosAqua: v("local-input/videos/2026-08-13 23-43-08.mkv", ["tauros-paldea-aqua-breed"], [
    "giga-impact","double-edge","thrash","raging-bull","body-slam","facade","endeavor","hyper-beam","uproar","round","snore","sleep-talk","endure","scary-face","protect","substitute","trailblaze","wave-crash","liquidation","aqua-jet","whirlpool","chilling-water","water-pulse","surf","hydro-pump","rain-dance","wild-charge","megahorn","stone-edge","rock-slide","rock-tomb","sandstorm","earthquake","high-horsepower","drill-run","dig","stomping-tantrum","reversal","outrage","curse","rest","zen-headbutt","lash-out","mud-slap","iron-tail","iron-head","smart-strike"
  ]),
  gyarados: v("local-input/videos/2026-08-13 23-50-10.mkv", ["gyarados", "gyarados-mega"], [
    "giga-impact","double-edge","thrash","body-slam","facade","endeavor","flail","hyper-beam","uproar","round","snore","helping-hand","sleep-talk","endure","scary-face","protect","substitute","roar","power-whip","surf","muddy-water","hydro-pump","waterfall","scald","water-pulse","chilling-water","whirlpool","rain-dance","thunder","thunderbolt","thunder-wave","bounce","hurricane","stone-edge","sandstorm","bulldoze","spite","outrage","dragon-dive","dragon-tail","scale-shot","dragon-pulse","dragon-dance","crunch","lash-out","brutal-swing","bite","payback","dark-pulse","taunt","iron-tail","iron-head"
  ]),
  vaporeon: v("local-input/videos/2026-08-13 23-50-10.mkv", ["vaporeon"], [
    "last-resort","double-edge","body-slam","facade","covet","quick-attack","flail","hyper-beam","copycat","snore","weather-ball","round","hyper-voice","tickle","yawn","wish","helping-hand","sleep-talk","baton-pass","endure","protect","substitute","trailblaze","roar","focus-energy","muddy-water","surf","scald","water-pulse","whirlpool","chilling-water","aqua-ring","rain-dance","acid-armor","dig","mud-slap","blizzard","rest","shadow-ball","curse","bite","fake-tears","iron-tail","alluring-voice","baby-doll-eyes-special","charm"
  ]),
  aerodactyl: v("local-input/videos/2026-08-13 23-50-10.mkv", ["aerodactyl", "aerodactyl-mega"], [
    "giga-impact","facade","hyper-beam","round","snore","sleep-talk","attract","endure","scary-face","protect","substitute","roar","whirlwind","fire-fang","fire-blast","heat-wave","flamethrower","sunny-day","rain-dance","thunder-fang","sky-attack","fly","aerial-ace","dual-wingbeat","hurricane","stone-edge","rock-slide","rock-tomb","meteor-beam","ancient-power","wide-guard","stealth-rock","sandstorm","earthquake","bulldoze","agility","rest","psychic-fangs","ice-fang","earth-power","curse","dragon-claw","dragon-pulse","dragon-dance","brutal-swing","crunch","bite","payback","taunt","iron-tail","iron-head","steel-wing"
  ]),
  snorlax: v("local-input/videos/2026-08-13 23-50-10.mkv", ["snorlax"], [
    "giga-impact","last-resort","double-edge","body-slam","facade","covet","flail","hyper-beam","hyper-voice","uproar","round","terrain-pulse","snore","encore","sleep-talk","protect","belly-drum","endure","attract","substitute","screech","seed-bomb","trailblaze","solar-beam","fire-punch","fire-blast","flamethrower","sunny-day","heat-crash","surf","hydro-pump","wild-charge","thunder-punch","thunder","thunderbolt","rock-slide","rock-tomb","gastro-acid","earthquake","high-horsepower","dig","stomping-tantrum","bulldoze","fissure","mud-slap","ice-punch","blizzard","ice-beam","icy-wind","brick-break","body-press","arm-hammer","superpower","focus-punch","curse","outrage","crunch","bite","fling","iron-head","heavy-slam","body-slam","charm"
  ]),
  meganium: v("local-input/videos/2026-08-13 23-50-10.mkv", ["meganium", "meganium-mega"], [
    "giga-impact","double-edge","body-slam","facade","endeavor","flail","hyper-beam","round","weather-ball","snore","helping-hand","sweet-scent","encore","safeguard","sleep-talk","endure","protect","substitute","swords-dance","solar-blade","frenzy-plant","leaf-storm","petal-dance","solar-beam","energy-ball","grassy-terrain","grass-knot","ingrain","synthesis","leech-seed","sunny-day","pollen-puff","ancient-power","poison-powder","earthquake","stomping-tantrum","bulldoze","body-press","mud-slap","earth-power","zen-headbutt","heal-pulse","rest","reflect","light-screen","dragon-tail","outrage","curse","knock-off","fake-tears","iron-tail","dazzling-gleam","charm"
  ]),
  typhlosion: v("local-input/videos/2026-08-13 23-50-10.mkv", ["typhlosion"], [
    "giga-impact","double-edge","mega-kick","body-slam","facade","covet","quick-attack","endeavor","hyper-beam","round","snore","howl","sleep-talk","endure","protect","substitute","roar","solar-beam","flare-blitz","eruption","burn-up","overheat","fire-blast","inferno","heat-wave","lava-plume","burning-jealousy","fire-spin","will-o-wisp","wild-charge","sunny-day","thunder-punch","aerial-ace","rock-slide","rock-tomb","earthquake","dig","stomping-tantrum","bulldoze","scorching-sands","focus-punch","brick-break","reversal","low-kick","focus-blast","shadow-claw","rest","extrasensory","zen-headbutt","shadow-ball","curse","fling","throat-chop","iron-head","gyro-ball","play-rough"
  ]),
  typhlosionHisui: v("local-input/videos/2026-08-13 23-50-10.mkv", ["typhlosion-hisui"], [
    "giga-impact","double-edge","mega-kick","body-slam","facade","covet","quick-attack","endeavor","hyper-beam","round","snore","howl","sleep-talk","endure","solar-beam","flare-blitz","eruption","blast-burn","flame-charge","fire-fang","fire-punch","temper-flare","overheat","fire-blast","inferno","heat-wave","flamethrower","lava-plume","mystical-fire","burning-jealousy","fire-spin","will-o-wisp","sunny-day","wild-charge","thunder-punch","aerial-ace","rock-slide","earthquake","dig","stomping-tantrum","bulldoze","focus-punch","brick-break","reversal","low-kick","focus-blast","poltergeist","shadow-claw","calm-mind","extrasensory","zen-headbutt","rest","shadow-ball","curse","spite","confuse-ray","play-rough","gyro-ball","iron-head"
  ]),
  feraligatr: v("local-input/videos/2026-08-13 23-50-10.mkv", ["feraligatr", "feraligatr-mega"], [
    "giga-impact","double-edge","thrash","mega-kick","body-slam","facade","endeavor","flail","sleep-talk","endure","scary-face","protect","substitute","roar","swords-dance","dive","liquidation","aqua-tail","trailblaze","hydro-cannon","aqua-jet","flip-turn","waterfall","hydro-pump","muddy-water","surf","water-pulse","chilling-water","whirlpool","rain-dance","aerial-ace","rock-slide","rock-tomb","ancient-power","earthquake","dig","stomping-tantrum","bulldoze","mud-shot","mud-slap","ice-punch","ice-fang","avalanche","blizzard","ice-beam","icy-wind","focus-punch","superpower","brick-break","shadow-claw","spite","curse","dragon-claw","outrage","dragon-tail","scale-shot","dragon-pulse","dragon-dance","lash-out","crunch","brutal-swing","mud-slap","bite","fling","snarl","flatter","fake-tears","iron-tail"
  ]),
  dragonite: v("local-input/videos/2026-08-13 23-50-10.mkv", ["dragonite", "dragonite-mega"], [
    "giga-impact","mega-kick","body-slam","extreme-speed","facade","wrap","hyper-beam","round","weather-ball","snore","helping-hand","safeguard","sleep-talk","endure","protect","substitute","heat-wave","fire-blast","aqua-tail","sunny-day","fire-spin","flamethrower","dive","hydro-pump","aqua-jet","waterfall","surf","water-pulse","chilling-water","rain-dance","thunder-punch","thunder","thunderbolt","thunder-wave","fly","aerial-ace","hurricane","air-slash","air-cutter","tailwind","rock-tomb","sandstorm","earthquake","stomping-tantrum","bulldoze","ice-spinner","icy-wind","snowscape","haze","focus-punch","superpower","body-press","brick-break","agility","light-screen","outrage","dragon-dive","dragon-claw","breaking-swipe","scale-shot","dragon-tail","draco-meteor","dragon-pulse","dragon-cheer","dragon-dance","brutal-swing","fling","iron-tail","iron-head","steel-wing"
  ]),
};

function resolve(id) {
  if (moveById.has(id)) return { kind: "master", move: moveById.get(id) };
  if (extra.has(id)) return { kind: "special", move: extra.get(id) };
  throw new Error(`Unknown move id: ${id}`);
}

for (const dataset of Object.values(datasets)) {
  const verifiedIds = [...new Set(dataset.ids)];
  const resolved = verifiedIds.map(resolve);
  const masterIds = resolved.filter((x) => x.kind === "master").map((x) => x.move.id);
  const specialMoves = resolved.filter((x) => x.kind === "special").map((x) => x.move);
  const searchableIds = masterIds.filter((id) => {
    const move = moveById.get(id);
    return move.searchable !== false && move.power > 0 && ["physical", "special"].includes(move.category);
  });

  for (const formId of dataset.forms) {
    const entryPath = path.join(entriesDir, `${formId}.json`);
    const record = JSON.parse(fs.readFileSync(entryPath, "utf8"));
    const previous = [...(record.learnset.moveIds ?? []), ...(record.learnset.specialMoves ?? []).map((m) => m.id)];
    record.learnset.moveIds = masterIds;
    record.learnset.specialMoves = specialMoves;
    record.learnset.verification = {
      status: "verified",
      sources: [dataset.source],
      verifiedMoveIds: verifiedIds,
      rejectedMoveIds: previous.filter((id) => !verifiedIds.includes(id)).sort(),
      notes: [
        `ゲーム内の「教える技」一覧を動画で全件確認（全${verifiedIds.length}技）。`,
        `耐久ラインサーチには固定威力の攻撃技${searchableIds.length}件だけを同期。変化技・未対応の変動威力技は個別記録のみに保存。`,
        formId !== dataset.forms[0] ? "通常形態のゲーム内一覧をメガ形態へ同期。" : "",
      ].filter(Boolean),
    };
    fs.writeFileSync(entryPath, `${JSON.stringify(record, null, 2)}\n`);
    learnsets[formId] = [...searchableIds];
  }
  for (const id of masterIds) moveById.get(id).championsTarget = true;
  console.log(`${dataset.forms.join(",")} verified=${verifiedIds.length} searchable=${searchableIds.length}`);
}

fs.writeFileSync(movesPath, `${JSON.stringify(moves, null, 2)}\n`);
fs.writeFileSync(learnsetsPath, `${JSON.stringify(learnsets, null, 2)}\n`);
