const paths = {
  pokemon: "./data/pokemon.json",
  moves: "./data/moves.json",
  typeChart: "./data/type-chart.json",
  rules: "./data/champions-rules.json?v=20260712-2",
  availability: "./data/champions-availability.json?v=20260712-2",
};

const state = {
  pokemon: [],
  moves: [],
  typeChart: {},
  rules: null,
  availability: null,
};

let searchTimer = null;

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  form: document.querySelector("#searchForm"),
  defenderSelect: document.querySelector("#defenderSelect"),
  defenderSearch: document.querySelector("#defenderSearch"),
  defenderOptions: document.querySelector("#defenderOptions"),
  megaToggle: document.querySelector("#megaToggle"),
  battleRule: document.querySelector("#battleRule"),
  availabilityMode: document.querySelector("#availabilityMode"),
  currentHp: document.querySelector("#currentHp"),
  currentAtk: document.querySelector("#currentAtk"),
  currentDef: document.querySelector("#currentDef"),
  currentSpa: document.querySelector("#currentSpa"),
  currentSpd: document.querySelector("#currentSpd"),
  currentSpe: document.querySelector("#currentSpe"),
  currentHpPoints: document.querySelector("#currentHpPoints"),
  currentAtkPoints: document.querySelector("#currentAtkPoints"),
  currentDefPoints: document.querySelector("#currentDefPoints"),
  currentSpaPoints: document.querySelector("#currentSpaPoints"),
  currentSpdPoints: document.querySelector("#currentSpdPoints"),
  currentSpePoints: document.querySelector("#currentSpePoints"),
  remainingPoints: document.querySelector("#remainingPoints"),
  unallocatedPoints: document.querySelector("#unallocatedPoints"),
  attackerPoints: document.querySelector("#attackerPoints"),
  movePower: document.querySelector("#movePower"),
  includePriorityMoves: document.querySelector("#includePriorityMoves"),
  higherOffenseOnly: document.querySelector("#higherOffenseOnly"),
  stabOnly: document.querySelector("#stabOnly"),
  prioritizeMega: document.querySelector("#prioritizeMega"),
  summary: document.querySelector("#summary"),
  resultsBody: document.querySelector("#resultsBody"),
};

const jpCategory = {
  physical: "物理",
  special: "特殊",
};

const effectivenessLabel = new Map([
  [4, "4倍"],
  [2, "2倍"],
  [1, "等倍"],
  [0.5, "半減"],
  [0.25, "1/4"],
  [0, "無効"],
]);

const priorityMoveIds = new Set([
  "accelerock",
  "aqua-jet",
  "bullet-punch",
  "extreme-speed",
  "fake-out",
  "feint",
  "first-impression",
  "ice-shard",
  "jet-punch",
  "mach-punch",
  "quick-attack",
  "shadow-sneak",
  "sucker-punch",
  "thunderclap",
  "upper-hand",
  "vacuum-wave",
  "water-shuriken",
]);

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} の読込に失敗しました`);
  return response.json();
}

async function loadOptionalJson(path, fallback) {
  const response = await fetch(path);
  if (response.status === 404) return fallback;
  if (!response.ok) throw new Error(`${path} の読込に失敗しました`);
  return response.json();
}

async function init() {
  try {
    const [pokemon, moves, typeChart, rules, availability] = await Promise.all([
      loadJson(paths.pokemon),
      loadJson(paths.moves),
      loadJson(paths.typeChart),
      loadJson(paths.rules),
      loadOptionalJson(paths.availability, defaultAvailability()),
    ]);
    Object.assign(state, { pokemon, moves, typeChart, rules, availability });
    populatePokemonSelect();
    populateMovePowerOptions();
    updateCurrentStatsDefault();
    updateDataStatus();
    els.form.addEventListener("submit", onSubmit);
    document.querySelectorAll(".point-button").forEach((button) => {
      button.addEventListener("click", () => adjustPointInput(button));
    });
    els.defenderSelect.addEventListener("change", () => {
      updateCurrentStatsDefault();
      runSearch();
    });
    els.defenderSearch.addEventListener("input", () => renderPokemonOptions(els.defenderSearch.value));
    els.defenderSearch.addEventListener("focus", () => renderPokemonOptions(els.defenderSearch.value));
    els.defenderSearch.addEventListener("keydown", handlePokemonSearchKeydown);
    els.megaToggle.addEventListener("click", cycleMegaForm);
    document.querySelectorAll(".rule-toggle-button").forEach((button) => {
      button.addEventListener("click", () => selectBattleRule(button));
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest("#pokemonCombobox")) closePokemonOptions();
    });
    els.availabilityMode.addEventListener("change", () => {
      populatePokemonSelect();
      updateCurrentStatsDefault();
      updateDataStatus();
      runSearch();
    });
    ["currentHpPoints", "currentAtkPoints", "currentDefPoints", "currentSpaPoints", "currentSpdPoints", "currentSpePoints"].forEach((key) => {
      els[key].addEventListener("input", updateCurrentStatsDefault);
    });
    document.querySelectorAll(".nature-button").forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => toggleNatureButton(button));
    });
    document.querySelectorAll('.checkbox-group input[type="checkbox"]:not(#higherOffenseOnly):not(#stabOnly):not(#prioritizeMega)').forEach((checkbox) => {
      checkbox.addEventListener("change", () => handleOpponentFilterChange(checkbox));
    });
    els.higherOffenseOnly.addEventListener("change", runSearch);
    els.stabOnly.addEventListener("change", runSearch);
    els.prioritizeMega.addEventListener("change", runSearch);
    els.attackerPoints.addEventListener("input", scheduleSearch);
    els.movePower.addEventListener("input", scheduleSearch);
    els.includePriorityMoves.addEventListener("change", runSearch);
    runSearch();
  } catch (error) {
    els.dataStatus.textContent = "読込失敗";
    els.summary.innerHTML = `<span class="empty">${escapeHtml(error.message)}。ローカルファイルを直接開いた場合は、簡易サーバーから開いてください。</span>`;
  }
}

function populatePokemonSelect() {
  const selected = els.defenderSelect.value;
  const pokemonPool = getSortedPokemonPool();
  const pokemon = pokemonPool.find((item) => item.id === selected) ?? pokemonPool[0];
  if (!pokemon) return;
  els.defenderSelect.value = pokemon.id;
  els.defenderSearch.value = getPokemonDisplayName(pokemon);
  updateMegaToggle(pokemon);
  closePokemonOptions();
}

function populateMovePowerOptions() {
  const options = [];
  for (let power = 5; power <= 250; power += 5) {
    options.push(`<option value="${power}"></option>`);
  }
  document.querySelector("#movePowerOptions").innerHTML = options.join("");
}

function getSortedPokemonPool() {
  return [...getPokemonPool()].sort((a, b) => {
    const aName = a.name.jaHrkt ?? a.name.ja;
    const bName = b.name.jaHrkt ?? b.name.ja;
    return aName.localeCompare(bName, "ja");
  });
}

function normalizePokemonSearch(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

function getPokemonDisplayName(pokemon) {
  if (!pokemon.id.includes("-mega")) return pokemon.name.ja;
  const variant = pokemon.id.match(/-mega-([xyz])$/)?.[1]?.toUpperCase() ?? "";
  return `メガ${pokemon.name.ja}${variant}`;
}

function renderPokemonOptions(query) {
  const normalizedQuery = normalizePokemonSearch(query.trim());
  const asciiQuery = /^[a-z0-9\s-]+$/i.test(query.trim());
  const matches = getSortedPokemonPool()
    .map((pokemon) => ({ pokemon, score: getPokemonSearchScore(pokemon, normalizedQuery, asciiQuery) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => a.score - b.score)
    .map(({ pokemon }) => pokemon)
    .slice(0, 30);

  els.defenderOptions.innerHTML = matches.length
    ? matches.map((pokemon) => `
        <button type="button" class="pokemon-option" role="option" data-pokemon-id="${escapeHtml(pokemon.id)}">
          <span>${escapeHtml(getPokemonDisplayName(pokemon))}</span>
        </button>
      `).join("")
    : '<span class="pokemon-option-empty">該当するポケモンがいません</span>';
  els.defenderOptions.querySelectorAll(".pokemon-option").forEach((button) => {
    button.addEventListener("click", () => selectPokemon(button.dataset.pokemonId));
  });
  els.defenderOptions.hidden = false;
  els.defenderSearch.setAttribute("aria-expanded", "true");
}

function getPokemonSearchScore(pokemon, query, asciiQuery) {
  if (!query) return 0;
  const japaneseTerms = [getPokemonDisplayName(pokemon), pokemon.name.ja, pokemon.name.jaHrkt]
    .filter(Boolean)
    .map(normalizePokemonSearch);
  const alphabetTerms = [pokemon.name.en, pokemon.id]
    .filter(Boolean)
    .map(normalizePokemonSearch);
  const primaryTerms = asciiQuery ? alphabetTerms : japaneseTerms;
  const secondaryTerms = asciiQuery ? japaneseTerms : alphabetTerms;

  if (primaryTerms.some((term) => term.startsWith(query))) return 0;
  if (primaryTerms.some((term) => term.includes(query))) return 1;
  if (secondaryTerms.some((term) => term.startsWith(query))) return 2;
  if (secondaryTerms.some((term) => term.includes(query))) return 3;
  return Number.POSITIVE_INFINITY;
}

function selectPokemon(pokemonId) {
  const pokemon = getPokemonPool().find((item) => item.id === pokemonId);
  if (!pokemon) return;
  els.defenderSelect.value = pokemon.id;
  els.defenderSearch.value = getPokemonDisplayName(pokemon);
  updateMegaToggle(pokemon);
  closePokemonOptions();
  els.defenderSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function getMegaFamily(pokemon) {
  const rootId = pokemon.id.replace(/-mega(?:-[xyz])?$/, "");
  const pokemonPool = getPokemonPool();
  const base = pokemonPool.find((item) => item.id === rootId);
  if (!base) return [pokemon];
  const variantOrder = new Map([
    ["y", 0],
    ["x", 1],
    ["z", 2],
    ["", 3],
  ]);
  const megaForms = pokemonPool
    .filter((item) => item.id === `${rootId}-mega` || item.id.startsWith(`${rootId}-mega-`))
    .sort((a, b) => {
      const aVariant = a.id.match(/-mega(?:-([xyz]))?$/)?.[1] ?? "";
      const bVariant = b.id.match(/-mega(?:-([xyz]))?$/)?.[1] ?? "";
      return (variantOrder.get(aVariant) ?? 99) - (variantOrder.get(bVariant) ?? 99);
    });
  return [base, ...megaForms];
}

function updateMegaToggle(pokemon) {
  const family = getMegaFamily(pokemon);
  els.megaToggle.disabled = family.length < 2;
  els.megaToggle.title = family.length < 2 ? "メガシンカ形態はありません" : "メガシンカ形態を切り替え";
}

function cycleMegaForm() {
  const current = getPokemonPool().find((pokemon) => pokemon.id === els.defenderSelect.value);
  if (!current) return;
  const family = getMegaFamily(current);
  if (family.length < 2) return;
  const currentIndex = family.findIndex((pokemon) => pokemon.id === current.id);
  const next = family[(currentIndex + 1) % family.length];
  selectPokemon(next.id);
}

function selectBattleRule(selectedButton) {
  document.querySelectorAll(".rule-toggle-button").forEach((button) => {
    const selected = button === selectedButton;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  els.battleRule.value = selectedButton.dataset.rule;
  runSearch();
}

function closePokemonOptions() {
  els.defenderOptions.hidden = true;
  els.defenderSearch.setAttribute("aria-expanded", "false");
}

function handlePokemonSearchKeydown(event) {
  if (event.key === "Escape") {
    closePokemonOptions();
    return;
  }
  if (event.key === "Enter") {
    const firstOption = els.defenderOptions.querySelector(".pokemon-option");
    if (firstOption && !els.defenderOptions.hidden) {
      event.preventDefault();
      selectPokemon(firstOption.dataset.pokemonId);
    }
  }
}

function updateCurrentStatsDefault() {
  const defender = state.pokemon.find((item) => item.id === els.defenderSelect.value);
  if (!defender) return;
  const hpPoints = clamp(toInt(els.currentHpPoints.value), 0, state.rules.statPoint.maxPerStat);
  const atkPoints = clamp(toInt(els.currentAtkPoints.value), 0, state.rules.statPoint.maxPerStat);
  const defPoints = clamp(toInt(els.currentDefPoints.value), 0, state.rules.statPoint.maxPerStat);
  const spaPoints = clamp(toInt(els.currentSpaPoints.value), 0, state.rules.statPoint.maxPerStat);
  const spdPoints = clamp(toInt(els.currentSpdPoints.value), 0, state.rules.statPoint.maxPerStat);
  const spePoints = clamp(toInt(els.currentSpePoints.value), 0, state.rules.statPoint.maxPerStat);
  els.currentHp.value = calcHpStat(defender.baseStats.hp, hpPoints);
  els.currentAtk.value = calcNonHpStat(defender.baseStats.atk, atkPoints, getDefenderNatureMode("atk"));
  els.currentDef.value = calcNonHpStat(defender.baseStats.def, defPoints, getDefenderNatureMode("def"));
  els.currentSpa.value = calcNonHpStat(defender.baseStats.spa, spaPoints, getDefenderNatureMode("spa"));
  els.currentSpd.value = calcNonHpStat(defender.baseStats.spd, spdPoints, getDefenderNatureMode("spd"));
  els.currentSpe.value = calcNonHpStat(defender.baseStats.spe, spePoints, getDefenderNatureMode("spe"));
  const usedPoints = hpPoints + atkPoints + defPoints + spaPoints + spdPoints + spePoints;
  const unallocated = state.rules.statPoint.totalDefault - usedPoints;
  els.unallocatedPoints.textContent = Math.max(0, unallocated);
  els.unallocatedPoints.parentElement.classList.toggle("is-over", unallocated < 0);
}

function adjustPointInput(button) {
  const input = document.querySelector(`#${button.dataset.target}`);
  if (!input) return;
  input.value = clamp(
    toInt(input.value) + toInt(button.dataset.delta),
    state.rules.statPoint.min,
    state.rules.statPoint.maxPerStat,
  );
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function toggleNatureButton(button) {
  const wasSelected = button.classList.contains("is-selected");
  const { natureMode, natureStat } = button.dataset;

  document.querySelectorAll(`.nature-button[data-nature-mode="${natureMode}"]`).forEach((item) => {
    item.classList.remove("is-selected");
    item.setAttribute("aria-pressed", "false");
  });
  if (!wasSelected) {
    const opposite = natureMode === "boost" ? "drop" : "boost";
    const oppositeButton = document.querySelector(
      `.nature-button[data-nature-stat="${natureStat}"][data-nature-mode="${opposite}"]`,
    );
    oppositeButton?.classList.remove("is-selected");
    oppositeButton?.setAttribute("aria-pressed", "false");
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
  }
  updateCurrentStatsDefault();
  runSearch();
}

function handleOpponentFilterChange(checkbox) {
  const group = checkbox.closest("[data-filter-group]")?.dataset.filterGroup;
  if (!group) return;
  const checkboxes = [...document.querySelectorAll(`input[name="${group}"]`)];

  if (group === "attackKind" || group === "attackerNature") {
    const both = checkboxes.find((item) => item.value === "both");
    const individual = checkboxes.filter((item) => item.value !== "both");
    if (checkbox.value === "both") {
      individual.forEach((item) => { item.checked = checkbox.checked; });
    } else if (both) {
      both.checked = individual.every((item) => item.checked);
    }
  } else if (group === "effectiveness") {
    if (checkbox.value === "all" && checkbox.checked) {
      checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false;
      });
    } else if (checkbox.checked) {
      const all = checkboxes.find((item) => item.value === "all");
      if (all) all.checked = false;
    }
    if (!checkboxes.some((item) => item.checked)) checkbox.checked = true;
  } else if (group === "attackerPointsPreset") {
    if (!checkboxes.some((item) => item.checked)) checkbox.checked = true;
  } else {
    if (checkbox.checked) {
      checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false;
      });
    } else if (!checkboxes.some((item) => item.checked)) {
      checkbox.checked = true;
    }
  }
  if (group === "attackerPointsPreset") {
    const details = document.querySelector("#attackerPointsDetails");
    if (details) details.open = getCheckedValues(group).includes("custom");
  }
  runSearch();
}

function onSubmit(event) {
  event.preventDefault();
  runSearch();
}

function runSearch() {
  const pokemonPool = getPokemonPool();
  const defender = pokemonPool.find((item) => item.id === els.defenderSelect.value);
  if (!defender) {
    renderResults([], 0);
    return;
  }
  const input = readInput();
  const inputError = validatePointAllocation(input);
  if (inputError) {
    renderInputError(inputError);
    return;
  }
  const current = {
    hp: input.currentHp,
    def: input.currentDef,
    spd: input.currentSpd,
  };
  const candidates = buildDefensiveCandidates(input);
  const rows = [];
  const attackScenarios = buildAttackScenarios(defender, pokemonPool, input, current);

  for (const candidate of candidates) {
    const after = applyCandidateStats(defender, input, candidate);
    for (const scenario of attackScenarios) {
      const afterDamage = calcDamage({
        level: state.rules.level,
        power: scenario.move.power,
        attack: scenario.attackStat,
        defense: scenario.move.category === "physical" ? after.def : after.spd,
        stab: scenario.stab,
        effectiveness: scenario.effectiveness,
        rule: input.battleRule,
        isSpreadMove: scenario.move.isSpreadMove,
      });
      const afterMinDamage = calcDamage({
        level: state.rules.level,
        power: scenario.move.power,
        attack: scenario.attackStat,
        defense: scenario.move.category === "physical" ? after.def : after.spd,
        stab: scenario.stab,
        effectiveness: scenario.effectiveness,
        rule: input.battleRule,
        isSpreadMove: scenario.move.isSpreadMove,
        randomModifier: state.rules.damageRandomMin ?? 0.85,
      });
      const afterKoRate = calcOneHitKoRate({
        level: state.rules.level,
        power: scenario.move.power,
        attack: scenario.attackStat,
        defense: scenario.move.category === "physical" ? after.def : after.spd,
        stab: scenario.stab,
        effectiveness: scenario.effectiveness,
        rule: input.battleRule,
        isSpreadMove: scenario.move.isSpreadMove,
      }, after.hp, afterDamage, afterMinDamage);
      if (afterDamage === scenario.currentDamage && afterKoRate === scenario.currentKoRate) continue;
      rows.push({
        candidate,
        ...scenario,
        afterDamage,
        afterMinDamage,
        afterKoRate,
        diff: afterDamage - scenario.currentDamage,
        line: `${formatProbability(scenario.currentKoRate)}→${formatProbability(afterKoRate)}`,
      });
    }
  }

  rows.sort((a, b) => {
    const megaPriority = input.prioritizeMega
      ? Number(b.attacker.id.includes("-mega")) - Number(a.attacker.id.includes("-mega"))
      : 0;
    const probabilityImprovement = (b.currentKoRate - b.afterKoRate) - (a.currentKoRate - a.afterKoRate);
    return megaPriority || probabilityImprovement || a.diff - b.diff;
  });
  renderResults(rows.slice(0, 80), candidates.length);
}

function scheduleSearch() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(runSearch, 180);
}

function buildAttackScenarios(defender, pokemonPool, input, current) {
  const attackerById = new Map(pokemonPool.map((pokemon) => [pokemon.id, pokemon]));
  const attackerNatureModes = input.attackerNatures;
  const scenarios = [];

  for (const move of state.moves) {
    if (!isMoveAllowed(move.id)) continue;
    if (!matchesMovePower(move, input.movePower, input.powerComparison, input.includePriorityMoves)) continue;
    if (!matchesAttackKind(move.category, input.attackKinds)) continue;
    const effectiveness = calcEffectiveness(move.type, defender.types);
    if (effectiveness === 0 || !matchesEffectiveness(effectiveness, input.effectiveness)) continue;

    for (const attackerId of move.users) {
      const attacker = attackerById.get(attackerId);
      if (!attacker) continue;
      if (input.higherOffenseOnly && !matchesHigherOffense(attacker, move.category)) continue;
      const stab = attacker.types.includes(move.type) ? 1.5 : 1;
      if (input.stabOnly && stab === 1) continue;
      for (const attackerPoints of input.attackerPoints) {
        for (const attackerNature of attackerNatureModes) {
          const attackStat = calcAttackStat(attacker, move.category, attackerPoints, attackerNature);
          const currentDamage = calcDamage({
            level: state.rules.level,
            power: move.power,
            attack: attackStat,
            defense: move.category === "physical" ? current.def : current.spd,
            stab,
            effectiveness,
            rule: input.battleRule,
            isSpreadMove: move.isSpreadMove,
          });
          const currentMinDamage = calcDamage({
            level: state.rules.level,
            power: move.power,
            attack: attackStat,
            defense: move.category === "physical" ? current.def : current.spd,
            stab,
            effectiveness,
            rule: input.battleRule,
            isSpreadMove: move.isSpreadMove,
            randomModifier: state.rules.damageRandomMin ?? 0.85,
          });
          const currentKoRate = calcOneHitKoRate({
            level: state.rules.level,
            power: move.power,
            attack: attackStat,
            defense: move.category === "physical" ? current.def : current.spd,
            stab,
            effectiveness,
            rule: input.battleRule,
            isSpreadMove: move.isSpreadMove,
          }, current.hp, currentDamage, currentMinDamage);
          scenarios.push({
            attacker,
            move,
            attackStat,
            attackerPoints,
            attackerNature,
            effectiveness,
            stab,
            currentDamage,
            currentMinDamage,
            currentKoRate,
          });
        }
      }
    }
  }
  return scenarios;
}

function readInput() {
  return {
    battleRule: els.battleRule.value,
    currentHp: toInt(els.currentHp.value),
    currentDef: toInt(els.currentDef.value),
    currentSpd: toInt(els.currentSpd.value),
    currentHpPoints: toInt(els.currentHpPoints.value),
    currentAtkPoints: toInt(els.currentAtkPoints.value),
    currentDefPoints: toInt(els.currentDefPoints.value),
    currentSpaPoints: toInt(els.currentSpaPoints.value),
    currentSpdPoints: toInt(els.currentSpdPoints.value),
    currentSpePoints: toInt(els.currentSpePoints.value),
    defenderNatureBoost: getSelectedNatureStat("boost"),
    defenderNatureDrop: getSelectedNatureStat("drop"),
    remainingPoints: toInt(els.remainingPoints.value),
    attackKinds: getCheckedValues("attackKind").filter((value) => value !== "both"),
    attackerPoints: readAttackerPoints(),
    attackerNatures: getCheckedValues("attackerNature").filter((value) => value !== "both"),
    effectiveness: getCheckedValues("effectiveness"),
    movePower: els.movePower.value === "" ? null : clamp(toInt(els.movePower.value), 1, 250),
    powerComparison: getCheckedValues("powerComparison")[0] ?? "gte",
    includePriorityMoves: els.includePriorityMoves.checked,
    higherOffenseOnly: els.higherOffenseOnly.checked,
    stabOnly: els.stabOnly.checked,
    prioritizeMega: els.prioritizeMega.checked,
  };
}

function validatePointAllocation(input) {
  const { min, maxPerStat, totalDefault } = state.rules.statPoint;
  const currentPoints = [
    input.currentHpPoints,
    input.currentAtkPoints,
    input.currentDefPoints,
    input.currentSpaPoints,
    input.currentSpdPoints,
    input.currentSpePoints,
  ];

  if (currentPoints.some((value) => value < min || value > maxPerStat)) {
    return `現在のH/A/B/C/D/Sポイントは${min}〜${maxPerStat}で入力してください。`;
  }
  if (input.remainingPoints < min || input.remainingPoints > totalDefault) {
    return `残りポイントは${min}〜${totalDefault}で入力してください。`;
  }

  const total = currentPoints.reduce((sum, value) => sum + value, input.remainingPoints);
  if (total > totalDefault) {
    return `現在のH/A/B/C/D/Sポイントと残りポイントの合計は${totalDefault}以下にしてください（現在: ${total}）。`;
  }
  return null;
}

function defaultAvailability() {
  return {
    restrictPokemon: false,
    pokemon: [],
    restrictMoves: false,
    moves: [],
  };
}

function useChampionsFilter() {
  return els.availabilityMode.value === "final" || els.availabilityMode.value === "champions";
}

function getPokemonPool() {
  if (!useChampionsFilter() || !state.availability?.restrictPokemon) return state.pokemon;
  const allowed = new Set(state.availability.pokemon ?? []);
  const allowedNames = new Set(
    state.pokemon
      .filter((pokemon) => allowed.has(pokemon.id))
      .map((pokemon) => pokemon.name.ja),
  );
  return state.pokemon.filter((pokemon) => {
    if (allowed.has(pokemon.id)) return true;
    return pokemon.id.includes("-mega") && allowedNames.has(pokemon.name.ja);
  });
}

function isMoveAllowed(moveId) {
  if (!useChampionsFilter() || !state.availability?.restrictMoves) return true;
  return new Set(state.availability.moves ?? []).has(moveId);
}

function updateDataStatus() {
  const pokemonPool = getPokemonPool();
  const mode = els.availabilityMode.value === "final"
    ? "チャンピオンズ（仮）"
    : useChampionsFilter() ? "確認済みポケモン" : "全データ";
  const pokemonNote = useChampionsFilter() && !state.availability?.restrictPokemon ? " / ポケモン未絞込" : "";
  const moveNote = useChampionsFilter() && !state.availability?.restrictMoves ? " / 技は全データ（未検証）" : "";
  els.dataStatus.textContent = `${mode}: ${pokemonPool.length}匹 / ${state.moves.length}技${pokemonNote}${moveNote}`;
}

function buildDefensiveCandidates(input) {
  const max = state.rules.statPoint.maxPerStat;
  const candidates = [];
  for (let hpAdd = 0; hpAdd <= input.remainingPoints; hpAdd++) {
    for (let defAdd = 0; defAdd <= input.remainingPoints - hpAdd; defAdd++) {
      const spdAdd = input.remainingPoints - hpAdd - defAdd;
      if (input.currentHpPoints + hpAdd > max) continue;
      if (input.currentDefPoints + defAdd > max) continue;
      if (input.currentSpdPoints + spdAdd > max) continue;
      candidates.push({ hpAdd, defAdd, spdAdd });
    }
  }
  return candidates;
}

function applyCandidateStats(defender, input, candidate) {
  return {
    hp: calcHpStat(defender.baseStats.hp, input.currentHpPoints + candidate.hpAdd),
    def: calcNonHpStat(
      defender.baseStats.def,
      input.currentDefPoints + candidate.defAdd,
      getInputNatureMode(input, "def"),
    ),
    spd: calcNonHpStat(
      defender.baseStats.spd,
      input.currentSpdPoints + candidate.spdAdd,
      getInputNatureMode(input, "spd"),
    ),
  };
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function readAttackerPoints() {
  const presets = getCheckedValues("attackerPointsPreset");
  const values = presets.map((preset) => {
    const value = preset === "custom" ? toInt(els.attackerPoints.value) : toInt(preset);
    return clamp(value, 0, state.rules.statPoint.maxPerStat);
  });
  return [...new Set(values.length ? values : [32])];
}

function getDefenderNatureMode(statKey) {
  if (getSelectedNatureStat("boost") === statKey) return "boost";
  if (getSelectedNatureStat("drop") === statKey) return "drop";
  return "neutral";
}

function getSelectedNatureStat(mode) {
  return document.querySelector(`.nature-button.is-selected[data-nature-mode="${mode}"]`)?.dataset.natureStat ?? null;
}

function getInputNatureMode(input, statKey) {
  if (input.defenderNatureBoost === statKey) return "boost";
  if (input.defenderNatureDrop === statKey) return "drop";
  return "neutral";
}

function statPointToBonus(points) {
  return points;
}

function calcAttackStat(pokemon, category, statPoints, natureMode) {
  const statKey = category === "physical" ? "atk" : "spa";
  return calcNonHpStat(pokemon.baseStats[statKey], statPoints, natureMode);
}

function calcNonHpStat(baseStat, statPoints, natureMode) {
  const baseValue = Math.floor(((2 * baseStat + 31) * state.rules.level) / 100 + 5);
  const nature = state.rules.nature[natureMode] ?? state.rules.nature.neutral;
  return Math.floor((baseValue + statPointToBonus(statPoints)) * nature);
}

function calcHpStat(baseStat, statPoints) {
  return Math.floor(((2 * baseStat + 31) * state.rules.level) / 100 + state.rules.level + 10) + statPointToBonus(statPoints);
}

function calcDamage({ level, power, attack, defense, stab, effectiveness, rule, isSpreadMove, randomModifier = state.rules.damageRandomMax }) {
  const levelFactor = Math.floor((2 * level) / 5 + 2);
  const basePowerDamage = Math.floor((levelFactor * power * attack) / defense);
  const baseDamage = Math.floor(basePowerDamage / 50) + 2;
  const doubleModifier = rule === "double" && isSpreadMove ? state.rules.doubleSpreadModifier : 1;

  let damage = baseDamage;
  damage = applyDamageModifier(damage, doubleModifier);
  damage = applyDamageModifier(damage, randomModifier);
  damage = applyDamageModifier(damage, stab);
  damage = applyTypeEffectiveness(damage, effectiveness);
  return damage;
}

function applyDamageModifier(damage, modifier) {
  const fixedPointModifier = Math.trunc(modifier * 4096);
  return Math.trunc((Math.trunc(damage * fixedPointModifier) + 2048 - 1) / 4096);
}

function applyTypeEffectiveness(damage, effectiveness) {
  if (effectiveness >= 1) {
    for (let multiplier = 1; multiplier < effectiveness; multiplier *= 2) {
      damage *= 2;
    }
    return damage;
  }

  for (let multiplier = 1; multiplier > effectiveness; multiplier /= 2) {
    damage = Math.trunc(damage / 2);
  }
  return damage;
}

function calcEffectiveness(moveType, defenderTypes) {
  return defenderTypes.reduce((total, defenderType) => {
    return total * (state.typeChart[moveType]?.[defenderType] ?? 1);
  }, 1);
}

function matchesAttackKind(category, filters) {
  if (!["physical", "special"].includes(category)) return false;
  return filters.includes(category);
}

function calcOneHitKoRate(damageInput, hp, maxDamage, minDamage) {
  if (maxDamage < hp) return 0;
  if (minDamage >= hp) return 100;
  let koRolls = 1;
  for (let randomPercent = 86; randomPercent < 100; randomPercent++) {
    const damage = calcDamage({ ...damageInput, randomModifier: randomPercent / 100 });
    if (damage >= hp) koRolls += 1;
  }
  return (koRolls / 16) * 100;
}

function formatProbability(value) {
  if (value === 0 || value === 100) return `${value}％`;
  return `${value.toFixed(1)}％`;
}

function matchesEffectiveness(value, filter) {
  return filter.includes("all") || filter.some((item) => Number(item) === value);
}

function matchesHigherOffense(pokemon, category) {
  if (category === "physical") return pokemon.baseStats.atk >= pokemon.baseStats.spa;
  if (category === "special") return pokemon.baseStats.spa >= pokemon.baseStats.atk;
  return false;
}

function matchesMovePower(move, threshold, comparison, includePriorityMoves) {
  if (includePriorityMoves && (move.priority > 0 || priorityMoveIds.has(move.id))) return true;
  if (threshold === null) return true;
  if (comparison === "gt") return move.power > threshold;
  return comparison === "lte" ? move.power <= threshold : move.power >= threshold;
}

function renderResults(rows, candidateCount) {
  const lineChanges = rows.filter((row) => row.afterKoRate < row.currentKoRate).length;
  const best = rows[0];
  els.summary.innerHTML = `
    <span>配分候補<strong>${candidateCount}</strong></span>
    <span>表示件数<strong>${rows.length}</strong></span>
    <span>KO率低下<strong>${lineChanges}</strong></span>
    <span>おすすめ<strong>${best ? formatCandidate(best.candidate) : "-"}</strong></span>
  `;

  if (!rows.length) {
    els.resultsBody.innerHTML = `<tr><td colspan="10" class="empty">条件に合う変化はありませんでした。</td></tr>`;
    return;
  }

  els.resultsBody.innerHTML = rows
    .map((row) => {
      const lineClass = row.afterKoRate < row.currentKoRate ? "line-good" : "";
      return `
        <tr>
          <td class="result-line ${lineClass}">${row.line}</td>
          <td class="result-allocation">${formatCandidate(row.candidate)}</td>
          <td class="result-attacker">${getPokemonDisplayName(row.attacker)}</td>
          <td class="result-move">${row.move.name.ja}</td>
          <td class="result-current">${row.currentDamage}～${row.currentMinDamage}</td>
          <td class="result-after">${row.afterDamage}～${row.afterMinDamage}</td>
          <td class="result-diff">${row.diff}</td>
          <td class="result-effectiveness">${effectivenessLabel.get(row.effectiveness) ?? row.effectiveness}</td>
          <td class="result-attack">${row.attackStat}（${row.attackerPoints}pt・${row.attackerNature === "boost" ? "補正有" : "補正無"}）</td>
          <td class="result-category">${jpCategory[row.move.category]}</td>
        </tr>
      `;
    })
    .join("");
}

function renderInputError(message) {
  els.summary.innerHTML = `<span class="empty">${escapeHtml(message)}</span>`;
  els.resultsBody.innerHTML = `<tr><td colspan="10" class="empty">${escapeHtml(message)}</td></tr>`;
}

function formatCandidate(candidate) {
  return `H+${candidate.hpAdd} B+${candidate.defAdd} D+${candidate.spdAdd}`;
}

function toInt(value) {
  return Number.parseInt(value, 10) || 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
