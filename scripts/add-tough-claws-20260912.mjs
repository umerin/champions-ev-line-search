import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const rootDir = resolve(scriptDir, "..");
const dataDir = resolve(rootDir, "data");
const recordsDir = resolve(rootDir, "records/champions-pokemon/entries");

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = async (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");

const pokemonIds = [
  "charizard-mega-x",
  "meowth-galar",
  "aerodactyl-mega",
  "metagross-mega",
  "binacle",
  "barbaracle",
  "barbaracle-mega",
  "lycanroc-dusk",
  "golisopod-mega",
  "perrserker",
];

const effect = {
  abilityId: "tough-claws",
  abilityName: "かたいツメ",
  pokemonIds,
  stage: "power",
  contactOnly: true,
  modifier: 1.300048828125,
};

const battleEffectsPath = resolve(dataDir, "battle-effects.json");
const battleEffects = await readJson(battleEffectsPath);
battleEffects.attacker.toughClaws = effect;
await writeJson(battleEffectsPath, battleEffects);

const ability = {
  id: effect.abilityId,
  name: effect.abilityName,
  verification: {
    status: "inherited-unverified",
    sources: [],
    notes: [
      "ユーザー指示により追加。接触技の威力を5325/4096倍で計算する。",
    ],
  },
};
const recordEffect = {
  scope: "attacker",
  effectKey: "toughClaws",
  definition: {
    abilityId: effect.abilityId,
    abilityName: effect.abilityName,
    stage: effect.stage,
    contactOnly: effect.contactOnly,
    modifier: effect.modifier,
  },
};

for (const pokemonId of pokemonIds) {
  const recordPath = resolve(recordsDir, `${pokemonId}.json`);
  try {
    const record = await readJson(recordPath);
    record.abilities ??= [];
    if (!record.abilities.some((entry) => entry.id === ability.id)) {
      record.abilities.push(ability);
    }
    record.battleEffects ??= [];
    if (!record.battleEffects.some((entry) => entry.effectKey === recordEffect.effectKey)) {
      record.battleEffects.push(recordEffect);
    }
    await writeJson(recordPath, record);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const listPath = resolve(dataDir, "実装済み特性リスト.txt");
const list = await readFile(listPath, "utf8");
if (!list.split(/\r?\n/).includes("かたいツメ")) {
  await writeFile(listPath, `${list.trimEnd()}\nかたいツメ\n`, "utf8");
}

console.log(JSON.stringify({ ability: ability.name, pokemonIds }, null, 2));
