const paths = {
  pokemon: "./data/pokemon.json?v=20260809-2",
  moves: "./data/moves.json?v=20260809-4",
  learnsets: "./data/learnsets.json?v=20260809-1",
  battleEffects: "./data/battle-effects.json?v=20260809-6",
  typeChart: "./data/type-chart.json",
  rules: "./data/champions-rules.json?v=20260712-2",
  recommendedPresets: "./data/recommended-presets.json?v=20260808-1",
};

const MOVE_SETTING_RULES = ["single", "double"];
const RESULT_LIMIT_OPTIONS = [80, 120, 160, 200];
const UNLIMITED_RESULT_LIMIT = Infinity;
const DEFAULT_RESULT_LIMIT = 80;
const WALL_DAMAGE_MODIFIERS = {
  single: 0.5,
  double: 2732 / 4096,
};
const FINAL_DAMAGE_M_GROUP_ORDER = [
  "wall",
  "neuroforce",
  "sniper",
  "tintedLens",
  "fluffyFire",
  "Mhalf",
  "Mfilter",
  "friendGuard",
  "expertBelt",
  "metronome",
  "lifeOrb",
  "resistBerry",
  "Mtwice",
];
const FINAL_DAMAGE_M_GROUP_RANK = new Map(
  FINAL_DAMAGE_M_GROUP_ORDER.map((group, index) => [group, index]),
);

const state = {
  pokemon: [],
  moves: [],
  typeChart: {},
  rules: null,
  availability: null,
  battleEffects: { defender: {}, attacker: {} },
  moveExclusions: createMoveExclusionState(),
  pokemonExclusions: createPokemonExclusionState(),
  bulkSettings: createBulkSettingsState(),
  moveSettingsPokemonId: null,
  moveSettingsRule: "single",
  bulkSettingsRule: "single",
  bulkConfirmationAction: null,
  moveSettingsPresets: [],
  builtInRecommendedMoveSettingsPresets: [],
  recommendedMoveSettingsPresets: [],
  moveSettingsPresetPending: null,
  moveSettingsPresetEditing: false,
  moveSettingsPresetEditingId: null,
  moveSettingsPresetEditingSource: null,
  moveSettingsView: "individual",
  moveSettingsPokemonSort: "name",
  searchNeedsRefresh: false,
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
const MOVE_SETTINGS_PRESETS_STORAGE_KEY = "champions-ev-line-search:move-settings-presets";
const RECOMMENDED_MOVE_SETTINGS_PRESETS_STORAGE_KEY = "champions-ev-line-search:recommended-move-settings-preset-drafts";
const MOVE_SETTINGS_PRESET_LIMIT = 5;
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
  filterOption: document.querySelector("#filterOption"),
  filterEnabled: document.querySelector("#filterEnabled"),
  hardRockOption: document.querySelector("#hardRockOption"),
  hardRockEnabled: document.querySelector("#hardRockEnabled"),
  weatherAbilityAlways: document.querySelector("#weatherAbilityAlways"),
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
  showNonGuaranteedWhenGuaranteed: document.querySelector("#showNonGuaranteedWhenGuaranteed"),
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
  moveSettingsPresetBar: document.querySelector(".move-settings-preset-bar"),
  moveSettingsPresetSelect: document.querySelector("#moveSettingsPresetSelect"),
  moveSettingsPresetName: document.querySelector("#moveSettingsPresetName"),
  moveSettingsPresetCount: document.querySelector("#moveSettingsPresetCount"),
  moveSettingsPresetSave: document.querySelector("#moveSettingsPresetSave"),
  moveSettingsRecommendedPresetCreate: document.querySelector("#moveSettingsRecommendedPresetCreate"),
  moveSettingsRecommendedPresetExport: document.querySelector("#moveSettingsRecommendedPresetExport"),
  moveSettingsPresetLoad: document.querySelector("#moveSettingsPresetLoad"),
  moveSettingsPresetEdit: document.querySelector("#moveSettingsPresetEdit"),
  moveSettingsPresetEditDone: document.querySelector("#moveSettingsPresetEditDone"),
  moveSettingsPresetDelete: document.querySelector("#moveSettingsPresetDelete"),
  moveSettingsPresetEditingNotice: document.querySelector("#moveSettingsPresetEditingNotice"),
  moveSettingsPresetEditingLabel: document.querySelector("#moveSettingsPresetEditingLabel"),
  moveSettingsPresetEditingName: document.querySelector("#moveSettingsPresetEditingName"),
  moveSettingsPresetStatus: document.querySelector("#moveSettingsPresetStatus"),
  moveSettingsPresetConfirmModal: document.querySelector("#moveSettingsPresetConfirmModal"),
  moveSettingsPresetConfirmTitle: document.querySelector("#moveSettingsPresetConfirmTitle"),
  moveSettingsPresetConfirmMessage: document.querySelector("#moveSettingsPresetConfirmMessage"),
  moveSettingsPresetConfirmCancel: document.querySelector("#moveSettingsPresetConfirmCancel"),
  moveSettingsPresetConfirmApply: document.querySelector("#moveSettingsPresetConfirmApply"),
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

function buildRuntimeMoves(pokemon, moves, learnsets) {
  const pokemonIds = new Set(pokemon.map((entry) => entry.id));
  const usersByMove = new Map(moves.map((move) => [move.id, []]));
  for (const [pokemonId, moveIds] of Object.entries(learnsets)) {
    if (!pokemonIds.has(pokemonId)) throw new Error(`learnsets.json: 未知のポケモンID ${pokemonId}`);
    for (const moveId of moveIds) {
      const users = usersByMove.get(moveId);
      if (!users) throw new Error(`learnsets.json: 未知の技ID ${moveId}`);
      users.push(pokemonId);
    }
  }
  return moves.map((move) => ({ ...move, users: usersByMove.get(move.id) ?? [] }));
}

function buildAvailability(pokemon, moves) {
  return {
    restrictPokemon: true,
    pokemon: pokemon.filter((entry) => entry.championsTarget).map((entry) => entry.id),
    restrictMoves: true,
    moves: moves.filter((entry) => entry.championsTarget).map((entry) => entry.id),
  };
}

async function init() {
  try {
    const [pokemon, moveSource, learnsets, battleEffects, typeChart, rules, recommendedPresets] = await Promise.all([
      loadJson(paths.pokemon),
      loadJson(paths.moves),
      loadJson(paths.learnsets),
      loadJson(paths.battleEffects),
      loadJson(paths.typeChart),
      loadJson(paths.rules),
      loadOptionalJson(paths.recommendedPresets, { presets: [] }),
    ]);
    const moves = buildRuntimeMoves(pokemon, moveSource, learnsets);
    const availability = buildAvailability(pokemon, moveSource);
    Object.assign(state, { pokemon, moves, battleEffects, typeChart, rules, availability });
    state.builtInRecommendedMoveSettingsPresets = normalizeBuiltInRecommendedMoveSettingsPresets(recommendedPresets);
    buildPokemonFormMetadata();
    state.moveExclusions = loadMoveExclusions();
    state.pokemonExclusions = loadPokemonExclusions();
    state.bulkSettings = loadBulkSettings();
    state.moveSettingsPresets = loadMoveSettingsPresets();
    state.recommendedMoveSettingsPresets = loadRecommendedMoveSettingsPresetDrafts();
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
      updateFilterOption();
      updateHardRockOption();
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
    els.filterEnabled.addEventListener("change", runSearch);
    els.hardRockEnabled.addEventListener("change", runSearch);
    els.weatherAbilityAlways.addEventListener("change", runSearch);
    document.querySelectorAll('input[name="weather"]').forEach((radio) => {
      radio.addEventListener("change", runSearch);
    });
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
    document.querySelectorAll('.checkbox-group input[type="checkbox"]:not(#higherOffenseOnly):not(#attackStatMultipleOf11):not(#stabOnly):not(#randomToGuaranteedSurvival):not(#showNonGuaranteedWhenGuaranteed):not(#excludeUnsurvivableAttacks):not(#prioritizeMega)').forEach((checkbox) => {
      checkbox.addEventListener("change", () => handleOpponentFilterChange(checkbox));
    });
    els.higherOffenseOnly.addEventListener("change", runSearch);
    els.attackStatMultipleOf11.addEventListener("change", runSearch);
    els.stabOnly.addEventListener("change", runSearch);
    els.randomToGuaranteedSurvival.addEventListener("change", runSearch);
    els.showNonGuaranteedWhenGuaranteed.addEventListener("change", runSearch);
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
  updateFilterOption(pokemon);
  updateHardRockOption(pokemon);
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
  els.moveSettingsPokemonList.addEventListener("click", handleMoveSettingsPokemonListClick);
  els.moveSettingsPokemonList.addEventListener("change", handleMoveSettingsPokemonListChange);
  els.moveSettingsPresetSelect.addEventListener("change", handleMoveSettingsPresetSelectionChange);
  els.moveSettingsPresetName.addEventListener("input", updateMoveSettingsPresetActions);
  els.moveSettingsPresetSave.addEventListener("click", saveCurrentMoveSettingsPreset);
  els.moveSettingsRecommendedPresetCreate.addEventListener("click", createRecommendedMoveSettingsPresetDraft);
  els.moveSettingsRecommendedPresetExport.addEventListener("click", exportRecommendedMoveSettingsPresetDrafts);
  els.moveSettingsPresetLoad.addEventListener("click", () => requestMoveSettingsPresetConfirmation("load"));
  els.moveSettingsPresetEdit.addEventListener("click", enterMoveSettingsPresetEdit);
  els.moveSettingsPresetEditDone.addEventListener("click", exitMoveSettingsPresetEdit);
  els.moveSettingsPresetDelete.addEventListener("click", () => requestMoveSettingsPresetConfirmation("delete"));
  els.moveSettingsPresetConfirmCancel.addEventListener("click", closeMoveSettingsPresetConfirmation);
  els.moveSettingsPresetConfirmApply.addEventListener("click", confirmMoveSettingsPresetAction);
  els.moveSettingsMoveSearch.addEventListener("input", renderMoveSettingsMoveList);
  els.moveSettingsMoveList.addEventListener("change", handleMoveSettingsMoveListChange);
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
  renderMoveSettingsPresets();
  refreshMoveSettingsPage();
}

function renderMoveSettingsPresets() {
  const selectedValue = els.moveSettingsPresetSelect.value;
  const builtInRecommendedOptions = state.builtInRecommendedMoveSettingsPresets.map((preset) => (
    `<option value="${escapeHtml(getMoveSettingsPresetOptionValue("built-in", preset.id))}">${escapeHtml(preset.name)}（${getMoveRuleName(preset.rule)}）</option>`
  ));
  const recommendedDraftOptions = state.recommendedMoveSettingsPresets.map((preset) => (
    `<option value="${escapeHtml(getMoveSettingsPresetOptionValue("recommended", preset.id))}">${escapeHtml(preset.name)}（${getMoveRuleName(preset.rule)}）</option>`
  ));
  const userOptions = state.moveSettingsPresets.map((preset) => (
    `<option value="${escapeHtml(getMoveSettingsPresetOptionValue("user", preset.id))}">${escapeHtml(preset.name)}（${getMoveRuleName(preset.rule)}）</option>`
  ));
  els.moveSettingsPresetSelect.innerHTML = [
    `<option value="">プリセットを選択</option>`,
    builtInRecommendedOptions.length ? `<optgroup label="おすすめプリセット">${builtInRecommendedOptions.join("")}</optgroup>` : "",
    recommendedDraftOptions.length ? `<optgroup label="おすすめ作成用">${recommendedDraftOptions.join("")}</optgroup>` : "",
    userOptions.length ? `<optgroup label="自分のプリセット">${userOptions.join("")}</optgroup>` : "",
  ].join("");
  if (getMoveSettingsPresetSelection(selectedValue)) {
    els.moveSettingsPresetSelect.value = selectedValue;
  }
  els.moveSettingsPresetCount.textContent = `おすすめ ${state.builtInRecommendedMoveSettingsPresets.length}件・自分 ${state.moveSettingsPresets.length}/${MOVE_SETTINGS_PRESET_LIMIT}・作成中 ${state.recommendedMoveSettingsPresets.length}件`;
  updateMoveSettingsPresetActions();
}

function updateMoveSettingsPresetActions() {
  const selection = getSelectedMoveSettingsPresetSelection();
  const selected = Boolean(selection);
  const builtIn = selection?.source === "built-in";
  const name = els.moveSettingsPresetName.value.trim();
  const editing = state.moveSettingsPresetEditing;
  const hasSameName = state.moveSettingsPresets.some((preset) => (
    preset.name === name && normalizeMoveRule(preset.rule) === state.moveSettingsRule
  ));
  els.moveSettingsPresetSelect.disabled = editing;
  els.moveSettingsPresetName.disabled = editing;
  els.moveSettingsPresetSave.disabled = editing || !name || (!hasSameName && state.moveSettingsPresets.length >= MOVE_SETTINGS_PRESET_LIMIT);
  els.moveSettingsRecommendedPresetCreate.disabled = editing || !name;
  els.moveSettingsRecommendedPresetExport.disabled = !state.recommendedMoveSettingsPresets.length;
  els.moveSettingsPresetLoad.disabled = editing || !selected;
  els.moveSettingsPresetDelete.disabled = editing || !selected || builtIn;
  els.moveSettingsPresetEdit.disabled = editing || !selected || builtIn;
  els.moveSettingsPresetEditDone.hidden = !editing;
  els.moveSettingsPresetEdit.hidden = editing;
  updateMoveSettingsPresetEditingUI();
}

function updateMoveSettingsPresetEditingUI() {
  const editing = state.moveSettingsPresetEditing;
  const selection = getMoveSettingsPresetSelectionByReference(
    state.moveSettingsPresetEditingSource,
    state.moveSettingsPresetEditingId,
  );
  const preset = selection?.preset;
  document.body.classList.toggle("is-preset-editing", editing);
  document.body.classList.toggle("is-recommended-preset-editing", editing && selection?.source === "recommended");
  els.moveSettingsPresetEditingNotice.hidden = !editing;
  els.moveSettingsPresetEditingLabel.textContent = selection?.source === "recommended"
    ? "おすすめプリセット編集中"
    : "プリセット編集中";
  els.moveSettingsPresetEditingName.textContent = preset
    ? `「${preset.name}」（${getMoveRuleName(preset.rule)}）`
    : "";
}

function handleMoveSettingsPresetSelectionChange() {
  if (state.moveSettingsPresetEditing) {
    els.moveSettingsPresetSelect.value = getMoveSettingsPresetOptionValue(
      state.moveSettingsPresetEditingSource,
      state.moveSettingsPresetEditingId,
    );
    setMoveSettingsPresetStatus("編集中は別のプリセットを選択できません。編集を終了してから選択してください。", true);
    return;
  }
  updateMoveSettingsPresetActions();
}

function setMoveSettingsPresetStatus(message, isError = false) {
  els.moveSettingsPresetStatus.textContent = message;
  els.moveSettingsPresetStatus.classList.toggle("is-error", isError);
}

function createMoveSettingsPresetId(prefix = "preset") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getMoveSettingsPresetOptionValue(source, id) {
  if (!source || !id) return "";
  return `${source}:${id}`;
}

function getMoveSettingsPresetSelectionByReference(source, id) {
  if (!id || !["user", "recommended", "built-in"].includes(source)) return null;
  const presets = source === "built-in"
    ? state.builtInRecommendedMoveSettingsPresets
    : source === "recommended"
      ? state.recommendedMoveSettingsPresets
      : state.moveSettingsPresets;
  const preset = presets.find((item) => item.id === id);
  return preset ? { source, preset } : null;
}

function getMoveSettingsPresetSelection(value) {
  if (!value || !value.includes(":")) return null;
  const separatorIndex = value.indexOf(":");
  return getMoveSettingsPresetSelectionByReference(
    value.slice(0, separatorIndex),
    value.slice(separatorIndex + 1),
  );
}

function getSelectedMoveSettingsPresetSelection() {
  return getMoveSettingsPresetSelection(els.moveSettingsPresetSelect.value);
}

function getSelectedMoveSettingsPreset() {
  return getSelectedMoveSettingsPresetSelection()?.preset ?? null;
}

function saveCurrentMoveSettingsPreset() {
  const name = els.moveSettingsPresetName.value.trim();
  if (!name) {
    setMoveSettingsPresetStatus("保存名を入力してください。", true);
    els.moveSettingsPresetName.focus();
    return;
  }
  const rule = normalizeMoveRule(state.moveSettingsRule);
  const existingIndex = state.moveSettingsPresets.findIndex((preset) => (
    preset.name === name && normalizeMoveRule(preset.rule) === rule
  ));
  if (existingIndex < 0 && state.moveSettingsPresets.length >= MOVE_SETTINGS_PRESET_LIMIT) {
    setMoveSettingsPresetStatus(`プリセットは最大${MOVE_SETTINGS_PRESET_LIMIT}件です。既存のプリセットを削除してください。`, true);
    return;
  }
  const existing = existingIndex >= 0 ? state.moveSettingsPresets[existingIndex] : null;
  const preset = {
    id: existing?.id ?? createMoveSettingsPresetId(),
    name,
    rule,
    savedAt: new Date().toISOString(),
    moveExclusions: serializeMoveExclusions(state.moveExclusions, rule),
    pokemonExclusions: serializePokemonExclusions(state.pokemonExclusions, rule),
  };
  if (existingIndex >= 0) state.moveSettingsPresets[existingIndex] = preset;
  else state.moveSettingsPresets.unshift(preset);
  saveMoveSettingsPresets();
  renderMoveSettingsPresets();
  els.moveSettingsPresetSelect.value = getMoveSettingsPresetOptionValue("user", preset.id);
  els.moveSettingsPresetName.value = "";
  updateMoveSettingsPresetActions();
  setMoveSettingsPresetStatus(`${getMoveRuleName(rule)}の「${name}」を${existing ? "上書き" : "保存"}しました。`);
}

function createRecommendedMoveSettingsPresetDraft() {
  const name = els.moveSettingsPresetName.value.trim();
  if (!name) {
    setMoveSettingsPresetStatus("おすすめプリセット名を入力してください。", true);
    els.moveSettingsPresetName.focus();
    return;
  }
  const rule = normalizeMoveRule(state.moveSettingsRule);
  const hasSameName = state.recommendedMoveSettingsPresets.some((preset) => (
    preset.name === name && normalizeMoveRule(preset.rule) === rule
  ));
  if (hasSameName) {
    setMoveSettingsPresetStatus(`同じ名前の${getMoveRuleName(rule)}用おすすめ候補があります。選択して編集してください。`, true);
    return;
  }
  const preset = {
    id: createMoveSettingsPresetId("recommended"),
    name,
    rule,
    savedAt: new Date().toISOString(),
    moveExclusions: serializeMoveExclusions(state.moveExclusions, rule),
    pokemonExclusions: serializePokemonExclusions(state.pokemonExclusions, rule),
  };
  state.recommendedMoveSettingsPresets.unshift(preset);
  saveRecommendedMoveSettingsPresetDrafts();
  renderMoveSettingsPresets();
  els.moveSettingsPresetSelect.value = getMoveSettingsPresetOptionValue("recommended", preset.id);
  els.moveSettingsPresetName.value = "";
  enterMoveSettingsPresetEdit();
}

function enterMoveSettingsPresetEdit() {
  const selection = getSelectedMoveSettingsPresetSelection();
  const preset = selection?.preset;
  if (!selection || !preset) return;
  if (selection.source === "built-in") {
    setMoveSettingsPresetStatus("最初から用意されているおすすめプリセットは編集できません。おすすめ作成用に新しく作成してください。", true);
    return;
  }
  const rule = normalizeMoveRule(preset.rule);
  if (rule !== state.moveSettingsRule) {
    setMoveSettingsPresetStatus(`「${preset.name}」は${getMoveRuleName(rule)}用です。${getMoveRuleName(rule)}を選択してから編集してください。`, true);
    return;
  }
  state.moveSettingsPresetEditing = true;
  state.moveSettingsPresetEditingId = preset.id;
  state.moveSettingsPresetEditingSource = selection.source;
  updateMoveSettingsPresetActions();
  setMoveSettingsPresetStatus(`${getMoveRuleName(rule)}の「${preset.name}」を${selection.source === "recommended" ? "おすすめ候補として" : ""}編集中。変更は自動保存されます。`);
}

function exitMoveSettingsPresetEdit() {
  if (!state.moveSettingsPresetEditing) return;
  const selection = getMoveSettingsPresetSelectionByReference(
    state.moveSettingsPresetEditingSource,
    state.moveSettingsPresetEditingId,
  );
  const preset = selection?.preset;
  state.moveSettingsPresetEditing = false;
  state.moveSettingsPresetEditingId = null;
  state.moveSettingsPresetEditingSource = null;
  updateMoveSettingsPresetActions();
  setMoveSettingsPresetStatus(preset ? `「${preset.name}」の編集を終了しました。` : "編集モードを終了しました。");
}

function saveEditingMoveSettingsPreset() {
  if (!state.moveSettingsPresetEditing) return;
  const selection = getMoveSettingsPresetSelectionByReference(
    state.moveSettingsPresetEditingSource,
    state.moveSettingsPresetEditingId,
  );
  const preset = selection?.preset;
  if (!selection || !preset) {
    exitMoveSettingsPresetEdit();
    return;
  }
  const rule = normalizeMoveRule(preset.rule);
  if (rule !== state.moveSettingsRule) return;
  preset.savedAt = new Date().toISOString();
  preset.moveExclusions = serializeMoveExclusions(state.moveExclusions, rule);
  preset.pokemonExclusions = serializePokemonExclusions(state.pokemonExclusions, rule);
  if (selection.source === "recommended") saveRecommendedMoveSettingsPresetDrafts();
  else saveMoveSettingsPresets();
  setMoveSettingsPresetStatus(`「${preset.name}」に自動保存しました。`);
}

function requestMoveSettingsPresetRuleChange(rule) {
  const selection = getMoveSettingsPresetSelectionByReference(
    state.moveSettingsPresetEditingSource,
    state.moveSettingsPresetEditingId,
  );
  const preset = selection?.preset;
  if (!selection || !preset) return;
  state.moveSettingsPresetPending = {
    action: "changeRule",
    presetId: preset.id,
    source: selection.source,
    rule: normalizeMoveRule(rule),
  };
  els.moveSettingsPresetConfirmTitle.textContent = "ルール変更の確認";
  els.moveSettingsPresetConfirmMessage.textContent = `${getMoveRuleName(preset.rule)}のプリセットを編集中です。自動保存したうえで${getMoveRuleName(rule)}に切り替え、編集モードを終了しますか？`;
  els.moveSettingsPresetConfirmApply.textContent = "編集を終了して切替";
  els.moveSettingsPresetConfirmApply.classList.remove("is-danger");
  els.moveSettingsPresetConfirmModal.hidden = false;
  els.moveSettingsPresetConfirmApply.focus();
}

function requestMoveSettingsPresetConfirmation(action) {
  const selection = getSelectedMoveSettingsPresetSelection();
  const preset = selection?.preset;
  if (!selection || !preset) return;
  const isDelete = action === "delete";
  if (isDelete && selection.source === "built-in") {
    setMoveSettingsPresetStatus("最初から用意されているおすすめプリセットは削除できません。", true);
    return;
  }
  const presetRule = normalizeMoveRule(preset.rule);
  const appliesToDifferentRule = !isDelete && presetRule !== state.moveSettingsRule;
  state.moveSettingsPresetPending = {
    action: isDelete ? "delete" : "load",
    presetId: preset.id,
    source: selection.source,
  };
  els.moveSettingsPresetConfirmTitle.textContent = isDelete ? "プリセット削除の確認" : "プリセット呼び出しの確認";
  els.moveSettingsPresetConfirmMessage.textContent = isDelete
    ? `「${preset.name}」を削除します。`
    : appliesToDifferentRule
      ? `${getMoveRuleName(presetRule)}用の「${preset.name}」の内容を、現在の${getMoveRuleName(state.moveSettingsRule)}設定へ反映して上書きします。`
      : `「${preset.name}」を呼び出して、現在のポケモンと技の設定を上書きします。`;
  els.moveSettingsPresetConfirmApply.textContent = isDelete ? "削除する" : "呼び出す";
  els.moveSettingsPresetConfirmApply.classList.toggle("is-danger", isDelete);
  els.moveSettingsPresetConfirmModal.hidden = false;
  els.moveSettingsPresetConfirmApply.focus();
}

function closeMoveSettingsPresetConfirmation() {
  els.moveSettingsPresetConfirmModal.hidden = true;
  state.moveSettingsPresetPending = null;
  els.moveSettingsPresetConfirmApply.classList.remove("is-danger");
}

function confirmMoveSettingsPresetAction() {
  const pending = state.moveSettingsPresetPending;
  const selection = getSelectedMoveSettingsPresetSelection();
  const preset = selection?.preset;
  if (!pending || !selection || !preset || pending.presetId !== preset.id || pending.source !== selection.source) {
    closeMoveSettingsPresetConfirmation();
    return;
  }
  if (pending.action === "changeRule") {
    const nextRule = normalizeMoveRule(pending.rule);
    saveEditingMoveSettingsPreset();
    exitMoveSettingsPresetEdit();
    closeMoveSettingsPresetConfirmation();
    const nextButton = document.querySelector(`.move-settings-rule-tab[data-move-rule="${nextRule}"]`);
    if (nextButton) selectMoveSettingsRule(nextButton);
    return;
  }
  if (pending.action === "delete") {
    if (selection.source === "recommended") {
      state.recommendedMoveSettingsPresets = state.recommendedMoveSettingsPresets.filter((item) => item.id !== preset.id);
      saveRecommendedMoveSettingsPresetDrafts();
    } else if (selection.source === "user") {
      state.moveSettingsPresets = state.moveSettingsPresets.filter((item) => item.id !== preset.id);
      saveMoveSettingsPresets();
    } else {
      closeMoveSettingsPresetConfirmation();
      return;
    }
    closeMoveSettingsPresetConfirmation();
    renderMoveSettingsPresets();
    setMoveSettingsPresetStatus(`${getMoveRuleName(preset.rule)}の「${preset.name}」を削除しました。`);
    return;
  }
  const presetRule = normalizeMoveRule(preset.rule);
  const targetRule = state.moveSettingsRule;
  const copiedAcrossRules = presetRule !== targetRule;
  const restoredMoveExclusions = deserializeMoveExclusions(preset.moveExclusions).get(presetRule) ?? new Map();
  const restoredPokemonExclusions = deserializePokemonExclusions(preset.pokemonExclusions).get(presetRule) ?? new Set();
  state.moveExclusions.set(targetRule, restoredMoveExclusions);
  state.pokemonExclusions.set(targetRule, restoredPokemonExclusions);
  saveMoveExclusions();
  savePokemonExclusions();
  closeMoveSettingsPresetConfirmation();
  refreshMoveSettingsPage();
  setMoveSettingsPresetStatus(`${selection.source === "user" ? "プリセット" : "おすすめプリセット"}「${preset.name}」を${copiedAcrossRules ? `${getMoveRuleName(presetRule)}から現在の${getMoveRuleName(targetRule)}へ反映しました。` : "呼び出しました。"}`);
  refreshSearchAfterMoveSettingsChange();
}

function loadMoveSettingsPresets() {
  try {
    const stored = JSON.parse(localStorage.getItem(MOVE_SETTINGS_PRESETS_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .map((preset) => {
        if (!preset || typeof preset !== "object" || Array.isArray(preset)) return null;
        const name = typeof preset.name === "string" ? preset.name.trim() : "";
        if (!name) return null;
        return {
          id: typeof preset.id === "string" && preset.id ? preset.id : createMoveSettingsPresetId(),
          name,
          rule: normalizeMoveRule(preset.rule),
          savedAt: typeof preset.savedAt === "string" ? preset.savedAt : "",
          moveExclusions: preset.moveExclusions,
          pokemonExclusions: preset.pokemonExclusions,
        };
      })
      .filter(Boolean)
      .slice(0, MOVE_SETTINGS_PRESET_LIMIT);
  } catch {
    return [];
  }
}

function normalizeBuiltInRecommendedMoveSettingsPresets(payload) {
  const stored = Array.isArray(payload) ? payload : payload?.presets;
  if (!Array.isArray(stored)) return [];
  const usedIds = new Set();
  return stored
    .map((preset, index) => {
      if (!preset || typeof preset !== "object" || Array.isArray(preset)) return null;
      const name = typeof preset.name === "string" ? preset.name.trim() : "";
      if (!name) return null;
      const fallbackId = `built-in-recommended-${index + 1}`;
      const id = typeof preset.id === "string" && preset.id.trim() ? preset.id.trim() : fallbackId;
      if (usedIds.has(id)) return null;
      usedIds.add(id);
      return {
        id,
        name,
        rule: normalizeMoveRule(preset.rule),
        savedAt: typeof preset.savedAt === "string" ? preset.savedAt : "",
        moveExclusions: preset.moveExclusions,
        pokemonExclusions: preset.pokemonExclusions,
      };
    })
    .filter(Boolean);
}

function saveMoveSettingsPresets() {
  try {
    localStorage.setItem(
      MOVE_SETTINGS_PRESETS_STORAGE_KEY,
      JSON.stringify(state.moveSettingsPresets.slice(0, MOVE_SETTINGS_PRESET_LIMIT)),
    );
  } catch {
    // Ignore unavailable storage; the current session still uses the in-memory presets.
  }
}

function loadRecommendedMoveSettingsPresetDrafts() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECOMMENDED_MOVE_SETTINGS_PRESETS_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .map((preset) => {
        if (!preset || typeof preset !== "object" || Array.isArray(preset)) return null;
        const name = typeof preset.name === "string" ? preset.name.trim() : "";
        if (!name) return null;
        return {
          id: typeof preset.id === "string" && preset.id
            ? preset.id
            : createMoveSettingsPresetId("recommended"),
          name,
          rule: normalizeMoveRule(preset.rule),
          savedAt: typeof preset.savedAt === "string" ? preset.savedAt : "",
          moveExclusions: preset.moveExclusions,
          pokemonExclusions: preset.pokemonExclusions,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveRecommendedMoveSettingsPresetDrafts() {
  try {
    localStorage.setItem(
      RECOMMENDED_MOVE_SETTINGS_PRESETS_STORAGE_KEY,
      JSON.stringify(state.recommendedMoveSettingsPresets),
    );
  } catch {
    // Ignore unavailable storage; the current session still uses the in-memory drafts.
  }
}

function exportRecommendedMoveSettingsPresetDrafts() {
  if (!state.recommendedMoveSettingsPresets.length) {
    setMoveSettingsPresetStatus("書き出せるおすすめ候補がありません。", true);
    return;
  }
  if (state.moveSettingsPresetEditing && state.moveSettingsPresetEditingSource === "recommended") {
    saveEditingMoveSettingsPreset();
  }
  const exportedAt = new Date();
  const payload = {
    format: "champions-ev-line-search-recommended-presets",
    schemaVersion: 1,
    exportedAt: exportedAt.toISOString(),
    presets: state.recommendedMoveSettingsPresets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      rule: normalizeMoveRule(preset.rule),
      savedAt: preset.savedAt,
      moveExclusions: preset.moveExclusions,
      pokemonExclusions: preset.pokemonExclusions,
    })),
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `recommended-presets-${exportedAt.toISOString().slice(0, 10).replaceAll("-", "")}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  setMoveSettingsPresetStatus(`おすすめ候補${state.recommendedMoveSettingsPresets.length}件をJSONに書き出しました。`);
}

function selectMoveSettingsView(selectedButton) {
  if (selectedButton.dataset.moveSettingsView === "bulk") {
    if (state.moveSettingsPresetEditing) {
      setMoveSettingsPresetStatus("編集中は一括設定へ移動できません。編集を終了してから移動してください。", true);
      return;
    }
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
  if (state.moveSettingsPresetEditing && rule !== state.moveSettingsRule) {
    requestMoveSettingsPresetRuleChange(rule);
    return;
  }
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
  renderMoveSettingsPresets();
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
  else if (state.searchNeedsRefresh) {
    state.searchNeedsRefresh = false;
    runSearch();
  }
}

function refreshSearchAfterMoveSettingsChange() {
  if (els.searchPage.hidden) {
    state.searchNeedsRefresh = true;
    return;
  }
  state.searchNeedsRefresh = false;
  runSearch();
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
  els.moveSettingsPresetBar.hidden = isBulk;
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
  saveEditingMoveSettingsPreset();
  if (state.moveSettingsRule === rule) {
    renderMoveSettingsPokemonList();
    renderMoveSettingsMoveList();
  }
  refreshSearchAfterMoveSettingsChange();
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
  saveEditingMoveSettingsPreset();
  if (state.moveSettingsRule === rule) {
    renderMoveSettingsPokemonList();
    renderMoveSettingsMoveList();
  }
  refreshSearchAfterMoveSettingsChange();
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
  saveEditingMoveSettingsPreset();
  if (state.moveSettingsRule === rule) {
    renderMoveSettingsPokemonList();
    renderMoveSettingsMoveList();
  }
  refreshSearchAfterMoveSettingsChange();
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
}

function handleMoveSettingsPokemonListClick(event) {
  const button = event.target.closest(".move-settings-pokemon-option");
  if (!button || !els.moveSettingsPokemonList.contains(button)) return;
  const pokemonId = button.dataset.pokemonId;
  if (!pokemonId || pokemonId === state.moveSettingsPokemonId) return;
  const previous = els.moveSettingsPokemonList.querySelector(".move-settings-pokemon-option.is-selected");
  previous?.classList.remove("is-selected");
  previous?.setAttribute("aria-selected", "false");
  button.classList.add("is-selected");
  button.setAttribute("aria-selected", "true");
  state.moveSettingsPokemonId = pokemonId;
  renderMoveSettingsMoveList();
}

function handleMoveSettingsPokemonListChange(event) {
  const checkbox = event.target.closest(".move-settings-pokemon-toggle-input");
  if (!checkbox || !els.moveSettingsPokemonList.contains(checkbox)) return;
  setPokemonIncluded(checkbox.dataset.pokemonId, checkbox.checked);
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
}

function handleMoveSettingsMoveListChange(event) {
  const checkbox = event.target.closest(".move-setting-checkbox");
  if (!checkbox || !els.moveSettingsMoveList.contains(checkbox)) return;
  setMoveIncluded(checkbox.dataset.pokemonId, checkbox.dataset.moveId, checkbox.checked);
}

function getMovesForPokemon(pokemon) {
  return state.moves
    .filter((move) => isMoveAllowed(move.id) && Array.isArray(move.users) && move.users.includes(pokemon.id))
    .map((move) => getAttackerAdjustedMove(move, pokemon))
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

function getMoveRuleName(rule) {
  return normalizeMoveRule(rule) === "double" ? "ダブル" : "シングル";
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
  const pokemonById = new Map(state.pokemon.map((pokemon) => [pokemon.id, pokemon]));

  const movesByPokemon = new Map();
  state.moves.forEach((move) => {
    if (!isMoveAllowed(move.id)) return;
    const power = Number(move.power);
    if (!move.type || !Number.isFinite(power) || power <= 0) return;
    if (!Array.isArray(move.users)) return;
    move.users.forEach((pokemonId) => {
      const adjustedMove = getAttackerAdjustedMove(move, pokemonById.get(pokemonId));
      const movesByType = movesByPokemon.get(pokemonId) ?? new Map();
      const moves = movesByType.get(adjustedMove.type) ?? [];
      moves.push({ move: adjustedMove, power });
      movesByType.set(adjustedMove.type, moves);
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
  saveEditingMoveSettingsPreset();
  const checkbox = [...els.moveSettingsPokemonList.querySelectorAll(".move-settings-pokemon-toggle-input")]
    .find((item) => item.dataset.pokemonId === pokemonId);
  if (checkbox) {
    checkbox.checked = included;
    checkbox.closest(".move-settings-pokemon-entry")?.classList.toggle("is-disabled", !included);
  }
  refreshSearchAfterMoveSettingsChange();
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
  saveEditingMoveSettingsPreset();
  updateMoveSettingsMoveSummary(pokemonId);
  refreshSearchAfterMoveSettingsChange();
}

function updateMoveSettingsMoveSummary(pokemonId = state.moveSettingsPokemonId) {
  const pokemon = getPokemonPool().find((item) => item.id === pokemonId);
  if (!pokemon) return;
  const moves = getMovesForPokemon(pokemon);
  const excluded = getMoveExclusions(pokemon.id);
  const includedCount = moves.filter((move) => !excluded.has(move.id)).length;
  els.moveSettingsSummary.textContent = `${includedCount}/${moves.length}技を検索対象`;
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
  saveEditingMoveSettingsPreset();
  renderMoveSettingsMoveList();
  refreshSearchAfterMoveSettingsChange();
}

function serializeMoveExclusions(exclusions = state.moveExclusions, targetRule = null) {
  const stored = {};
  const rules = targetRule ? [normalizeMoveRule(targetRule)] : MOVE_SETTING_RULES;
  rules.forEach((rule) => {
    const ruleExclusions = exclusions?.get(rule);
    const ruleStored = Object.fromEntries(
      [...(ruleExclusions?.entries() ?? [])]
        .filter(([, moveIds]) => moveIds instanceof Set && moveIds.size)
        .map(([pokemonId, moveIds]) => [pokemonId, [...moveIds]]),
    );
    if (Object.keys(ruleStored).length) stored[rule] = ruleStored;
  });
  return stored;
}

function deserializeMoveExclusions(stored) {
  const exclusions = createMoveExclusionState();
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return exclusions;
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
  return exclusions;
}

function loadMoveExclusions() {
  try {
    return deserializeMoveExclusions(JSON.parse(localStorage.getItem(MOVE_SETTINGS_STORAGE_KEY) ?? "{}"));
  } catch {
    // Ignore unavailable or malformed local settings and use the default (all included).
    return createMoveExclusionState();
  }
}

function saveMoveExclusions() {
  try {
    localStorage.setItem(MOVE_SETTINGS_STORAGE_KEY, JSON.stringify(serializeMoveExclusions()));
  } catch {
    // Ignore unavailable storage; the current session still uses the in-memory settings.
  }
}

function serializePokemonExclusions(exclusions = state.pokemonExclusions, targetRule = null) {
  const stored = {};
  const rules = targetRule ? [normalizeMoveRule(targetRule)] : MOVE_SETTING_RULES;
  rules.forEach((rule) => {
    const excluded = exclusions?.get(rule);
    if (excluded instanceof Set && excluded.size) stored[rule] = [...excluded];
  });
  return stored;
}

function deserializePokemonExclusions(stored) {
  const exclusions = createPokemonExclusionState();
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return exclusions;
  MOVE_SETTING_RULES.forEach((rule) => {
    const ruleExclusions = exclusions.get(rule);
    const moveRuleData = stored[rule];
    if (!Array.isArray(moveRuleData)) return;
    moveRuleData.forEach((pokemonId) => {
      if (typeof pokemonId === "string") ruleExclusions.add(pokemonId);
    });
  });
  return exclusions;
}

function loadPokemonExclusions() {
  try {
    return deserializePokemonExclusions(JSON.parse(localStorage.getItem(POKEMON_SETTINGS_STORAGE_KEY) ?? "{}"));
  } catch {
    // Ignore unavailable or malformed local settings and use the default (all enabled).
    return createPokemonExclusionState();
  }
}

function savePokemonExclusions() {
  try {
    localStorage.setItem(POKEMON_SETTINGS_STORAGE_KEY, JSON.stringify(serializePokemonExclusions()));
  } catch {
    // Ignore unavailable storage; the current session still uses the in-memory settings.
  }
}

function getSortedPokemonPool() {
  return [...getPokemonPool()].sort(comparePokemonByName);
}

function normalizePokemonSort(value) {
  return ["name", "dex-number", "base-stat-desc", "base-stat-asc"].includes(value) ? value : "name";
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
  if (sort === "dex-number") {
    const aDexNumber = Number(a.dexNumber);
    const bDexNumber = Number(b.dexNumber);
    const safeADexNumber = Number.isInteger(aDexNumber) ? aDexNumber : Number.MAX_SAFE_INTEGER;
    const safeBDexNumber = Number.isInteger(bDexNumber) ? bDexNumber : Number.MAX_SAFE_INTEGER;
    const aFormRank = a.id.split("-").length;
    const bFormRank = b.id.split("-").length;
    return safeADexNumber - safeBDexNumber || aFormRank - bFormRank || comparePokemonByName(a, b);
  }
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

const WEATHER_BALL_TYPES = {
  sunny: "fire",
  rain: "water",
  sand: "rock",
  snow: "ice",
};
const SOLAR_MOVE_IDS = new Set(["solar-beam", "solar-blade"]);

function getSelectedWeather(input) {
  return input.weather ?? "none";
}

function getWeatherFromAbility(pokemon) {
  if (!pokemon) return null;
  for (const [weather, setter] of Object.entries(state.battleEffects?.weatherSetters ?? {})) {
    const pokemonIds = Array.isArray(setter) ? setter : setter.pokemonIds ?? [];
    if (pokemonIds.includes(pokemon.id)) return weather;
  }
  return null;
}

function getAttackerWeatherOverride(pokemon) {
  if (!pokemon) return null;
  const effect = Object.values(state.battleEffects?.attacker ?? {}).find((entry) => {
    return entry.stage === "weather" && entry.pokemonIds?.includes(pokemon.id);
  });
  return effect?.weather ?? null;
}

function getBattleWeather(attacker, defender, input) {
  const attackerWeatherOverride = getAttackerWeatherOverride(attacker);
  if (attackerWeatherOverride) return attackerWeatherOverride;
  const selectedWeather = getSelectedWeather(input);
  if (selectedWeather !== "none" || !input.weatherAbilityAlways) return selectedWeather;
  return getWeatherFromAbility(attacker) ?? getWeatherFromAbility(defender) ?? "none";
}

function getAttackerAdjustedMove(move, attacker) {
  const attackerType = move.typeByPokemonId?.[attacker?.id];
  return attackerType && attackerType !== move.type ? { ...move, type: attackerType } : move;
}

function getWeatherAdjustedMove(move, weather) {
  if (move.id !== "weather-ball" || !WEATHER_BALL_TYPES[weather]) return move;
  return {
    ...move,
    power: 100,
    type: WEATHER_BALL_TYPES[weather],
  };
}

function getWeatherMovePowerModifier(move, weather) {
  return SOLAR_MOVE_IDS.has(move.id) && ["rain", "sand", "snow"].includes(weather) ? 0.5 : 1;
}

function getWeatherDamageModifier(moveType, weather) {
  if (weather === "sunny") {
    if (moveType === "fire") return 1.5;
    if (moveType === "water") return 0.5;
  }
  if (weather === "rain") {
    if (moveType === "water") return 1.5;
    if (moveType === "fire") return 0.5;
  }
  return 1;
}

function getWeatherAdjustedDefense(defender, moveCategory, defense, weather) {
  if (weather === "sand" && moveCategory === "special" && defender.types.includes("rock")) {
    return Math.floor(defense * 1.5);
  }
  if (weather === "snow" && moveCategory === "physical" && defender.types.includes("ice")) {
    return Math.floor(defense * 1.5);
  }
  return defense;
}

function getBattleEffect(scope, key) {
  return state.battleEffects?.[scope]?.[key] ?? null;
}

function isBattleEffectPokemon(scope, key, pokemonId) {
  return getBattleEffect(scope, key)?.pokemonIds?.includes(pokemonId) ?? false;
}

function getMatchingBattleEffects(scope, pokemonId, moveType, effectiveness = 1, moveCategory = null) {
  return Object.values(state.battleEffects?.[scope] ?? {}).filter((effect) => {
    if (!effect.pokemonIds?.includes(pokemonId)) return false;
    if (effect.moveTypes?.length && !effect.moveTypes.includes(moveType)) return false;
    if (effect.moveCategories?.length && !effect.moveCategories.includes(moveCategory)) return false;
    if (effect.superEffectiveOnly && effectiveness <= 1) return false;
    return true;
  });
}

function getAttackerStatEffects(pokemonId, category) {
  return getMatchingBattleEffects("attacker", pokemonId, null, 1, category)
    .filter((effect) => effect.stage === "attack");
}

function getAttackerStatModifier(pokemonId, category) {
  return getAttackerStatEffects(pokemonId, category)
    .reduce((combined, effect) => combined * effect.modifier, 1);
}

function updateMultiscaleOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && isBattleEffectPokemon("defender", "multiscale", pokemon.id));
  const wasVisible = !els.multiscaleOption.hidden;
  els.multiscaleOption.hidden = !isSupported;
  if (!isSupported) els.multiscaleEnabled.checked = false;
  else if (!wasVisible) els.multiscaleEnabled.checked = true;
}

function updateThickFatOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && isBattleEffectPokemon("defender", "thickFat", pokemon.id));
  const wasVisible = !els.thickFatOption.hidden;
  els.thickFatOption.hidden = !isSupported;
  if (!isSupported) els.thickFatEnabled.checked = false;
  else if (!wasVisible) els.thickFatEnabled.checked = true;
}

function updateHeatproofOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && isBattleEffectPokemon("defender", "heatproof", pokemon.id));
  const wasVisible = !els.heatproofOption.hidden;
  els.heatproofOption.hidden = !isSupported;
  if (!isSupported) els.heatproofEnabled.checked = false;
  else if (!wasVisible) els.heatproofEnabled.checked = true;
}

function updateDrySkinOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && isBattleEffectPokemon("defender", "drySkin", pokemon.id));
  const wasVisible = !els.drySkinOption.hidden;
  els.drySkinOption.hidden = !isSupported;
  if (!isSupported) els.drySkinEnabled.checked = false;
  else if (!wasVisible) els.drySkinEnabled.checked = true;
}

function updateFilterOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && isBattleEffectPokemon("defender", "filter", pokemon.id));
  const wasVisible = !els.filterOption.hidden;
  els.filterOption.hidden = !isSupported;
  if (!isSupported) els.filterEnabled.checked = false;
  else if (!wasVisible) els.filterEnabled.checked = true;
}

function updateHardRockOption(pokemon = getPokemonPool().find((item) => item.id === els.defenderSelect.value)) {
  const isSupported = Boolean(pokemon && isBattleEffectPokemon("defender", "hardRock", pokemon.id));
  const wasVisible = !els.hardRockOption.hidden;
  els.hardRockOption.hidden = !isSupported;
  if (!isSupported) els.hardRockEnabled.checked = false;
  else if (!wasVisible) els.hardRockEnabled.checked = true;
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
  } else if (group === "wall") {
    // 壁は複数選択と全解除を許可する。適用時の補正は重複させない。
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
    const candidateResults = [];

    for (let candidateIndex = 0; candidateIndex < candidateStats.length; candidateIndex += 1) {
      const { candidate, after } = candidateStats[candidateIndex];
      if (!matchesRelevantDefensiveInvestment(representative.move.category, candidate)) continue;
      const candidateTotal = candidate.hpAdd + candidate.defAdd + candidate.spdAdd;
      const damageInput = {
        level: state.rules.level,
        power: representative.calculationPower,
        attack: representative.attackStat,
        defense: getWeatherAdjustedDefense(
          defender,
          representative.move.category,
          representative.move.category === "physical" ? after.def : after.spd,
          representative.battleWeather,
        ),
        stab: representative.stab,
        effectiveness: representative.effectiveness,
        rule: input.battleRule,
        isSpreadMove: representative.move.isSpreadMove,
        weatherModifier: representative.weatherModifier,
        mModifier: representative.mModifier,
        mProtectModifier: representative.mProtectModifier,
      };
      const {
        maxDamage: afterDamage,
        minDamage: afterMinDamage,
        koRate: afterKoRate,
      } = calcDamageResult(damageInput, after.hp);
      candidateResults.push({
        candidate,
        candidateIndex,
        candidateTotal,
        afterDamage,
        afterMinDamage,
        afterKoRate,
      });
    }

    const hasGuaranteedSurvivalCandidate = candidateResults.some(({ afterKoRate }) => afterKoRate === 0);

    for (const candidateResult of candidateResults) {
      const {
        candidate,
        candidateIndex,
        candidateTotal,
        afterDamage,
        afterMinDamage,
        afterKoRate,
      } = candidateResult;
      if (minimumCandidateTotal !== null && candidateTotal > minimumCandidateTotal) break;
      if (afterKoRate < 100) isSurvivable = true;
      if (
        !input.randomToGuaranteedSurvival
        && !input.showNonGuaranteedWhenGuaranteed
        && hasGuaranteedSurvivalCandidate
        && afterKoRate !== 0
      ) continue;
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

  const visibleRows = input.showNonGuaranteedWhenGuaranteed && !input.randomToGuaranteedSurvival
    ? rows
    : filterRowsWithGuaranteedSurvival(rows);
  renderResults(visibleRows, getRelevantCandidateCount(candidates, input.attackKinds));
}

function filterRowsWithGuaranteedSurvival(rows) {
  const guaranteedGroupKeys = new Set(
    rows
      .filter((row) => row.afterKoRate === 0)
      .map((row) => `${row.attacker.id}|${row.move.id}`),
  );
  if (!guaranteedGroupKeys.size) return rows;

  return rows.filter((row) => {
    const groupKey = `${row.attacker.id}|${row.move.id}`;
    return !guaranteedGroupKeys.has(groupKey) || row.afterKoRate === 0;
  });
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
      // Damage reductions are displayed as negative values, so compare them in
      // reverse numeric order to make a larger reduction count as "higher".
      comparison = b.diff - a.diff;
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

function getResultMoveName(attacker, move) {
  const name = move.name?.ja ?? move.name?.en ?? move.id;
  const suffix = getMatchingBattleEffects("attacker", attacker.id, move.type)
    .map((effect) => effect.resultSuffix ?? "")
    .join("");
  return `${name}${suffix}`;
}

function getResultAttackerName(attacker, move) {
  const abilityNames = [...new Set(
    getAttackerStatEffects(attacker.id, move.category)
      .map((effect) => effect.abilityName)
      .filter(Boolean),
  )];
  const suffix = abilityNames.map((name) => `（${name}）`).join("");
  return `${getPokemonDisplayName(attacker)}${suffix}`;
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
    if (!matchesAttackKind(move.category, input.attackKinds)) continue;

    for (const attackerId of move.users) {
      const attacker = attackerById.get(attackerId);
      if (!attacker || !isPokemonIncluded(attackerId, input.battleRule)) continue;
      if (!isMoveAllowedForPokemon(attackerId, move.id, input.battleRule)) continue;
      const battleWeather = getBattleWeather(attacker, defender, input);
      const attackerAdjustedMove = getAttackerAdjustedMove(move, attacker);
      const effectiveMove = getWeatherAdjustedMove(attackerAdjustedMove, battleWeather);
      if (!matchesMovePower(effectiveMove, input.movePower, input.powerComparison, input.includePriorityMoves)) continue;
      const effectiveness = calcEffectiveness(effectiveMove.type, defender.types);
      if (effectiveness === 0 || !matchesEffectiveness(effectiveness, input.effectiveness)) continue;
      if (input.higherOffenseOnly && !matchesHigherOffense(attacker, move.category)) continue;
      const calculationPower = getAdjustedMovePower(defender, input, effectiveMove, battleWeather);
      const stab = attacker.types.includes(effectiveMove.type) ? 1.5 : 1;
      if (input.stabOnly && stab === 1) continue;
      const mModifier = calculateFinalDamageM(getFinalDamageMEffects(
        attacker,
        defender,
        input,
        effectiveness,
        effectiveMove,
      ));
      const mProtectModifier = 1;
      const weatherModifier = getWeatherDamageModifier(effectiveMove.type, battleWeather);
      for (const attackerPoints of input.attackerPoints) {
        for (const attackerNature of attackerNatureModes) {
          const attackStat = calcAttackStat(attacker, effectiveMove.category, attackerPoints, attackerNature);
          if (input.attackStatMultipleOf11 && attackStat % 11 !== 0) continue;
          const damageProfileKey = [
            effectiveMove.category,
            calculationPower,
            attackStat,
            stab,
            effectiveness,
            Number(effectiveMove.isSpreadMove),
            weatherModifier,
            mModifier,
            mProtectModifier,
            battleWeather,
          ].join("|");
          let currentDamageResult = currentDamageCache.get(damageProfileKey);
          if (!currentDamageResult) {
            const damageInput = {
              level: state.rules.level,
              power: calculationPower,
              attack: attackStat,
              defense: getWeatherAdjustedDefense(
                defender,
                effectiveMove.category,
                effectiveMove.category === "physical" ? current.def : current.spd,
                battleWeather,
              ),
              stab,
              effectiveness,
              rule: input.battleRule,
              isSpreadMove: effectiveMove.isSpreadMove,
              weatherModifier,
              mModifier,
              mProtectModifier,
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
            move: effectiveMove,
            attackStat,
            attackerPoints,
            attackerNature,
            effectiveness,
            stab,
            calculationPower,
            weatherModifier,
            mModifier,
            mProtectModifier,
            battleWeather,
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
    weather: getCheckedValues("weather")[0] ?? "none",
    weatherAbilityAlways: els.weatherAbilityAlways.checked,
    walls: getCheckedValues("wall"),
    movePower: els.movePower.value === "" ? null : clamp(toInt(els.movePower.value), 1, 250),
    powerComparison: getCheckedValues("powerComparison")[0] ?? "gte",
    includePriorityMoves: els.includePriorityMoves.checked,
    higherOffenseOnly: els.higherOffenseOnly.checked,
    attackStatMultipleOf11: els.attackStatMultipleOf11.checked,
    stabOnly: els.stabOnly.checked,
    randomToGuaranteedSurvival: els.randomToGuaranteedSurvival.checked,
    showNonGuaranteedWhenGuaranteed: els.showNonGuaranteedWhenGuaranteed.checked,
    excludeUnsurvivableAttacks: els.excludeUnsurvivableAttacks.checked,
    prioritizeMega: els.prioritizeMega.checked,
    multiscaleEnabled: els.multiscaleEnabled.checked,
    thickFatEnabled: els.thickFatEnabled.checked,
    heatproofEnabled: els.heatproofEnabled.checked,
    drySkinEnabled: els.drySkinEnabled.checked,
    filterEnabled: els.filterEnabled.checked,
    hardRockEnabled: els.hardRockEnabled.checked,
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
  const baseAttackStat = calcNonHpStat(pokemon.baseStats[statKey], statPoints, natureMode);
  return Math.floor(baseAttackStat * getAttackerStatModifier(pokemon.id, category));
}

function calcNonHpStat(baseStat, statPoints, natureMode) {
  const baseValue = Math.floor(((2 * baseStat + 31) * state.rules.level) / 100 + 5);
  const nature = state.rules.nature[natureMode] ?? state.rules.nature.neutral;
  return Math.floor((baseValue + statPointToBonus(statPoints)) * nature);
}

function calcHpStat(baseStat, statPoints) {
  return Math.floor(((2 * baseStat + 31) * state.rules.level) / 100 + state.rules.level + 10) + statPointToBonus(statPoints);
}

function getDefenderPowerModifier(defender, input, moveType) {
  return getMatchingBattleEffects("defender", defender.id, moveType)
    .filter((effect) => effect.stage === "power" && (!effect.inputKey || input[effect.inputKey]))
    .reduce((modifier, effect) => modifier * effect.modifier, 1);
}

function getAdjustedMovePower(defender, input, move, defenderWeather = "none") {
  const modifier = getDefenderPowerModifier(defender, input, move.type)
    * getWeatherMovePowerModifier(move, defenderWeather);
  return applyPowerModifier(move.power, modifier);
}

function getWallDamageModifier(input, move) {
  if (move.ignoresScreens) return 1;
  const hasRelevantWall = input.walls.includes("auroraVeil")
    || (move.category === "physical" && input.walls.includes("reflect"))
    || (move.category === "special" && input.walls.includes("lightScreen"));
  return hasRelevantWall ? WALL_DAMAGE_MODIFIERS[input.battleRule] ?? 1 : 1;
}

function getFinalDamageMEffects(attacker, defender, input, effectiveness, move) {
  const wallModifier = getWallDamageModifier(input, move);
  const wallEffects = wallModifier === 1 ? [] : [{ mGroup: "wall", modifier: wallModifier }];
  const attackerEffects = getMatchingBattleEffects("attacker", attacker.id, move.type, effectiveness, move.category)
    .filter((effect) => effect.stage === "damage" && (!effect.inputKey || input[effect.inputKey]));
  const defenderEffects = getMatchingBattleEffects("defender", defender.id, move.type, effectiveness, move.category)
    .filter((effect) => effect.stage === "damage" && (!effect.inputKey || input[effect.inputKey]));
  return [...wallEffects, ...attackerEffects, ...defenderEffects].sort((a, b) => {
    return (FINAL_DAMAGE_M_GROUP_RANK.get(a.mGroup) ?? FINAL_DAMAGE_M_GROUP_ORDER.length)
      - (FINAL_DAMAGE_M_GROUP_RANK.get(b.mGroup) ?? FINAL_DAMAGE_M_GROUP_ORDER.length);
  });
}

function calculateFinalDamageM(effects) {
  let fixedPointM = 4096;
  for (const effect of effects) {
    const fixedPointModifier = Math.trunc(effect.modifier * 4096);
    fixedPointM = Math.round((fixedPointM * fixedPointModifier) / 4096);
  }
  return fixedPointM / 4096;
}

function calcDamageResult(damageInput, hp) {
  const baseDamage = calcBaseDamage(damageInput);
  const maxDamage = calcDamageAtRandom(baseDamage, damageInput, state.rules.damageRandomMax);
  const minDamage = calcDamageAtRandom(baseDamage, damageInput, state.rules.damageRandomMin ?? 0.85);
  const koRate = calcOneHitKoRate(
    baseDamage,
    damageInput,
    hp,
    maxDamage,
    minDamage,
  );
  return { maxDamage, minDamage, koRate };
}

function calcBaseDamage({ level, power, attack, defense }) {
  const levelFactor = Math.floor((2 * level) / 5 + 2);
  const basePowerDamage = Math.floor((levelFactor * power * attack) / defense);
  return Math.floor(basePowerDamage / 50) + 2;
}

function calcDamageAtRandom(baseDamage, damageInput, randomModifier) {
  const rangeModifier = damageInput.rule === "double" && damageInput.isSpreadMove
    ? state.rules.doubleSpreadModifier
    : 1;
  let damage = baseDamage;
  damage = applyDamageModifier(damage, rangeModifier);
  damage = applyDamageModifier(damage, damageInput.parentalBondModifier ?? 1);
  damage = applyDamageModifier(damage, damageInput.weatherModifier ?? 1);
  damage = applyDamageModifier(damage, damageInput.criticalModifier ?? 1);
  damage = applyFloorModifier(damage, randomModifier);
  damage = applyFloorModifier(damage, damageInput.stab ?? 1);
  damage = applyTypeEffectiveness(damage, damageInput.effectiveness ?? 1);
  damage = applyFloorModifier(damage, damageInput.burnModifier ?? 1);
  damage = applyDamageModifier(damage, damageInput.mModifier ?? 1);
  damage = applyDamageModifier(damage, damageInput.mProtectModifier ?? 1);
  return damage;
}

function applyDamageModifier(damage, modifier) {
  const fixedPointModifier = Math.trunc(modifier * 4096);
  return Math.trunc((Math.trunc(damage * fixedPointModifier) + 2048 - 1) / 4096);
}

function applyFloorModifier(damage, modifier) {
  return Math.trunc(damage * modifier);
}

function applyPowerModifier(power, modifier) {
  const fixedPointModifier = Math.trunc(modifier * 4096);
  return Math.trunc((power * fixedPointModifier) / 4096);
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

function calcOneHitKoRate(baseDamage, damageInput, hp, maxDamage, minDamage) {
  if (maxDamage < hp) return 0;
  if (minDamage >= hp) return 100;
  let lowestKoRoll = 86;
  let highestKoRoll = 100;
  while (lowestKoRoll < highestKoRoll) {
    const randomPercent = Math.floor((lowestKoRoll + highestKoRoll) / 2);
    const damage = calcDamageAtRandom(baseDamage, damageInput, randomPercent / 100);
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
  const physicalModifier = getAttackerStatModifier(pokemon.id, "physical");
  const specialModifier = getAttackerStatModifier(pokemon.id, "special");
  const physicalOffense = pokemon.baseStats.atk * physicalModifier;
  const specialOffense = pokemon.baseStats.spa * specialModifier;
  if (category === "physical") return physicalOffense >= specialOffense;
  if (category === "special") return specialOffense >= physicalOffense;
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
      els.resultsBody.querySelectorAll(`.result-detail-panel-row[data-result-group="${groupIndex}"]`).forEach((detailRow) => {
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
          <span class="result-group-attacker">${escapeHtml(getResultAttackerName(representative.attacker, representative.move))}</span>
          <span class="result-group-move">${escapeHtml(getResultMoveName(representative.attacker, representative.move))}</span>
          <span class="result-group-power">威力 ${escapeHtml(String(representative.move.power))}</span>
          <span class="result-group-representative ${lineClass}">代表 ${formatProbability(representative.currentKoRate)}→${formatProbability(representative.afterKoRate)}</span>
          <span class="result-group-diff ${diffClass}">変化 ${diffLabel}</span>
          <span class="result-group-count">${detailsLabel}</span>
        </button>
      </td>
    </tr>
    ${renderResultDetailPanel(group, groupIndex)}
  `;
}

function renderResultDetailPanel(group, groupIndex) {
  const representative = group.rows[0];
  const detailLabel = `${getResultAttackerName(representative.attacker, representative.move)} ${getResultMoveName(representative.attacker, representative.move)}の詳細`;
  return `
    <tr class="result-detail-panel-row" data-result-group="${groupIndex}" hidden>
      <td colspan="11" class="result-detail-panel-cell">
        <div class="result-detail-table" role="table" aria-label="${escapeHtml(detailLabel)}">
          <div class="result-detail-grid result-detail-header" role="row">
            <span role="columnheader">1発KO率</span>
            <span role="columnheader">配分</span>
            <span role="columnheader">攻撃条件</span>
            <span role="columnheader">ダメージ</span>
          </div>
          ${group.rows.map((row, detailIndex) => renderResultDetailRow(row, detailIndex)).join("")}
        </div>
      </td>
    </tr>
  `;
}

function renderResultDetailRow(row, detailIndex) {
  const lineClass = row.afterKoRate < row.currentKoRate ? "line-good" : "";
  const diffClass = getResultDiffClass(row.diff);
  const attackLabel = row.move.category === "physical" ? "A" : "C";
  const natureLabel = row.attackerNature === "boost" ? "有" : "無";
  return `
    <div class="result-detail-grid result-detail-item${detailIndex % 2 ? " is-alternate" : ""}" role="row">
      <span class="result-detail-ko ${lineClass}" role="cell">${formatProbability(row.currentKoRate)}→${formatProbability(row.afterKoRate)}</span>
      <span class="result-detail-allocation" role="cell">${formatCandidate(row.candidate)}</span>
      <span class="result-detail-attack" role="cell"><strong>${attackLabel}${row.attackStat}（${row.attackerPoints}）</strong><span>補正 ${natureLabel}</span></span>
      <span class="result-detail-damage" role="cell"><span class="result-detail-current">${row.currentDamage}</span><span class="result-detail-arrow" aria-hidden="true">→</span><strong class="result-detail-after">${row.afterDamage}</strong><span class="result-detail-diff ${diffClass}">${formatResultDiff(row.diff)}</span></span>
    </div>
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
