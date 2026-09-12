import fs from "node:fs";
import path from "node:path";

const repoDir = process.cwd();
const battleEffectsPath = path.join(repoDir, "data", "battle-effects.json");
const recordPath = path.join(repoDir, "records", "champions-pokemon", "entries", "eelektross-mega.json");

const battleEffects = JSON.parse(fs.readFileSync(battleEffectsPath, "utf8"));
battleEffects.grounding ??= {};
battleEffects.grounding.levitate ??= {
  abilityId: "levitate",
  abilityName: "ふゆう",
  pokemonIds: [],
};
const levitatePokemonIds = battleEffects.grounding.levitate.pokemonIds ?? [];
if (!levitatePokemonIds.includes("eelektross-mega")) levitatePokemonIds.push("eelektross-mega");
battleEffects.grounding.levitate.pokemonIds = levitatePokemonIds;
fs.writeFileSync(battleEffectsPath, `${JSON.stringify(battleEffects, null, 2)}\n`);

const record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
const effectMemo = "ふゆう＋自分の技で相手を倒すと、自分の最も高い能力の能力ランクが1段階上がる";
record.abilities = (record.abilities ?? []).filter((ability) => ability.id !== "eelevate");
record.abilities.push({
  id: "eelevate",
  name: "うなぎのぼり",
  effectMemo,
  verification: {
    status: "inherited-unverified",
    sources: [],
    notes: ["ユーザー指示により追加。ダメージ計算には使用しない。"],
  },
});
fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);

console.log("eelektross-mega: うなぎのぼりを登録し、接地判定を非接地に更新しました。");
