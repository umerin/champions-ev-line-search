const paths = {
  pokemon: "./data/pokemon.json",
  moves: "./data/moves.json",
  typeChart: "./data/type-chart.json",
  rules: "./data/champions-rules.json?v=20260712-2",
  availability: "./data/champions-availability.json?v=20260803-4",
};

const MOVE_SETTING_RULES = ["single", "double"];
const MULTISCALE_POKEMON_IDS = new Set(["dragonite", "dragonite-mega"]);
const THICK_FAT_POKEMON_IDS = new Set(["venusaur-mega", "azumarill", "snorlax", "mamoswine", "appletun"]);
const THICK_FAT_MOVE_TYPES = new Set(["fire", "ice"]);
const HEATPROOF_POKEMON_IDS = new Set(["sinistcha"]);
const DRY_SKIN_POKEMON_IDS = new Set(["toxicroak", "heliolisk"]);
const RESULT_LIMIT_OPTIONS = [80, 120, 160, 200];
const UNLIMITED_RESULT_LIMIT = Infinity;
const DEFAULT_RESULT_LIMIT = 80;

const state = {
  pokemon: [],
  moves: [],
  typeChart: {},
  rules: null,
  availability: null,
  moveExclusions: createMoveExclusionState(),
  pokemonExclusions: createPokemonExclusionState(),
  bulkSettings: createBulkSettingsState(),
  moveSettingsPokemonId: null,
  moveSettingsRule: "single",
  bulkSettingsRule: "single",
  bulkConfirmationAction: null,
  moveSettingsView: "individual",
  moveSettingsPokemonSort: "name",
  resultLimit: DEFAULT_RESULT_LIMIT,
  resultSort: [
    { key: "attacker-name", direction: "asc" },
    { key: "move-name", direction: "asc" },
    { key: "unset", direction: "asc" },
  ],
};

const RESULT_SORT_DIRECTION_OPTIONS = {
  "attack-stat": [
    { value: "desc", label: "高い順" },
    { value: "asc", label: "低い順" },
  ],
  "change-amount": [
    { value: "desc", label: "高い順" },
    { value: "asc", label: "低い順" },
  ],
  "attacker-name": [
    { value: "asc", label: "昇順" },
    { value: "desc", label: "降順" },
  ],
  "move-name": [
    { value: "asc", label: "昇順" },
    { value: "desc", label: "降順" },
  ],
  unset: [
    { value: "asc", label: "昇順" },
    { value: "desc", label: "降順" },
  ],
};

let searchTimer = null;
const RECENT_POKEMON_STORAGE_KEY = "champions-ev-line-search:recent-pokemon";
const MOVE_SETTINGS_STORAGE_KEY = "champions-ev-line-search:move-settings";
const POKEMON_SETTINGS_STORAGE_KEY = "champions-ev-line-search:pokemon-settings";
const BULK_SETTINGS_STORAGE_KEY = "champions-ev-line-search:bulk-settings";
const RECENT_POKEMON_LIMIT = 10;
const pokemonFormMeta = new Map();

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  form: document.querySelector("#searchForm"),
  defenderSelect: document.querySelector("#defenderSelect"),
  defenderSearch: document.querySelector("#defenderSearch"),
  defenderOptions: document.querySelector("#defenderOptions"),
  megaToggle: document.querySelector("#megaToggle"),
  multiscaleOption: document.querySelector("#multiscaleOption"),
  multiscaleEnabled: document.querySelector("#multiscaleEnabled"),
  thickFatOption: document.querySelector("#thickFatOption"),
  thickFatEnabled: document.querySelector("#thickFatEnabled"),
  heatproofOption: document.querySelector("#heatproofOption"),
  heatproofEnabled: document.querySelector("#heatproofEnabled"),
  drySkinOption: document.querySelector("#drySkinOption"),
  drySkinEnabled: document.querySelector("#drySkinEnabled"),
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
  attackerPointsDetailOptions: document.querySelector("#attackerPointsDetailOptions"),
  movePower: document.querySelector("#movePower"),
  includePriorityMoves: document.querySelector("#includePriorityMoves"),
  higherOffenseOnly: document.querySelector("#higherOffenseOnly"),
  attackStatMultipleOf11: document.querySelector("#attackStatMultipleOf11"),
  stabOnly: document.querySelector("#stabOnly"),
  randomToGuaranteedSurvival: document.querySelector("#randomToGuaranteedSurvival"),
  excludeUnsurvivableAttacks: document.querySelector("#excludeUnsurvivableAttacks"),
  prioritizeMega: document.querySelector("#prioritizeMega"),
  summary: document.querySelector("#summary"),
  resultLimit: document.querySelector("#resultLimit"),
  resultsBody: document.querySelector("#resultsBody"),
  searchPage: document.querySelector("#searchPage"),
  moveSettingsPage: document.querySelector("#moveSettingsPage"),
  moveSettingsPokemonSearch: document.querySelector("#moveSettingsPokemonSearch"),
  moveSettingsPokemonSort: document.querySelector("#moveSettingsPokemonSort"),
  moveSettingsPokemonList: document.querySelector("#moveSettingsPokemonList"),
  moveSettingsPokemonName: document.querySelector("#moveSettingsPokemonName"),
  moveSettingsSummary: document.querySelector("#moveSettingsSummary"),
  moveSettingsIndividualPanel: document.querySelector("#moveSettingsIndividualPanel"),
  moveSettingsBulkPanel: document.querySelector("#moveSettingsBulkPanel"),
  moveSettingsBulkRuleName: document.querySelector("#moveSettingsBulkRuleName"),
  moveSettingsTopPowerCount: document.querySelector("#moveSettingsTopPowerCount"),
  moveSettingsBaseStatMax: document.querySelector("#moveSettingsBaseStatMax"),
  moveSettingsBaseStatMin: document.querySelector("#moveSettingsBaseStatMin"),
  moveSettingsApplyBulk: document.querySelector("#moveSettingsApplyBulk"),
  moveSettingsApplyBaseStatExclusion: document.querySelector("#moveSettingsApplyBaseStatExclusion"),
  moveSettingsApplyBaseStatInclusion: document.querySelector("#moveSettingsApplyBaseStatInclusion"),
  moveSettingsBulkConfirmModal: document.querySelector("#moveSettingsBulkConfirmModal"),
  moveSettingsBulkConfirmMessage: document.querySelector("#moveSettingsBulkConfirmMessage"),
  moveSettingsBulkConfirmSkip: document.querySelector("#moveSettingsBulkConfirmSkip"),
  moveSettingsBulkConfirmCancel: document.querySelector("#moveSettingsBulkConfirmCancel"),
  moveSettingsBulkConfirmApply: document.querySelector("#moveSettingsBulkConfirmApply"),
  moveSettingsAllOn: document.querySelector("#moveSettingsAllOn"),
  moveSettingsAllOff: document.querySelector("#moveSettingsAllOff"),
  moveSettingsMoveSearch: document.querySelector("#moveSettingsMoveSearch"),
  moveSettingsMoveList: document.querySelector("#moveSettingsMoveList"),
};

const jpCategory = {
  physical: "物理",
  special: "特殊",
};

const jpType = {
  normal: "ノーマル",
  fire: "ほのお",
  water: "みず",
  electric: "でんき",
  grass: "くさ",
  ice: "こおり",
  fighting: "かくとう",
  poison: "どく",
  ground: "じめん",
  flying: "ひこう",
  psychic: "エスパー",
  bug: "むし",
  rock: "いわ",
  ghost: "ゴースト",
  dragon: "ドラゴン",
  dark: "あく",
  steel: "はがね",
  fairy: "フェアリー",
};

const moveTypeOrder = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];
const moveTypeRank = new Map(moveTypeOrder.map((type, index) => [type, index]));

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
    buildPokemonFormMetadata();
    state.moveExclusions = loadMoveExclusions();
    state.pokemonExclusions = loadPokemonExclusions();
    state.bulkSettings = loadBulkSettings();
    populatePokemonSelect();
    populateMovePowerOptions();
    populateAttackerPointDetails();
    updateCurrentStatsDefault();
    updateDataStatus();
    setupMoveSettingsPage();
    els.form.addEventListener("submit", onSubmit);
    els.remainingPoints.addEventListener("input", scheduleSearch);
    document.querySelectorAll(".point-button, .point-preset").forEach((button) => {
      button.addEventListener("click", () => adjustPointInput(button));
    });
    els.defenderSelect.addEventListener("change", () => {
      updateMultiscaleOption();
      updateThickFatOption();
      updateHeatproofOption();
      updateDrySkinOption();
      updateCurrentStatsDefault();
      runSearch();
    });
    els.defenderSearch.addEventListener("input", () => {
      if (els.defenderSearch.value.trim()) {
        renderPokemonOptions(els.defenderSearch.value);
      } else {
        renderRecentPokemonOptions();
      }
    });
    els.defenderSearch.addEventListener("focus", renderPokemonOptionsOnActivate);
    els.defenderSearch.addEventListener("click", renderPokemonOptionsOnActivate);
    els.defenderSearch.addEventListener("keydown", handlePokemonSearchKeydown);
    els.megaToggle.addEventListener("click", cycleMegaForm);
    els.multiscaleEnabled.addEventListener("change", runSearch);
    els.thickFatEnabled.addEventListener("change", runSearch);
    els.heatproofEnabled.addEventListener("change", runSearch);
    els.drySkinEnabled.addEventListener("change", runSearch);
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
      refreshMoveSettingsPage();
      runSearch();
    });
    ["currentHpPoints", "currentAtkPoints", "currentDefPoints", "currentSpaPoints", "currentSpdPoints", "currentSpePoints"].forEach((key) => {
      els[key].addEventListener("focus", () => {
        if (els[key].value === "0") els[key].select();
      });
      els[key].addEventListener("input", () => {
        updateCurrentStatsDefault({ syncRemainingPoints: true });
        scheduleSearch();
      });
    });
    [
      ["currentHp", "hp"],
      ["currentAtk", "atk"],
      ["currentDef", "def"],
      ["currentSpa", "spa"],
      ["currentSpd", "spd"],
      ["currentSpe", "spe"],
    ].forEach(([statId, statKey]) => {
      els[statId].addEventListener("change", () => syncPointsFromStatInput(statKey));
    });
    document.querySelectorAll(".nature-button").forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => toggleNatureButton(button));
    });
    document.querySelectorAll('.checkbox-group input[type="checkbox"]:not(#higherOffenseOnly):not(#attackStatMultipleOf11):not(#stabOnly):not(#randomToGuaranteedSurvival):not(#excludeUnsurvivableAttacks):not(#prioritizeMega)').forEach((checkbox) => {
      checkbox.addEventListener("change", () => handleOpponentFilterChange(checkbox));
    });
    els.higherOffenseOnly.addEventListener("change", runSearch);
    els.attackStatMultipleOf11.addEventListener("change", runSearch);
    els.stabOnly.addEventListener("change", runSearch);
    els.randomToGuaranteedSurvival.addEventListener("change", runSearch);
    els.excludeUnsurvivableAttacks.addEventListener("change", runSearch);
    els.prioritizeMega.addEventListener("change", runSearch);
    els.movePower.addEventListener("input", scheduleSearch);
    els.includePriorityMoves.addEventListener("change", runSearch);
    els.resultLimit.addEventListener("change", () => {
      state.resultLimit = normalizeResultLimit(els.resultLimit.value);
      els.resultLimit.value = state.resultLimit === UNLIMITED_RESULT_LIMIT
        ? "unlimited"
        : String(state.resultLimit);
      runSearch();
    });
    setupResultSortControls();
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
  updateMultiscaleOption(pokemon);
  updateThickFatOption(pokemon);
  updateHeatproofOption(pokemon);
  updateDrySkinOption(pokemon);
  closePokemonOptions();
}

function populateMovePowerOptions() {
  const options = [];
  for (let power = 5; power <= 250; power += 5) {
    options.push(`<option value="${power}"></option>`);
  }
  document.querySelector("#movePowerOptions").innerHTML = options.join("");
}

function populateAttackerPointDetails() {
  els.attackerPointsDetailOptions.innerHTML = Array.from({ length: 29 }, (_, index) => {
    const points = index + 3;
    return `<label><input type="checkbox" name="attackerPointsDetail" value="${points}" /> ${points}</label>`;
  }).join("");
}

function setupMoveSettingsPage() {
  document.querySelectorAll(".page-nav-button").forEach((button) => {
    button.addEventListener("click", () => switchPage(button.dataset.page));
  });
  document.querySelectorAll(".move-settings-rule-tab, .move-settings-mode-tab").forEach((button) => {
    button.addEventListener("click", () => selectMoveSettingsView(button));
  });
  document.querySelectorAll(".move-settings-bulk-rule-tab").forEach((button) => {
    button.addEventListener("click", () => selectBulkSettingsRule(button));
  });
  els.moveSettingsPokemonSearch.addEventListener("input", renderMoveSettingsPokemonList);
  els.moveSettingsPokemonSort.addEventListener("change", () => {
    state.moveSettingsPokemonSort = normalizePokemonSort(els.moveSettingsPokemonSort.value);
    renderMoveSettingsPokemonList();
  });
  els.moveSettingsMoveSearch.addEventListener("input", renderMoveSettingsMoveList);
  els.moveSettingsTopPowerCount.addEventListener("input", saveBulkSettingsDraft);
  els.moveSettingsBaseStatMax.addEventListener("input", saveBulkSettingsDraft);
  els.moveSettingsBaseStatMin.addEventListener("input", saveBulkSettingsDraft);
  els.moveSettingsApplyBulk.addEventListener("click", () => requestBulkSettingsApply("topPowerByType"));
  els.moveSettingsApplyBaseStatExclusion.addEventListener("click", () => requestBulkSettingsApply("baseStatExclusion"));
  els.moveSettingsApplyBaseStatInclusion.addEventListener("click", () => requestBulkSettingsApply("baseStatInclusion"));
  els.moveSettingsBulkConfirmCancel.addEventListener("click", closeBulkMoveSettingsConfirmation);
  els.moveSettingsBulkConfirmApply.addEventListener("click", confirmBulkMoveSettingsApply);
  els.moveSettingsAllOn.addEventListener("click", () => setAllMovesForSelected(true));
  els.moveSettingsAllOff.addEventListener("click", () => setAllMovesForSelected(false));
  refreshMoveSettingsPage();
}

function selectMoveSettingsView(selectedButton) {
  if (selectedButton.dataset.moveSettingsView === "bulk") {
    state.moveSettingsView = "bulk";
    updateMoveSettingsView();
    renderMoveSettingsBulkSettings();
    return;
  }
  selectMoveSettingsRule(selectedButton);
}

function selectBulkSettingsRule(selectedButton) {
  state.bulkSettingsRule = normalizeMoveRule(selectedButton.dataset.bulkRule);
  updateBulkSettingsRuleTabs();
  renderMoveSettingsBulkSettings();
}

function selectMoveSettingsRule(selectedButton) {
  const rule = normalizeMoveRule(selectedButton.dataset.moveRule);
  state.moveSettingsRule = rule;
  state.moveSettingsView = "individual";
  document.querySelectorAll(".move-settings-rule-tab").forEach((button) => {
    const selected = button.dataset.moveSettingsView === "individual" && button.dataset.moveRule === rule;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  updateMoveSettingsView();
  renderMoveSettingsPokemonList();
  renderMoveSettingsMoveList();
}

function switchPage(page) {
  const showMoveSettings = page === "move-settings";
  els.searchPage.hidden = showMoveSettings;
  els.moveSettingsPage.hidden = !showMoveSettings;
  document.querySelectorAll(".page-nav-button").forEach((button) => {
    const selected = button.dataset.page === page;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-selected", String(selected));
    button.setAttribute("aria-pressed", String(selected));
  });
  if (showMoveSettings) refreshMoveSettingsPage();
}

function refreshMoveSettingsPage() {
  updateMoveSettingsRuleTabs();
  updateMoveSettingsView();
  renderMoveSettingsBulkSettings();
  const pokemonPool = getSortedPokemonPool();
  if (!pokemonPool.length) {
    state.moveSettingsPokemonId = null;
    renderMoveSettingsPokemonList();
    renderMoveSettingsMoveList();
    return;
  }
  if (!pokemonPool.some((pokemon) => pokemon.id === state.moveSettingsPokemonId)) {
    state.moveSettingsPokemonId = pokemonPool[0].id;
  }
  renderMoveSettingsPokemonList();
  renderMoveSettingsMoveList();
}

function updateMoveSettingsRuleTabs() {
  document.querySelectorAll(".move-settings-rule-tab, .move-settings-mode-tab").forEach((button) => {
    const selected = state.moveSettingsView === "bulk"
      ? button.dataset.moveSettingsView === "bulk"
      : button.dataset.moveSettingsView === "individual" && button.dataset.moveRule === state.moveSettingsRule;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-selected", String(selected));
  });
}

function updateMoveSettingsView() {
  const isBulk = state.moveSettingsView === "bulk";
  els.moveSettingsIndividualPanel.hidden = isBulk;
  els.moveSettingsBulkPanel.hidden = !isBulk;
  updateMoveSettingsRuleTabs();
}

function renderMoveSettingsBulkSettings() {
  const settings = getBulkSettings(state.bulkSettingsRule);
  els.moveSettingsBulkRuleName.textContent = state.bulkSettingsRule === "double" ? "ダブル" : "シングル";
  els.moveSettingsTopPowerCount.value = String(settings.topPowerByType.count);
  els.moveSettingsBaseStatMax.value = String(settings.baseStatExclusion.max);
  els.moveSettingsBaseStatMin.value = String(settings.baseStatInclusion.min);
  updateBulkSettingsRuleTabs();
}

function saveBulkSettingsDraft() {
  const settings = getBulkSettings(state.bulkSettingsRule);
  settings.topPowerByType.count = normalizeBulkMoveCount(els.moveSettingsTopPowerCount.value);
  settings.baseStatExclusion.max = normalizeBulkBaseStatMax(els.moveSettingsBaseStatMax.value);
  settings.baseStatInclusion.min = normalizeBulkBaseStatMin(els.moveSettingsBaseStatMin.value);
  saveBulkSettings();
}

function requestBulkSettingsApply(action) {
  const normalizedAction = ["baseStatExclusion", "baseStatInclusion"].includes(action)
    ? action
    : "topPowerByType";
  const settings = getBulkSettings(state.bulkSettingsRule)[normalizedAction];
  if (settings.skipConfirmation) {
    applyBulkSettings(normalizedAction);
    return;
  }

  const ruleName = state.bulkSettingsRule === "double" ? "ダブル" : "シングル";
  if (normalizedAction === "baseStatExclusion") {
    els.moveSettingsBulkConfirmMessage.innerHTML = `${ruleName}の合計種族値${settings.max}以下のポケモンを検索対象から除外します。<br />ポケモンごとの検索対象チェックが変更されます。`;
  } else if (normalizedAction === "baseStatInclusion") {
    els.moveSettingsBulkConfirmMessage.innerHTML = `${ruleName}の合計種族値${settings.min}以上のポケモンを検索対象にします。<br />ポケモンごとの検索対象チェックが変更されます。`;
  } else {
    els.moveSettingsBulkConfirmMessage.innerHTML = `${ruleName}の各ポケモンに、各技タイプの威力上位${settings.count}個を適用します。<br />個別の技チェックが変更されます。`;
  }
  state.bulkConfirmationAction = normalizedAction;
  els.moveSettingsBulkConfirmSkip.checked = false;
  els.moveSettingsBulkConfirmModal.hidden = false;
  els.moveSettingsBulkConfirmApply.focus();
}

function closeBulkMoveSettingsConfirmation() {
  els.moveSettingsBulkConfirmModal.hidden = true;
  state.bulkConfirmationAction = null;
}

function confirmBulkMoveSettingsApply() {
  const action = state.bulkConfirmationAction ?? "topPowerByType";
  const settings = getBulkSettings(state.bulkSettingsRule)[action];
  settings.skipConfirmation = els.moveSettingsBulkConfirmSkip.checked;
  saveBulkSettings();
  closeBulkMoveSettingsConfirmation();
  applyBulkSettings(action);
}

function applyBulkSettings(action = "topPowerByType") {
  saveBulkSettingsDraft();
  if (action === "baseStatExclusion") {
    applyBulkPokemonExclusion();
    return;
  }
  if (action === "baseStatInclusion") {
    applyBulkPokemonInclusion();
    return;
  }
  const rule = state.bulkSettingsRule;
  const settings = getBulkSettings(rule).topPowerByType;
  const ruleExclusions = state.moveExclusions.get(rule) ?? new Map();

  const allowedMoveIdsByPokemon = getBulkMoveIdsByPokemon(rule);
  state.pokemon.forEach((pokemon) => {
    const allowedMoveIds = allowedMoveIdsByPokemon.get(pokemon.id) ?? new Set();
    const excludedMoveIds = new Set(
      getMovesForPokemon(pokemon)
        .filter((move) => !allowedMoveIds.has(move.id))
        .map((move) => move.id),
    );
    if (excludedMoveIds.size) ruleExclusions.set(pokemon.id, excludedMoveIds);
    else ruleExclusions.delete(pokemon.id);
  });

  state.moveExclusions.set(rule, ruleExclusions);
  saveMoveExclusions();
  if (state.moveSettingsRule === rule) {
    renderMoveSettingsPokemonList();
    renderMoveSettingsMoveList();
  }
  runSearch();
}

function applyBulkPokemonExclusion() {
  const rule = state.bulkSettingsRule;
  const maxBaseStat = getBulkSettings(rule).baseStatExclusion.max;
  const excluded = state.pokemonExclusions.get(rule) ?? new Set();
  getPokemonPool().forEach((pokemon) => {
    if (getPokemonBaseStatTotal(pokemon) <= maxBaseStat) excluded.add(pokemon.id);
  });
  state.pokemonExclusions.set(rule, excluded);
  savePokemonExclusions();
  if (state.moveSettingsRule === rule) {
    renderMoveSettingsPokemonList();
    renderMoveSettingsMoveList();
  }
  runSearch();
}

function applyBulkPokemonInclusion() {
  const rule = state.bulkSettingsRule;
  const minBaseStat = getBulkSettings(rule).baseStatInclusion.min;
  const excluded = state.pokemonExclusions.get(rule) ?? new Set();
  getPokemonPool().forEach((pokemon) => {
    if (getPokemonBaseStatTotal(pokemon) >= minBaseStat) excluded.delete(pokemon.id);
  });
  state.pokemonExclusions.set(rule, excluded);
  savePokemonExclusions();
  if (state.moveSettingsRule === rule) {
    renderMoveSettingsPokemonList();
    renderMoveSettingsMoveList();
  }
  runSearch();
}

function updateBulkSettingsRuleTabs() {
  document.querySelectorAll(".move-settings-bulk-rule-tab").forEach((button) => {
    const selected = button.dataset.bulkRule === state.bulkSettingsRule;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-selected", String(selected));
  });
}

function renderMoveSettingsPokemonList() {
  const query = normalizePokemonSearch(els.moveSettingsPokemonSearch.value);
  const sort = normalizePokemonSort(state.moveSettingsPokemonSort);
  const pokemonPool = getPokemonPool().filter((pokemon) => {
    const name = normalizePokemonSearch(getPokemonDisplayName(pokemon));
    return !query || name.includes(query);
  }).sort((a, b) => comparePokemonBySort(a, b, sort));
  if (!pokemonPool.length) {
    els.moveSettingsPokemonList.innerHTML = `<p class="move-settings-empty">該当するポケモンがありません。</p>`;
    return;
  }
  els.moveSettingsPokemonList.innerHTML = pokemonPool.map((pokemon) => {
    const selected = pokemon.id === state.moveSettingsPokemonId;
    const enabled = isPokemonIncluded(pokemon.id);
    const displayName = getPokemonListDisplayName(pokemon);
    return `
      <div class="move-settings-pokemon-entry${enabled ? "" : " is-disabled"}">
        <button type="button" class="move-settings-pokemon-option${selected ? " is-selected" : ""}" role="option" aria-selected="${selected}" data-pokemon-id="${escapeHtml(pokemon.id)}">
          <span>${escapeHtml(displayName)}</span>
        </button>
        <label class="move-settings-pokemon-toggle" title="${escapeHtml(displayName)}を検索対象にする">
          <input class="move-settings-pokemon-toggle-input" type="checkbox" data-pokemon-id="${escapeHtml(pokemon.id)}" aria-label="${escapeHtml(displayName)}を検索対象にする"${enabled ? " checked" : ""} />
        </label>
      </div>
    `;
  }).join("");
  els.moveSettingsPokemonList.querySelectorAll(".move-settings-pokemon-option").forEach((button) => {
    button.addEventListener("click", () => {
      state.moveSettingsPokemonId = button.dataset.pokemonId;
      renderMoveSettingsPokemonList();
      renderMoveSettingsMoveList();
    });
  });
  els.moveSettingsPokemonList.querySelectorAll(".move-settings-pokemon-toggle-input").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      setPokemonIncluded(checkbox.dataset.pokemonId, checkbox.checked);
    });
  });
}

function renderMoveSettingsMoveList() {
  const pokemon = getPokemonPool().find((item) => item.id === state.moveSettingsPokemonId);
  if (!pokemon) {
    els.moveSettingsPokemonName.textContent = "ポケモンを選択してください";
    els.moveSettingsSummary.textContent = "技の設定状況";
    els.moveSettingsMoveList.innerHTML = `<p class="move-settings-empty">ポケモンを選択してください。</p>`;
    return;
  }
  const moves = getMovesForPokemon(pokemon);
  const excluded = getMoveExclusions(pokemon.id);
  const query = normalizePokemonSearch(els.moveSettingsMoveSearch.value);
  const visibleMoves = moves.filter((move) => {
    const name = normalizePokemonSearch(move.name?.ja ?? move.name?.en ?? move.id);
    return !query || name.includes(query);
  });
  const includedCount = moves.filter((move) => !excluded.has(move.id)).length;
  els.moveSettingsPokemonName.textContent = getPokemonDisplayName(pokemon);
  els.moveSettingsSummary.textContent = `${includedCount}/${moves.length}技を検索対象`;
  if (!visibleMoves.length) {
    els.moveSettingsMoveList.innerHTML = `<p class="move-settings-empty">該当する技がありません。</p>`;
    return;
  }
  els.moveSettingsMoveList.innerHTML = `
    <div class="move-settings-move-header" aria-hidden="true">
      <span></span>
      <span>技名</span>
      <span>タイプ</span>
      <span>分類</span>
      <span>技威力</span>
    </div>
    ${visibleMoves.map((move) => {
      const checked = !excluded.has(move.id);
      const category = jpCategory[move.category] ?? "";
      const type = jpType[move.type] ?? move.type ?? "—";
      const typeClass = moveTypeRank.has(move.type) ? ` move-type-${move.type}` : "";
      const power = move.power ? move.power : "—";
      return `
        <label class="move-setting-row">
          <input class="move-setting-checkbox" type="checkbox" data-pokemon-id="${escapeHtml(pokemon.id)}" data-move-id="${escapeHtml(move.id)}"${checked ? " checked" : ""} />
          <span class="move-setting-name">${escapeHtml(move.name?.ja ?? move.name?.en ?? move.id)}</span>
          <span class="move-setting-type${typeClass}">${escapeHtml(type)}</span>
          <span class="move-setting-category">${escapeHtml(category || "変化")}</span>
          <span class="move-setting-power">${escapeHtml(String(power))}</span>
        </label>
      `;
    }).join("")}
  `;
  els.moveSettingsMoveList.querySelectorAll(".move-setting-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      setMoveIncluded(checkbox.dataset.pokemonId, checkbox.dataset.moveId, checkbox.checked);
    });
  });
}

function getMovesForPokemon(pokemon) {
  return state.moves
    .filter((move) => isMoveAllowed(move.id) && Array.isArray(move.users) && move.users.includes(pokemon.id))
    .sort((a, b) => {
      const typeRank = (moveTypeRank.get(a.type) ?? moveTypeOrder.length) - (moveTypeRank.get(b.type) ?? moveTypeOrder.length);
      if (typeRank !== 0) return typeRank;
      const powerA = Number.isFinite(Number(a.power)) ? Number(a.power) : -1;
      const powerB = Number.isFinite(Number(b.power)) ? Number(b.power) : -1;
      if (powerA !== powerB) return powerB - powerA;
      return (a.name?.ja ?? a.name?.en ?? a.id).localeCompare(b.name?.ja ?? b.name?.en ?? b.id, "ja");
    });
}

function normalizeMoveRule(rule) {
  return MOVE_SETTING_RULES.includes(rule) ? rule : "single";
}

function createMoveExclusionState() {
  return new Map(MOVE_SETTING_RULES.map((rule) => [rule, new Map()]));
}

function createPokemonExclusionState() {
  return new Map(MOVE_SETTING_RULES.map((rule) => [rule, new Set()]));
}

function createBulkSettingsState() {
  return new Map(MOVE_SETTING_RULES.map((rule) => [rule, {
    topPowerByType: {
      count: 3,
      skipConfirmation: false,
    },
    baseStatExclusion: {
      max: 0,
      skipConfirmation: false,
    },
    baseStatInclusion: {
      min: 0,
      skipConfirmation: false,
    },
  }]));
}

function normalizeBulkMoveCount(value) {
  return clamp(toInt(value), 1, 20);
}

function normalizeBulkBaseStatMax(value) {
  return clamp(toInt(value), 0, 1200);
}

function normalizeBulkBaseStatMin(value) {
  return clamp(toInt(value), 0, 1200);
}

function getBulkSettings(rule = state.moveSettingsRule) {
  const normalizedRule = normalizeMoveRule(rule);
  let settings = state.bulkSettings.get(normalizedRule);
  if (!settings) {
    settings = {
      topPowerByType: {
        count: 3,
        skipConfirmation: false,
      },
      baseStatExclusion: {
        max: 0,
        skipConfirmation: false,
      },
      baseStatInclusion: {
        min: 0,
        skipConfirmation: false,
      },
    };
    state.bulkSettings.set(normalizedRule, settings);
  }
  return settings;
}

function loadBulkSettings() {
  const settings = createBulkSettingsState();
  try {
    const stored = JSON.parse(localStorage.getItem(BULK_SETTINGS_STORAGE_KEY) ?? "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return settings;
    MOVE_SETTING_RULES.forEach((rule) => {
      const ruleData = stored[rule];
      const current = settings.get(rule).topPowerByType;
      const topPowerByType = ruleData?.topPowerByType;
      if (topPowerByType && typeof topPowerByType === "object" && !Array.isArray(topPowerByType)) {
        current.count = normalizeBulkMoveCount(topPowerByType.count);
        current.skipConfirmation = topPowerByType.skipConfirmation === true;
      }
      const baseStatExclusion = ruleData?.baseStatExclusion;
      if (baseStatExclusion && typeof baseStatExclusion === "object" && !Array.isArray(baseStatExclusion)) {
        const baseStatSettings = settings.get(rule).baseStatExclusion;
        baseStatSettings.max = normalizeBulkBaseStatMax(baseStatExclusion.max);
        baseStatSettings.skipConfirmation = baseStatExclusion.skipConfirmation === true;
      }
      const baseStatInclusion = ruleData?.baseStatInclusion;
      if (baseStatInclusion && typeof baseStatInclusion === "object" && !Array.isArray(baseStatInclusion)) {
        const baseStatSettings = settings.get(rule).baseStatInclusion;
        baseStatSettings.min = normalizeBulkBaseStatMin(baseStatInclusion.min);
        baseStatSettings.skipConfirmation = baseStatInclusion.skipConfirmation === true;
      }
    });
  } catch {
    // Ignore unavailable or malformed local settings and use the defaults.
  }
  return settings;
}

function saveBulkSettings() {
  try {
    const stored = {};
    MOVE_SETTING_RULES.forEach((rule) => {
      const settings = getBulkSettings(rule);
      stored[rule] = {
        topPowerByType: {
          count: normalizeBulkMoveCount(settings.topPowerByType.count),
          skipConfirmation: settings.topPowerByType.skipConfirmation === true,
        },
        baseStatExclusion: {
          max: normalizeBulkBaseStatMax(settings.baseStatExclusion.max),
          skipConfirmation: settings.baseStatExclusion.skipConfirmation === true,
        },
        baseStatInclusion: {
          min: normalizeBulkBaseStatMin(settings.baseStatInclusion.min),
          skipConfirmation: settings.baseStatInclusion.skipConfirmation === true,
        },
      };
    });
    localStorage.setItem(BULK_SETTINGS_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore unavailable storage; the current session still uses the in-memory settings.
  }
}

function getBulkMoveIdsByPokemon(rule = state.moveSettingsRule) {
  const settings = getBulkSettings(rule).topPowerByType;

  const movesByPokemon = new Map();
  state.moves.forEach((move) => {
    if (!isMoveAllowed(move.id)) return;
    const power = Number(move.power);
    if (!move.type || !Number.isFinite(power) || power <= 0) return;
    if (!Array.isArray(move.users)) return;
    move.users.forEach((pokemonId) => {
      const movesByType = movesByPokemon.get(pokemonId) ?? new Map();
      const moves = movesByType.get(move.type) ?? [];
      moves.push({ move, power });
      movesByType.set(move.type, moves);
      movesByPokemon.set(pokemonId, movesByType);
    });
  });

  const allowedMoveIdsByPokemon = new Map();
  movesByPokemon.forEach((movesByType, pokemonId) => {
    const allowedMoveIds = new Set();
    movesByType.forEach((moves) => {
      moves
        .sort((a, b) => b.power - a.power || a.move.id.localeCompare(b.move.id))
        .slice(0, settings.count)
        .forEach(({ move }) => allowedMoveIds.add(move.id));
    });
    allowedMoveIdsByPokemon.set(pokemonId, allowedMoveIds);
  });
  return allowedMoveIdsByPokemon;
}

function isPokemonIncluded(pokemonId, rule = state.moveSettingsRule) {
  return !state.pokemonExclusions.get(normalizeMoveRule(rule))?.has(pokemonId);
}

function setPokemonIncluded(pokemonId, included) {
  const rule = normalizeMoveRule(state.moveSettingsRule);
  const excluded = state.pokemonExclusions.get(rule) ?? new Set();
  if (included) excluded.delete(pokemonId);
  else excluded.add(pokemonId);
  state.pokemonExclusions.set(rule, excluded);
  savePokemonExclusions();
  renderMoveSettingsPokemonList();
  runSearch();
}

function getMoveExclusions(pokemonId, create = false, rule = state.moveSettingsRule) {
  const normalizedRule = normalizeMoveRule(rule);
  let ruleExclusions = state.moveExclusions.get(normalizedRule);
  if (!ruleExclusions && create) {
    ruleExclusions = new Map();
    state.moveExclusions.set(normalizedRule, ruleExclusions);
  }
  let exclusions = ruleExclusions?.get(pokemonId);
  if (!exclusions && create) {
    exclusions = new Set();
    ruleExclusions.set(pokemonId, exclusions);
  }
  return exclusions ?? new Set();
}

function setMoveIncluded(pokemonId, moveId, included) {
  const exclusions = getMoveExclusions(pokemonId, true);
  if (included) exclusions.delete(moveId);
  else exclusions.add(moveId);
  const ruleExclusions = state.moveExclusions.get(state.moveSettingsRule);
  if (!exclusions.size) ruleExclusions?.delete(pokemonId);
  saveMoveExclusions();
  renderMoveSettingsMoveList();
  runSearch();
}

function setAllMovesForSelected(included) {
  const pokemon = getPokemonPool().find((item) => item.id === state.moveSettingsPokemonId);
  if (!pokemon) return;
  const moves = getMovesForPokemon(pokemon);
  const ruleExclusions = state.moveExclusions.get(state.moveSettingsRule) ?? new Map();
  if (included) {
    ruleExclusions.delete(pokemon.id);
  } else {
    ruleExclusions.set(pokemon.id, new Set(moves.map((move) => move.id)));
    state.moveExclusions.set(state.moveSettingsRule, ruleExclusions);
  }
  saveMoveExclusions();
  renderMoveSettingsMoveList();
  runSearch();
}

function loadMoveExclusions() {
  const exclusions = createMoveExclusionState();
  try {
    const stored = JSON.parse(localStorage.getItem(MOVE_SETTINGS_STORAGE_KEY) ?? "{}");
    if (!stored || typeof stored !== "object") return exclusions;
    const applyStoredRule = (rule, ruleData) => {
      if (!ruleData || typeof ruleData !== "object" || Array.isArray(ruleData)) return;
      const ruleExclusions = exclusions.get(rule);
      Object.entries(ruleData).forEach(([pokemonId, moveIds]) => {
        if (Array.isArray(moveIds) && moveIds.length) ruleExclusions.set(pokemonId, new Set(moveIds));
      });
    };
    const isLegacy = Object.values(stored).some((moveIds) => Array.isArray(moveIds));
    if (isLegacy) applyStoredRule("single", stored);
    else MOVE_SETTING_RULES.forEach((rule) => applyStoredRule(rule, stored[rule]));
  } catch {
    // Ignore unavailable or malformed local settings and use the default (all included).
  }
  return exclusions;
}

function saveMoveExclusions() {
  try {
    const stored = {};
    MOVE_SETTING_RULES.forEach((rule) => {
      const ruleExclusions = state.moveExclusions.get(rule);
      const ruleStored = Object.fromEntries(
        [...(ruleExclusions?.entries() ?? [])]
          .filter(([, moveIds]) => moveIds.size)
          .map(([pokemonId, moveIds]) => [pokemonId, [...moveIds]]),
      );
      if (Object.keys(ruleStored).length) stored[rule] = ruleStored;
    });
    localStorage.setItem(MOVE_SETTINGS_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore unavailable storage; the current session still uses the in-memory settings.
  }
}

function loadPokemonExclusions() {
  const exclusions = createPokemonExclusionState();
  try {
    const stored = JSON.parse(localStorage.getItem(POKEMON_SETTINGS_STORAGE_KEY) ?? "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return exclusions;
    MOVE_SETTING_RULES.forEach((rule) => {
      const ruleExclusions = exclusions.get(rule);
      const moveRuleData = stored[rule];
      if (!Array.isArray(moveRuleData)) return;
      moveRuleData.forEach((pokemonId) => {
        if (typeof pokemonId === "string") ruleExclusions.add(pokemonId);
      });
    });
  } catch {
    // Ignore unavailable or malformed local settings and use the default (all enabled).
  }
  return exclusions;
}

function savePokemonExclusions() {
  try {
    const stored = {};
    MOVE_SETTING_RULES.forEach((rule) => {
      const excluded = state.pokemonExclusions.get(rule);
      if (excluded?.size) stored[rule] = [...excluded];
    });
    localStorage.setItem(POKEMON_SETTINGS_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore unavailable storage; the current session still uses the in-memory settings.
  }
}

function getSortedPokemonPool() {
  return [...getPokemonPool()].sort(comparePokemonByName);
}

function normalizePokemonSort(value) {
  return ["name", "base-stat-desc", "base-stat-asc"].includes(value) ? value : "name";
}

function getPokemonBaseStatTotal(pokemon) {
  return Object.values(pokemon.baseStats ?? {}).reduce((total, value) => {
    const stat = Number(value);
    return total + (Number.isFinite(stat) ? stat : 0);
  }, 0);
}

function getPokemonListDisplayName(pokemon) {
  return `${getPokemonDisplayName(pokemon)}（${getPokemonBaseStatTotal(pokemon)}）`;
}

function comparePokemonByName(a, b) {
  const aName = a.name.jaHrkt ?? a.name.ja;
  const bName = b.name.jaHrkt ?? b.name.ja;
  return aName.localeCompare(bName, "ja");
}

function comparePokemonBySort(a, b, sort) {
  if (sort === "base-stat-desc") {
    return getPokemonBaseStatTotal(b) - getPokemonBaseStatTotal(a) || comparePokemonByName(a, b);
  }
  if (sort === "base-stat-asc") {
    return getPokemonBaseStatTotal(a) - getPokemonBaseStatTotal(b) || comparePokemonByName(a, b);
  }
  return comparePokemonByName(a, b);
}

function normalizePokemonSearch(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

const FORM_LABEL_BY_ID = new Map([
  ["calyrex-ice", "はくばじょうのすがた"],
  ["calyrex-shadow", "こくばじょうのすがた"],
  ["cramorant-gorging", "まるのみのすがた"],
  ["cramorant-gulping", "うのみのすがた"],
  ["eiscue-ice", "アイスフェイス"],
  ["eiscue-noice", "ナイスフェイス"],
  ["gimmighoul-roaming", "とほフォルム"],
  ["greninja-ash", "サトシゲッコウガ"],
  ["greninja-battle-bond", "きずなへんげ"],
  ["keldeo-ordinary", "いつものすがた"],
  ["keldeo-resolute", "かくごのすがた"],
  ["kyurem-black", "ブラックキュレム"],
  ["kyurem-white", "ホワイトキュレム"],
  ["maushold-family-of-four", "4ひきかぞく"],
  ["maushold-family-of-three", "3ひきかぞく"],
  ["meloetta-aria", "ボイスフォルム"],
  ["meloetta-pirouette", "ステップフォルム"],
  ["mimikyu-busted", "ばれたすがた"],
  ["mimikyu-disguised", "ばけたすがた"],
  ["mimikyu-totem-busted", "ぬし・ばれたすがた"],
  ["mimikyu-totem-disguised", "ぬし・ばけたすがた"],
  ["morpeko-full-belly", "まんぷくもよう"],
  ["morpeko-hangry", "はらぺこもよう"],
  ["necrozma-dawn", "たそがれのたてがみ"],
  ["necrozma-dusk", "あかつきのつばさ"],
  ["necrozma-ultra", "ウルトラネクロズマ"],
  ["ogerpon-cornerstone-mask", "いしずえのめん"],
  ["ogerpon-hearthflame-mask", "かまどのめん"],
  ["ogerpon-wellspring-mask", "いどのめん"],
  ["oricorio-baile", "めらめらスタイル"],
  ["oricorio-pau", "ふらふらスタイル"],
  ["oricorio-pom-pom", "ぱちぱちスタイル"],
  ["oricorio-sensu", "まいまいスタイル"],
  ["palafin-hero", "マイティ"],
  ["palafin-zero", "ナイーブ"],
  ["pikachu-alola-cap", "アローラキャップ"],
  ["pikachu-hoenn-cap", "ホウエンキャップ"],
  ["pikachu-kalos-cap", "カロスキャップ"],
  ["pikachu-original-cap", "オリジナルキャップ"],
  ["pikachu-partner-cap", "パートナーキャップ"],
  ["pikachu-sinnoh-cap", "シンオウキャップ"],
  ["pikachu-unova-cap", "イッシュキャップ"],
  ["pikachu-world-cap", "ワールドキャップ"],
  ["pikachu-belle", "おやすみリボン"],
  ["pikachu-cosplay", "マスクド・ピカチュウ"],
  ["pikachu-libre", "ルチャブルポーズ"],
  ["pikachu-phd", "はかせのすがた"],
  ["pikachu-pop-star", "アイドルポーズ"],
  ["pikachu-rock-star", "ロックスターポーズ"],
  ["pikachu-starter", "パートナー"],
  ["pumpkaboo-average", "ふつうのサイズ"],
  ["pumpkaboo-large", "おおきいサイズ"],
  ["pumpkaboo-small", "ちいさいサイズ"],
  ["pumpkaboo-super", "とくだいサイズ"],
  ["gourgeist-average", "ふつうのサイズ"],
  ["gourgeist-large", "おおきいサイズ"],
  ["gourgeist-small", "ちいさいサイズ"],
  ["gourgeist-super", "とくだいサイズ"],
  ["shaymin-land", "ランドフォルム"],
  ["shaymin-sky", "スカイフォルム"],
  ["tatsugiri-curly", "そったすがた"],
  ["tatsugiri-droopy", "たれたすがた"],
  ["tatsugiri-stretchy", "のびたすがた"],
  ["terapagos-stellar", "ステラフォルム"],
  ["terapagos-terastal", "テラスタルフォルム"],
  ["toxtricity-amped", "ハイなすがた"],
  ["toxtricity-low-key", "ローなすがた"],
  ["ursaluna-bloodmoon", "アカツキ"],
  ["urshifu-rapid-strike", "れんげきのかた"],
  ["urshifu-single-strike", "いちげきのかた"],
  ["wishiwashi-school", "むれたすがた"],
  ["wishiwashi-solo", "たんどくのすがた"],
  ["zygarde-10", "10%フォルム"],
  ["zygarde-10-power-construct", "10%・パーフェクトフォルム"],
  ["zygarde-50", "50%フォルム"],
  ["zygarde-50-power-construct", "50%・パーフェクトフォルム"],
  ["zygarde-complete", "パーフェクトフォルム"],
  ["zacian-crowned", "くちたけん"],
  ["zamazenta-crowned", "くちたたて"],
]);

const FORM_LABEL_BY_SUFFIX = new Map([
  ["alola", "アローラ"],
  ["galar", "ガラル"],
  ["hisui", "ヒスイ"],
  ["paldea", "パルデア"],
  ["gmax", "キョダイマックス"],
  ["totem", "ぬしのすがた"],
  ["wash", "ウォッシュ"],
  ["heat", "ヒート"],
  ["frost", "フロスト"],
  ["fan", "スピン"],
  ["mow", "カット"],
  ["blade", "ブレード"],
  ["shield", "シールド"],
  ["origin", "オリジンフォルム"],
  ["altered", "アナザーフォルム"],
  ["incarnate", "けしんフォルム"],
  ["therian", "れいじゅうフォルム"],
  ["attack", "アタックフォルム"],
  ["defense", "ディフェンスフォルム"],
  ["speed", "スピードフォルム"],
  ["normal", "ノーマルフォルム"],
  ["eternamax", "ムゲンダイマックス"],
  ["ice", "こおりのすがた"],
  ["shadow", "シャドーフォルム"],
  ["eternal", "えいえんのはな"],
  ["rainy", "あまみずのすがた"],
  ["snowy", "ゆきぐものすがた"],
  ["sunny", "たいようのすがた"],
  ["amped", "ハイなすがた"],
  ["low-key", "ローなすがた"],
  ["rapid-strike", "れんげきのかた"],
  ["single-strike", "いちげきのかた"],
  ["standard", "ふつうのすがた"],
  ["zen", "ダルマモード"],
  ["two-segment", "2だんフォルム"],
  ["three-segment", "3だんフォルム"],
  ["red-striped", "あかすじ"],
  ["blue-striped", "あおすじ"],
  ["white-striped", "しろすじ"],
  ["blue", "あおいろ"],
  ["green", "みどりいろ"],
  ["indigo", "あいいろ"],
  ["orange", "オレンジいろ"],
  ["red", "あかいろ"],
  ["violet", "むらさきいろ"],
  ["yellow", "きいろ"],
  ["meteor", "メテオフォルム"],
  ["curly", "そったすがた"],
  ["droopy", "たれたすがた"],
  ["stretchy", "のびたすがた"],
  ["male", "♂"],
  ["female", "♀"],
  ["dusk", "たそがれ"],
  ["midday", "まひる"],
  ["midnight", "まよなか"],
  ["own-tempo", "マイペース"],
  ["crowned", "くちたけん"],
  ["dada", "とうちゃん"],
  ["roaming", "とほフォルム"],
  ["complete", "パーフェクトフォルム"],
  ["primal", "ゲンシカイキ"],
  ["gliding", "かっくうビルド"],
  ["limited", "せんせいビルド"],
  ["sprinting", "ライドビルド"],
  ["swimming", "ウォーター ビルド"],
  ["aquatic", "ウォーター モード"],
  ["drive", "ドライブモード"],
  ["glide", "グライドモード"],
  ["low-power", "低出力モード"],
]);

function buildPokemonFormMetadata() {
  pokemonFormMeta.clear();
  const groups = new Map();
  state.pokemon.forEach((pokemon) => {
    const group = groups.get(pokemon.name.ja) ?? [];
    group.push(pokemon);
    groups.set(pokemon.name.ja, group);
  });
  groups.forEach((variants) => {
    if (variants.length < 2) return;
    const tokenLists = variants.map((pokemon) => pokemon.id.split("-"));
    const first = tokenLists[0];
    let commonTokenCount = 0;
    while (commonTokenCount < first.length
      && tokenLists.every((tokens) => tokens[commonTokenCount] === first[commonTokenCount])) {
      commonTokenCount += 1;
    }
    variants.forEach((pokemon, index) => {
      pokemonFormMeta.set(pokemon.id, tokenLists[index].slice(commonTokenCount).join("-"));
    });
  });
}

function getPokemonFormLabel(pokemon) {
  const rawSuffix = pokemonFormMeta.get(pokemon.id);
  if (!rawSuffix) return "";
  const suffix = rawSuffix.replace(/(?:^|-)mega(?:-[xyz])?$/, "");
  if (!suffix) return "";
  if (FORM_LABEL_BY_ID.has(pokemon.id)) return FORM_LABEL_BY_ID.get(pokemon.id);
  if (FORM_LABEL_BY_SUFFIX.has(suffix)) return FORM_LABEL_BY_SUFFIX.get(suffix);
  return suffix
    .split("-")
    .map((token) => FORM_LABEL_BY_SUFFIX.get(token) ?? token)
    .join("・");
}

function getPokemonDisplayName(pokemon) {
  if (pokemon.displayName) return pokemon.displayName;
  const megaMatch = pokemon.id.match(/-mega(?:-([xyz]))?$/);
  if (megaMatch) {
    const variant = megaMatch[1]?.toUpperCase() ?? "";
    const formLabel = getPokemonFormLabel(pokemon);
    return `メガ${pokemon.name.ja}${formLabel ? `（${formLabel}）` : ""}${variant}`;
  }
  const formLabel = getPokemonFormLabel(pokemon);
  return formLabel ? `${pokemon.name.ja}（${formLabel}）` : pokemon.name.ja;
}

function readRecentPokemonIds() {
  try {
    const stored = globalThis.localStorage?.getItem(RECENT_POKEMON_STORAGE_KEY);
    const ids = stored ? JSON.parse(stored) : [];
    return Array.isArray(ids)
      ? ids.filter((id) => typeof id === "string").slice(0, RECENT_POKEMON_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function rememberRecentPokemon(pokemonId) {
  const ids = [pokemonId, ...readRecentPokemonIds().filter((id) => id !== pokemonId)]
    .slice(0, RECENT_POKEMON_LIMIT);
  try {
    globalThis.localStorage?.setItem(RECENT_POKEMON_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 履歴保存が利用できない環境でも、ポケモン選択自体は継続する。
  }
}

function getRecentPokemon() {
  const pokemonById = new Map(getPokemonPool().map((pokemon) => [pokemon.id, pokemon]));
  return readRecentPokemonIds()
    .map((pokemonId) => pokemonById.get(pokemonId))
    .filter(Boolean);
}

function isCompletePokemonName(query) {
  const normalizedQuery = normalizePokemonSearch(query.trim());
  if (!normalizedQuery) return false;
  return getSortedPokemonPool().some((pokemon) => [
    getPokemonDisplayName(pokemon),
    pokemon.name.ja,
    pokemon.name.jaHrkt,
    pokemon.name.en,
    pokemon.id,
  ].filter(Boolean).some((name) => normalizePokemonSearch(name) === normalizedQuery));
}

function renderPokemonOptionsOnActivate() {
  const query = els.defenderSearch.value;
  if (!query.trim() || isCompletePokemonName(query)) {
    renderRecentPokemonOptions();
    return;
  }
  renderPokemonOptions(query);
}

function renderRecentPokemonOptions() {
  const recentPokemon = getRecentPokemon();
  const currentPokemon = getPokemonPool().find((pokemon) => pokemon.id === els.defenderSelect.value);
  const options = recentPokemon.length ? recentPokemon : currentPokemon ? [currentPokemon] : [];
  const optionMarkup = options.map((pokemon) => `
    <button type="button" class="pokemon-option" role="option" data-pokemon-id="${escapeHtml(pokemon.id)}">
      <span>${escapeHtml(getPokemonListDisplayName(pokemon))}</span>
    </button>
  `).join("");

  els.defenderOptions.innerHTML = options.length
    ? `<div class="pokemon-options-heading">最近使ったポケモン</div>${optionMarkup}`
    : '<span class="pokemon-option-empty">最近使ったポケモンはありません</span>';
  els.defenderOptions.querySelectorAll(".pokemon-option").forEach((button) => {
    button.addEventListener("click", () => selectPokemon(button.dataset.pokemonId));
  });
  els.defenderOptions.hidden = false;
  els.defenderSearch.setAttribute("aria-expanded", "true");
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
          <span>${escapeHtml(getPokemonListDisplayName(pokemon))}</span>
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
  const pokemon = getPokemonPool().find((item) => item.id === pokemonId)
    ?? state.pokemon.find((item) => item.id === pokemonId);
  if (!pokemon) return;
  rememberRecentPokemon(pokemon.id);
  els.defenderSelect.value = pokemon.id;
  els.defenderSearch.value = getPokemonDisplayName(pokemon);
  updateMegaToggle(pokemon);
  closePokemonOptions();
  els.defenderSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function getMegaFamily(pokemon) {
  const rootId = pokemon.id.replace(/-mega(?:-[xyz])?$/, "");
  const pokemonPool = state.pokemon;
  const base = pokemonPool.find((item) => item.id === rootId);
  if (!base) return [pokemon];
  const variantOrder = new Map([
    ["", 0],
    ["y", 1],
    ["x", 2],
    ["z", 3],
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

function updateMultiscaleOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && MULTISCALE_POKEMON_IDS.has(pokemon.id));
  const wasVisible = !els.multiscaleOption.hidden;
  els.multiscaleOption.hidden = !isSupported;
  if (!isSupported) els.multiscaleEnabled.checked = false;
  else if (!wasVisible) els.multiscaleEnabled.checked = true;
}

function updateThickFatOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && THICK_FAT_POKEMON_IDS.has(pokemon.id));
  const wasVisible = !els.thickFatOption.hidden;
  els.thickFatOption.hidden = !isSupported;
  if (!isSupported) els.thickFatEnabled.checked = false;
  else if (!wasVisible) els.thickFatEnabled.checked = true;
}

function updateHeatproofOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && HEATPROOF_POKEMON_IDS.has(pokemon.id));
  const wasVisible = !els.heatproofOption.hidden;
  els.heatproofOption.hidden = !isSupported;
  if (!isSupported) els.heatproofEnabled.checked = false;
  else if (!wasVisible) els.heatproofEnabled.checked = true;
}

function updateDrySkinOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && DRY_SKIN_POKEMON_IDS.has(pokemon.id));
  const wasVisible = !els.drySkinOption.hidden;
  els.drySkinOption.hidden = !isSupported;
  if (!isSupported) els.drySkinEnabled.checked = false;
  else if (!wasVisible) els.drySkinEnabled.checked = true;
}

function cycleMegaForm() {
  const current = state.pokemon.find((pokemon) => pokemon.id === els.defenderSelect.value);
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

function updateCurrentStatsDefault({ syncRemainingPoints = false } = {}) {
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
  const remainingPoints = Math.max(0, unallocated);
  if (syncRemainingPoints) els.remainingPoints.value = remainingPoints;
  els.unallocatedPoints.textContent = remainingPoints;
  els.unallocatedPoints.parentElement.classList.toggle("is-over", unallocated < 0);
}

function syncPointsFromStatInput(statKey) {
  const fieldMap = {
    hp: { statId: "currentHp", pointsId: "currentHpPoints" },
    atk: { statId: "currentAtk", pointsId: "currentAtkPoints" },
    def: { statId: "currentDef", pointsId: "currentDefPoints" },
    spa: { statId: "currentSpa", pointsId: "currentSpaPoints" },
    spd: { statId: "currentSpd", pointsId: "currentSpdPoints" },
    spe: { statId: "currentSpe", pointsId: "currentSpePoints" },
  };
  const fields = fieldMap[statKey];
  const defender = state.pokemon.find((item) => item.id === els.defenderSelect.value);
  if (!fields || !defender) return;

  const target = Number.parseInt(els[fields.statId].value, 10);
  if (!Number.isFinite(target) || target < 1) return;

  let closestPoints = 0;
  let closestDifference = Number.POSITIVE_INFINITY;
  const maxPoints = state.rules.statPoint.maxPerStat;
  for (let points = 0; points <= maxPoints; points += 1) {
    const calculated = statKey === "hp"
      ? calcHpStat(defender.baseStats.hp, points)
      : calcNonHpStat(defender.baseStats[statKey], points, getDefenderNatureMode(statKey));
    const difference = Math.abs(calculated - target);
    if (difference < closestDifference) {
      closestDifference = difference;
      closestPoints = points;
    }
  }

  els[fields.pointsId].value = closestPoints;
  updateCurrentStatsDefault({ syncRemainingPoints: true });
  scheduleSearch();
}

function adjustPointInput(button) {
  const input = document.querySelector(`#${button.dataset.target}`);
  if (!input) return;
  const nextValue = button.dataset.value == null
    ? toInt(input.value) + toInt(button.dataset.delta)
    : toInt(button.dataset.value);
  input.value = clamp(
    nextValue,
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
  } else if (group === "attackerPointsPreset" || group === "attackerPointsDetail") {
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

function setupResultSortControls() {
  const rows = [...document.querySelectorAll(".result-sort-row")];
  const updateDirectionOptions = (row, resetDirection = false) => {
    const key = row.querySelector(".result-sort-key").value;
    const direction = row.querySelector(".result-sort-direction");
    const options = RESULT_SORT_DIRECTION_OPTIONS[key] ?? RESULT_SORT_DIRECTION_OPTIONS.unset;
    const previousValue = resetDirection ? null : direction.value;
    direction.innerHTML = options
      .map(({ value, label }) => `<option value="${value}">${label}</option>`)
      .join("");
    direction.value = options.some(({ value }) => value === previousValue)
      ? previousValue
      : options[0].value;
    direction.disabled = key === "unset";
  };
  const updateSortState = () => {
    state.resultSort = rows.map((row) => ({
      key: row.querySelector(".result-sort-key").value,
      direction: row.querySelector(".result-sort-direction").value,
    }));
    rows.forEach((row) => {
      const key = row.querySelector(".result-sort-key").value;
      row.querySelector(".result-sort-direction").disabled = key === "unset";
    });
    runSearch();
  };

  rows.forEach((row) => {
    row.querySelector(".result-sort-key").addEventListener("change", () => {
      updateDirectionOptions(row, true);
      updateSortState();
    });
    row.querySelector(".result-sort-direction").addEventListener("change", updateSortState);
  });
  rows.forEach((row) => updateDirectionOptions(row));
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
  const attackScenarios = buildAttackScenarios(defender, pokemonPool, input, current);
  const scenarioCount = attackScenarios.length;
  const candidateStats = candidates.map((candidate) => ({
    candidate,
    after: applyCandidateStats(defender, input, candidate),
  }));
  const rows = [];

  for (const profile of groupAttackScenarios(attackScenarios)) {
    const profileRows = [];
    const representative = profile.scenarios[0];
    const rankedScenarios = getRankedProfileScenarios(profile.scenarios, input.prioritizeMega);
    let minimumCandidateTotal = null;
    let isSurvivable = false;
    const shownOutcomeKeys = new Set();

    for (let candidateIndex = 0; candidateIndex < candidateStats.length; candidateIndex += 1) {
      const { candidate, after } = candidateStats[candidateIndex];
      if (!matchesRelevantDefensiveInvestment(representative.move.category, candidate)) continue;
      const candidateTotal = candidate.hpAdd + candidate.defAdd + candidate.spdAdd;
      if (minimumCandidateTotal !== null && candidateTotal > minimumCandidateTotal) break;
      const damageInput = {
        level: state.rules.level,
        power: representative.move.power,
        attack: representative.attackStat,
        defense: representative.move.category === "physical" ? after.def : after.spd,
        stab: representative.stab,
        effectiveness: representative.effectiveness,
        rule: input.battleRule,
        isSpreadMove: representative.move.isSpreadMove,
        defenderDamageModifier: getDefenderDamageModifier(defender, input, representative.move.type),
      };
      const {
        maxDamage: afterDamage,
        minDamage: afterMinDamage,
        koRate: afterKoRate,
      } = calcDamageResult(damageInput, after.hp);
      if (afterKoRate < 100) isSurvivable = true;
      if (input.randomToGuaranteedSurvival) {
        const isOneHitKoOrRandom = representative.currentKoRate > 0;
        if (!isOneHitKoOrRandom || afterKoRate !== 0) continue;
        if (minimumCandidateTotal === null) {
          minimumCandidateTotal = candidateTotal;
          profileRows.length = 0;
        }
        if (candidateTotal !== minimumCandidateTotal) continue;
      }
      if (afterDamage === representative.currentDamage && afterKoRate === representative.currentKoRate) continue;
      if (!input.randomToGuaranteedSurvival) {
        const outcomeKey = `${afterDamage}|${afterKoRate}`;
        if (shownOutcomeKeys.has(outcomeKey)) continue;
        shownOutcomeKeys.add(outcomeKey);
      }

      for (const scenario of rankedScenarios) {
        insertRankedRow(profileRows, {
          candidate,
          ...scenario,
          afterDamage,
          afterMinDamage,
          afterKoRate,
          diff: afterDamage - scenario.currentDamage,
          sortOrder: candidateIndex * scenarioCount + scenario.scenarioIndex,
        }, input.prioritizeMega);
      }
    }

    if (input.excludeUnsurvivableAttacks && !isSurvivable) continue;
    for (const row of profileRows) insertRankedRow(rows, row, input.prioritizeMega);
  }

  renderResults(rows, getRelevantCandidateCount(candidates, input.attackKinds));
}

function groupAttackScenarios(scenarios) {
  const profiles = new Map();
  for (const scenario of scenarios) {
    let profile = profiles.get(scenario.damageProfileKey);
    if (!profile) {
      profile = { scenarios: [] };
      profiles.set(scenario.damageProfileKey, profile);
    }
    profile.scenarios.push(scenario);
  }
  return profiles.values();
}

function getRankedProfileScenarios(scenarios, prioritizeMega) {
  const resultLimit = state.resultLimit;
  if (state.resultSort.some(({ key }) => ["attack-stat", "attacker-name", "move-name"].includes(key))) {
    return [...scenarios]
      .sort((a, b) => {
        return compareResultSortRules(a, b) || a.scenarioIndex - b.scenarioIndex;
      })
      .slice(0, resultLimit);
  }
  if (!prioritizeMega) return scenarios.slice(0, resultLimit);
  const mega = [];
  const regular = [];
  for (const scenario of scenarios) {
    const bucket = scenario.attacker.id.includes("-mega") ? mega : regular;
    if (bucket.length < resultLimit) bucket.push(scenario);
  }
  return [...mega, ...regular];
}

function compareResultRows(a, b, prioritizeMega) {
  return compareResultSortRules(a, b) || compareRecommendedResultRows(a, b, prioritizeMega);
}

function compareResultSortRules(a, b) {
  for (const sortRule of state.resultSort) {
    if (sortRule.key === "unset") continue;
    let comparison = 0;
    if (sortRule.key === "attack-stat") {
      comparison = a.attackStat - b.attackStat;
    } else if (sortRule.key === "change-amount") {
      comparison = a.diff - b.diff;
    } else if (sortRule.key === "attacker-name") {
      comparison = compareJapaneseSortText(getPokemonDisplayName(a.attacker), getPokemonDisplayName(b.attacker));
    } else if (sortRule.key === "move-name") {
      comparison = compareJapaneseSortText(getMoveSortName(a.move), getMoveSortName(b.move));
    }
    if (comparison !== 0) return sortRule.direction === "asc" ? comparison : -comparison;
  }
  return 0;
}

function getMoveSortName(move) {
  return move.name?.jaHrkt ?? move.name?.ja ?? move.name?.en ?? move.id;
}

function compareJapaneseSortText(a, b) {
  return a.localeCompare(b, "ja", { sensitivity: "base" }) || a.localeCompare(b);
}

function compareRecommendedResultRows(a, b, prioritizeMega) {
  const megaPriority = prioritizeMega
    ? Number(b.attacker.id.includes("-mega")) - Number(a.attacker.id.includes("-mega"))
    : 0;
  const probabilityImprovement = (b.currentKoRate - b.afterKoRate) - (a.currentKoRate - a.afterKoRate);
  return megaPriority || probabilityImprovement || a.diff - b.diff || a.sortOrder - b.sortOrder;
}

function insertRankedRow(rows, row, prioritizeMega) {
  const resultLimit = state.resultLimit;
  if (
    rows.length === resultLimit
    && compareResultRows(row, rows[rows.length - 1], prioritizeMega) >= 0
  ) return;

  let start = 0;
  let end = rows.length;
  while (start < end) {
    const middle = Math.floor((start + end) / 2);
    if (compareResultRows(row, rows[middle], prioritizeMega) < 0) end = middle;
    else start = middle + 1;
  }
  rows.splice(start, 0, row);
  if (rows.length > resultLimit) rows.pop();
}

function scheduleSearch() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(runSearch, 180);
}

function buildAttackScenarios(defender, pokemonPool, input, current) {
  const attackerById = new Map(pokemonPool.map((pokemon) => [pokemon.id, pokemon]));
  const attackerNatureModes = input.attackerNatures;
  const scenarios = [];
  const currentDamageCache = new Map();

  for (const move of state.moves) {
    if (!isMoveAllowed(move.id)) continue;
    if (!matchesMovePower(move, input.movePower, input.powerComparison, input.includePriorityMoves)) continue;
    if (!matchesAttackKind(move.category, input.attackKinds)) continue;
    const effectiveness = calcEffectiveness(move.type, defender.types);
    if (effectiveness === 0 || !matchesEffectiveness(effectiveness, input.effectiveness)) continue;

    for (const attackerId of move.users) {
      const attacker = attackerById.get(attackerId);
      if (!attacker || !isPokemonIncluded(attackerId, input.battleRule)) continue;
      if (!isMoveAllowedForPokemon(attackerId, move.id, input.battleRule)) continue;
      if (input.higherOffenseOnly && !matchesHigherOffense(attacker, move.category)) continue;
      const stab = attacker.types.includes(move.type) ? 1.5 : 1;
      if (input.stabOnly && stab === 1) continue;
      for (const attackerPoints of input.attackerPoints) {
        for (const attackerNature of attackerNatureModes) {
          const attackStat = calcAttackStat(attacker, move.category, attackerPoints, attackerNature);
          if (input.attackStatMultipleOf11 && attackStat % 11 !== 0) continue;
    const damageProfileKey = [
      move.category,
      move.power,
      attackStat,
      stab,
      effectiveness,
      Number(move.isSpreadMove),
      getDefenderDamageModifier(defender, input, move.type),
    ].join("|");
          let currentDamageResult = currentDamageCache.get(damageProfileKey);
          if (!currentDamageResult) {
            const damageInput = {
              level: state.rules.level,
              power: move.power,
              attack: attackStat,
              defense: move.category === "physical" ? current.def : current.spd,
              stab,
              effectiveness,
              rule: input.battleRule,
              isSpreadMove: move.isSpreadMove,
              defenderDamageModifier: getDefenderDamageModifier(defender, input, move.type),
            };
            const {
              maxDamage: currentDamage,
              minDamage: currentMinDamage,
              koRate: currentKoRate,
            } = calcDamageResult(damageInput, current.hp);
            currentDamageResult = { currentDamage, currentMinDamage, currentKoRate };
            currentDamageCache.set(damageProfileKey, currentDamageResult);
          }
          scenarios.push({
            attacker,
            move,
            attackStat,
            attackerPoints,
            attackerNature,
            effectiveness,
            stab,
            damageProfileKey,
            scenarioIndex: scenarios.length,
            ...currentDamageResult,
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
    attackStatMultipleOf11: els.attackStatMultipleOf11.checked,
    stabOnly: els.stabOnly.checked,
    randomToGuaranteedSurvival: els.randomToGuaranteedSurvival.checked,
    excludeUnsurvivableAttacks: els.excludeUnsurvivableAttacks.checked,
    prioritizeMega: els.prioritizeMega.checked,
    multiscaleEnabled: els.multiscaleEnabled.checked,
    thickFatEnabled: els.thickFatEnabled.checked,
    heatproofEnabled: els.heatproofEnabled.checked,
    drySkinEnabled: els.drySkinEnabled.checked,
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
  const selectedId = els.defenderSelect?.value;
  return state.pokemon.filter((pokemon) => {
    return allowed.has(pokemon.id) || pokemon.id === selectedId;
  });
}

function isMoveAllowed(moveId) {
  if (!useChampionsFilter() || !state.availability?.restrictMoves) return true;
  return new Set(state.availability.moves ?? []).has(moveId);
}

function isMoveAllowedForPokemon(pokemonId, moveId, rule = els.battleRule.value) {
  return !getMoveExclusions(pokemonId, false, rule).has(moveId);
}

function updateDataStatus() {
  const pokemonPool = getPokemonPool();
  const movePool = useChampionsFilter() && state.availability?.restrictMoves
    ? state.moves.filter((move) => isMoveAllowed(move.id))
    : state.moves;
  const mode = els.availabilityMode.value === "final"
    ? "チャンピオンズ（仮）"
    : useChampionsFilter() ? "確認済みポケモン" : "全データ";
  const pokemonNote = useChampionsFilter() && !state.availability?.restrictPokemon ? " / ポケモン未絞込" : "";
  const moveNote = useChampionsFilter() && state.availability?.restrictMoves
    ? " / 技は対象リスト"
    : useChampionsFilter() ? " / 技は全データ（未検証）" : "";
  els.dataStatus.textContent = `${mode}: ${pokemonPool.length}匹 / ${movePool.length}技${pokemonNote}${moveNote}`;
}

function buildDefensiveCandidates(input) {
  const max = state.rules.statPoint.maxPerStat;
  if (input.randomToGuaranteedSurvival) return buildMinimumSurvivalCandidates(input, max);

  const candidates = [];
  for (let total = 0; total <= input.remainingPoints; total++) {
    for (let hpAdd = 0; hpAdd <= total; hpAdd++) {
      for (let defAdd = 0; defAdd <= total - hpAdd; defAdd++) {
        const spdAdd = total - hpAdd - defAdd;
        if (input.currentHpPoints + hpAdd > max) continue;
        if (input.currentDefPoints + defAdd > max) continue;
        if (input.currentSpdPoints + spdAdd > max) continue;
        candidates.push({ hpAdd, defAdd, spdAdd });
      }
    }
  }
  return candidates;
}

function buildMinimumSurvivalCandidates(input, max) {
  const candidates = [];
  const candidateKeys = new Set();
  const addCandidate = (hpAdd, defAdd, spdAdd) => {
    if (input.currentHpPoints + hpAdd > max) return;
    if (input.currentDefPoints + defAdd > max) return;
    if (input.currentSpdPoints + spdAdd > max) return;
    const key = `${hpAdd}|${defAdd}|${spdAdd}`;
    if (candidateKeys.has(key)) return;
    candidateKeys.add(key);
    candidates.push({ hpAdd, defAdd, spdAdd });
  };

  for (let total = 0; total <= input.remainingPoints; total++) {
    for (let hpAdd = 0; hpAdd <= total; hpAdd++) {
      const defensiveAdd = total - hpAdd;
      if (input.attackKinds.includes("special")) addCandidate(hpAdd, 0, defensiveAdd);
      if (input.attackKinds.includes("physical")) addCandidate(hpAdd, defensiveAdd, 0);
    }
  }
  return candidates;
}

function matchesRelevantDefensiveInvestment(moveCategory, candidate) {
  // 物理技の検索ではD振り、特殊技の検索ではB振りを候補から除外する。
  if (moveCategory === "physical") return candidate.spdAdd === 0;
  if (moveCategory === "special") return candidate.defAdd === 0;
  return true;
}

function getRelevantCandidateCount(candidates, attackKinds) {
  const hasPhysical = attackKinds.includes("physical");
  const hasSpecial = attackKinds.includes("special");
  if (hasSpecial && !hasPhysical) return candidates.filter((candidate) => candidate.defAdd === 0).length;
  if (hasPhysical && !hasSpecial) return candidates.filter((candidate) => candidate.spdAdd === 0).length;
  return candidates.length;
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
  const presetValues = presets.map((preset) => toInt(preset));
  const detailValues = getCheckedValues("attackerPointsDetail").map((value) => toInt(value));
  const values = [...presetValues, ...detailValues];
  return [...new Set(values.length ? values : [32])]
    .map((value) => clamp(value, 0, state.rules.statPoint.maxPerStat));
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

function getDefenderDamageModifier(defender, input, moveType) {
  let modifier = 1;
  if (input.multiscaleEnabled && MULTISCALE_POKEMON_IDS.has(defender.id)) modifier *= 0.5;
  if (
    input.thickFatEnabled
    && THICK_FAT_POKEMON_IDS.has(defender.id)
    && THICK_FAT_MOVE_TYPES.has(moveType)
  ) modifier *= 0.5;
  if (input.heatproofEnabled && HEATPROOF_POKEMON_IDS.has(defender.id) && moveType === "fire") {
    modifier *= 0.5;
  }
  if (input.drySkinEnabled && DRY_SKIN_POKEMON_IDS.has(defender.id) && moveType === "fire") {
    modifier *= 1.25;
  }
  return modifier;
}

function calcDamageResult(damageInput, hp) {
  const preRandomDamage = calcPreRandomDamage(damageInput);
  const maxDamage = calcDamageFromPreRandom(
    preRandomDamage,
    state.rules.damageRandomMax,
    damageInput.stab,
    damageInput.effectiveness,
    damageInput.defenderDamageModifier,
  );
  const minDamage = calcDamageFromPreRandom(
    preRandomDamage,
    state.rules.damageRandomMin ?? 0.85,
    damageInput.stab,
    damageInput.effectiveness,
    damageInput.defenderDamageModifier,
  );
  const koRate = calcOneHitKoRate(
    preRandomDamage,
    damageInput.stab,
    damageInput.effectiveness,
    hp,
    maxDamage,
    minDamage,
    damageInput.defenderDamageModifier,
  );
  return { maxDamage, minDamage, koRate };
}

function calcPreRandomDamage({ level, power, attack, defense, rule, isSpreadMove }) {
  const levelFactor = Math.floor((2 * level) / 5 + 2);
  const basePowerDamage = Math.floor((levelFactor * power * attack) / defense);
  const baseDamage = Math.floor(basePowerDamage / 50) + 2;
  const doubleModifier = rule === "double" && isSpreadMove ? state.rules.doubleSpreadModifier : 1;
  return applyDamageModifier(baseDamage, doubleModifier);
}

function calcDamageFromPreRandom(preRandomDamage, randomModifier, stab, effectiveness, defenderDamageModifier = 1) {
  let damage = preRandomDamage;
  damage = applyDamageModifier(damage, randomModifier);
  damage = applyDamageModifier(damage, stab);
  damage = applyTypeEffectiveness(damage, effectiveness);
  damage = applyDamageModifier(damage, defenderDamageModifier);
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

function calcOneHitKoRate(preRandomDamage, stab, effectiveness, hp, maxDamage, minDamage, defenderDamageModifier = 1) {
  if (maxDamage < hp) return 0;
  if (minDamage >= hp) return 100;
  let lowestKoRoll = 86;
  let highestKoRoll = 100;
  while (lowestKoRoll < highestKoRoll) {
    const randomPercent = Math.floor((lowestKoRoll + highestKoRoll) / 2);
    const damage = calcDamageFromPreRandom(
      preRandomDamage,
      randomPercent / 100,
      stab,
      effectiveness,
      defenderDamageModifier,
    );
    if (damage >= hp) highestKoRoll = randomPercent;
    else lowestKoRoll = randomPercent + 1;
  }
  return ((101 - lowestKoRoll) / 16) * 100;
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
  const groups = groupResultRows(rows);
  const lineChanges = rows.filter((row) => row.afterKoRate < row.currentKoRate).length;
  els.summary.innerHTML = `
    <span>配分候補<strong>${candidateCount}</strong></span>
    <span>表示グループ<strong>${groups.length}</strong></span>
    <span>詳細結果<strong>${rows.length}</strong></span>
    <span>KO率低下<strong>${lineChanges}</strong></span>
  `;

  if (!rows.length) {
    els.resultsBody.innerHTML = `<tr><td colspan="11" class="empty">条件に合う変化はありませんでした。</td></tr>`;
    return;
  }

  els.resultsBody.innerHTML = groups.map((group, groupIndex) => renderResultGroup(group, groupIndex)).join("");
  els.resultsBody.querySelectorAll(".result-group-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const groupIndex = button.dataset.resultGroup;
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isExpanded));
      const icon = button.querySelector(".result-group-chevron");
      if (icon) icon.textContent = isExpanded ? "＋" : "−";
      els.resultsBody.querySelectorAll(`[data-result-group="${groupIndex}"]`).forEach((detailRow) => {
        detailRow.hidden = isExpanded;
      });
    });
  });
}

function groupResultRows(rows) {
  const groups = [];
  const groupsByKey = new Map();
  rows.forEach((row) => {
    const key = `${row.attacker.id}|${row.move.id}`;
    let group = groupsByKey.get(key);
    if (!group) {
      group = { rows: [] };
      groupsByKey.set(key, group);
      groups.push(group);
    }
    group.rows.push(row);
  });
  return groups;
}

function renderResultGroup(group, groupIndex) {
  const representative = group.rows[0];
  const lineClass = representative.afterKoRate < representative.currentKoRate ? "line-good" : "";
  const diffClass = getResultDiffClass(representative.diff);
  const diffLabel = formatResultDiff(representative.diff);
  const detailsLabel = `詳細${group.rows.length}件`;
  return `
    <tr class="result-group-summary">
      <td colspan="11" class="result-group-cell">
        <button type="button" class="result-group-toggle" data-result-group="${groupIndex}" aria-expanded="false">
          <span class="result-group-chevron" aria-hidden="true">＋</span>
          <span class="result-group-attacker">${escapeHtml(getPokemonDisplayName(representative.attacker))}</span>
          <span class="result-group-move">${escapeHtml(representative.move.name.ja)}</span>
          <span class="result-group-power">威力 ${escapeHtml(String(representative.move.power))}</span>
          <span class="result-group-representative ${lineClass}">代表 ${formatProbability(representative.currentKoRate)}→${formatProbability(representative.afterKoRate)}</span>
          <span class="result-group-diff ${diffClass}">変化 ${diffLabel}</span>
          <span class="result-group-count">${detailsLabel}</span>
        </button>
      </td>
    </tr>
    ${group.rows.map((row) => renderResultDetailRow(row, groupIndex)).join("")}
  `;
}

function renderResultDetailRow(row, groupIndex) {
  const lineClass = row.afterKoRate < row.currentKoRate ? "line-good" : "";
  const diffClass = getResultDiffClass(row.diff);
  return `
    <tr class="result-detail-row" data-result-group="${groupIndex}" hidden>
      <td class="result-line ${lineClass}">${formatProbability(row.currentKoRate)}→${formatProbability(row.afterKoRate)}</td>
      <td class="result-allocation">${formatCandidate(row.candidate)}</td>
      <td class="result-attacker">${escapeHtml(getPokemonDisplayName(row.attacker))}</td>
      <td class="result-attack">${row.attackStat}(${row.attackerPoints})</td>
      <td class="result-nature">${row.attackerNature === "boost" ? "有" : "無"}</td>
      <td class="result-move">${escapeHtml(row.move.name.ja)}</td>
      <td class="result-power">${row.move.power}</td>
      <td class="result-current">${row.currentDamage}～${row.currentMinDamage}</td>
      <td class="result-after">${row.afterDamage}～${row.afterMinDamage}</td>
      <td class="result-diff ${diffClass}">${formatResultDiff(row.diff)}</td>
      <td class="result-category">${jpCategory[row.move.category]}</td>
    </tr>
  `;
}

function getResultDiffClass(diff) {
  return diff < 0 ? "diff-good" : diff > 0 ? "diff-bad" : "diff-neutral";
}

function formatResultDiff(diff) {
  return diff > 0 ? `+${diff}` : diff;
}

function renderInputError(message) {
  els.summary.innerHTML = `<span class="empty">${escapeHtml(message)}</span>`;
  els.resultsBody.innerHTML = `<tr><td colspan="11" class="empty">${escapeHtml(message)}</td></tr>`;
}

function formatCandidate(candidate) {
  const totalPoints = candidate.hpAdd + candidate.defAdd + candidate.spdAdd;
  return `H+${candidate.hpAdd} B+${candidate.defAdd} D+${candidate.spdAdd} (${totalPoints})`;
}

function toInt(value) {
  return Number.parseInt(value, 10) || 0;
}

function normalizeResultLimit(value) {
  if (String(value) === "unlimited") return UNLIMITED_RESULT_LIMIT;
  const limit = toInt(value);
  return RESULT_LIMIT_OPTIONS.includes(limit) ? limit : DEFAULT_RESULT_LIMIT;
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
