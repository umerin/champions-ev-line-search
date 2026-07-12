const paths = {
  pokemon: "./data/pokemon.json",
  moves: "./data/moves.json",
  typeChart: "./data/type-chart.json",
  rules: "./data/champions-rules.json",
  availability: "./data/champions-availability.json",
};

const state = {
  pokemon: [],
  moves: [],
  typeChart: {},
  rules: null,
  availability: null,
};

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  form: document.querySelector("#searchForm"),
  defenderSelect: document.querySelector("#defenderSelect"),
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
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener("change", () => handleOpponentFilterChange(checkbox));
    });
    els.attackerPoints.addEventListener("input", runSearch);
    runSearch();
  } catch (error) {
    els.dataStatus.textContent = "読込失敗";
    els.summary.innerHTML = `<span class="empty">${escapeHtml(error.message)}。ローカルファイルを直接開いた場合は、簡易サーバーから開いてください。</span>`;
  }
}

function populatePokemonSelect() {
  const selected = els.defenderSelect.value;
  const pokemonPool = getPokemonPool();
  els.defenderSelect.innerHTML = pokemonPool
    .map((pokemon) => `<option value="${pokemon.id}">${pokemon.name.ja}</option>`)
    .join("");
  if (pokemonPool.some((pokemon) => pokemon.id === selected)) {
    els.defenderSelect.value = selected;
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

  if (group === "effectiveness") {
    if (checkbox.value === "all" && checkbox.checked) {
      checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false;
      });
    } else if (checkbox.checked) {
      const all = checkboxes.find((item) => item.value === "all");
      if (all) all.checked = false;
    }
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

  for (const candidate of candidates) {
    const after = applyCandidateStats(defender, input, candidate);
    for (const attacker of pokemonPool) {
      for (const move of state.moves) {
        if (!isMoveAllowed(move.id)) continue;
        if (!move.users.includes(attacker.id)) continue;
        if (!matchesAttackKind(move.category, input.attackKind)) continue;

        const effectiveness = calcEffectiveness(move.type, defender.types);
        if (!matchesEffectiveness(effectiveness, input.effectiveness)) continue;
        if (effectiveness === 0) continue;

        const attackerNatureModes = input.attackerNatures.includes("both")
          ? ["boost", "neutral"]
          : input.attackerNatures;
        for (const attackerNature of attackerNatureModes) {
          const attackStat = calcAttackStat(attacker, move.category, input.attackerPoints, attackerNature);
          const currentDamage = calcMaxDamage({
            level: state.rules.level,
            power: move.power,
            attack: attackStat,
            defense: move.category === "physical" ? current.def : current.spd,
            stab: attacker.types.includes(move.type) ? 1.5 : 1,
            effectiveness,
            rule: input.battleRule,
            isSpreadMove: move.isSpreadMove,
          });
          const afterDamage = calcMaxDamage({
            level: state.rules.level,
            power: move.power,
            attack: attackStat,
            defense: move.category === "physical" ? after.def : after.spd,
            stab: attacker.types.includes(move.type) ? 1.5 : 1,
            effectiveness,
            rule: input.battleRule,
            isSpreadMove: move.isSpreadMove,
          });

          const line = damageLine(current.hp, after.hp, currentDamage, afterDamage);
          if (afterDamage >= after.hp) continue;
          if (afterDamage === currentDamage && line === "変化なし") continue;
          rows.push({
            candidate,
            attacker,
            move,
            attackStat,
            attackerNature,
            effectiveness,
            currentDamage,
            afterDamage,
            diff: afterDamage - currentDamage,
            line,
          });
        }
      }
    }
  }

  rows.sort((a, b) => lineScore(b.line) - lineScore(a.line) || a.diff - b.diff);
  renderResults(rows.slice(0, 80), candidates.length);
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
    attackKind: getCheckedValues("attackKind")[0] ?? "both",
    attackerPoints: clamp(toInt(els.attackerPoints.value), 0, state.rules.statPoint.maxPerStat),
    attackerNatures: getCheckedValues("attackerNature"),
    effectiveness: getCheckedValues("effectiveness"),
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
  return els.availabilityMode.value === "champions";
}

function getPokemonPool() {
  if (!useChampionsFilter() || !state.availability?.restrictPokemon) return state.pokemon;
  const allowed = new Set(state.availability.pokemon ?? []);
  return state.pokemon.filter((pokemon) => allowed.has(pokemon.id));
}

function isMoveAllowed(moveId) {
  if (!useChampionsFilter() || !state.availability?.restrictMoves) return true;
  return new Set(state.availability.moves ?? []).has(moveId);
}

function updateDataStatus() {
  const pokemonPool = getPokemonPool();
  const mode = useChampionsFilter() ? "確認済みポケモン" : "全データ";
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

function calcMaxDamage({ level, power, attack, defense, stab, effectiveness, rule, isSpreadMove }) {
  const levelFactor = Math.floor((2 * level) / 5 + 2);
  const basePowerDamage = Math.floor((levelFactor * power * attack) / defense);
  const baseDamage = Math.floor(basePowerDamage / 50) + 2;
  const doubleModifier = rule === "double" && isSpreadMove ? state.rules.doubleSpreadModifier : 1;

  let damage = baseDamage;
  damage = applyDamageModifier(damage, doubleModifier);
  damage = applyDamageModifier(damage, state.rules.damageRandomMax);
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

function matchesAttackKind(category, filter) {
  if (!["physical", "special"].includes(category)) return false;
  return filter === "both" || category === filter;
}

function matchesEffectiveness(value, filter) {
  return filter.includes("all") || filter.some((item) => Number(item) === value);
}

function damageLine(currentHp, afterHp, before, after) {
  const beforeHits = hitsToKo(currentHp, before);
  const afterHits = hitsToKo(afterHp, after);
  if (before >= currentHp && after < afterHp) return "確1→耐え";
  if (beforeHits !== afterHits) return `${beforeHits}発→${afterHits}発`;
  if (after < before) return "最大乱数低下";
  return "変化なし";
}

function hitsToKo(hp, damage) {
  if (damage <= 0) return 99;
  return Math.ceil(hp / damage);
}

function lineScore(line) {
  if (line.includes("確1")) return 4;
  if (line.includes("発→")) return 3;
  return 1;
}

function renderResults(rows, candidateCount) {
  const lineChanges = rows.filter((row) => row.line !== "最大乱数低下").length;
  const best = rows[0];
  els.summary.innerHTML = `
    <span>配分候補<strong>${candidateCount}</strong></span>
    <span>表示件数<strong>${rows.length}</strong></span>
    <span>ライン変化<strong>${lineChanges}</strong></span>
    <span>おすすめ<strong>${best ? formatCandidate(best.candidate) : "-"}</strong></span>
  `;

  if (!rows.length) {
    els.resultsBody.innerHTML = `<tr><td colspan="10" class="empty">条件に合う変化はありませんでした。</td></tr>`;
    return;
  }

  els.resultsBody.innerHTML = rows
    .map((row) => {
      const lineClass = row.line === "最大乱数低下" ? "" : "line-good";
      return `
        <tr>
          <td class="result-line ${lineClass}">${row.line}</td>
          <td class="result-allocation">${formatCandidate(row.candidate)}</td>
          <td class="result-attacker">${row.attacker.name.ja}</td>
          <td class="result-move">${row.move.name.ja}</td>
          <td class="result-after">${row.afterDamage}</td>
          <td class="result-diff">${row.diff}</td>
          <td class="result-current">${row.currentDamage}</td>
          <td class="result-effectiveness">${effectivenessLabel.get(row.effectiveness) ?? row.effectiveness}</td>
          <td class="result-attack">${row.attackStat}${row.attackerNature === "boost" ? "（補正有）" : "（補正無）"}</td>
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
