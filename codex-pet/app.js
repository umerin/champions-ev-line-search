const STATUS = {
  working: { label: "作業中", description: "いま作業を進めています。", row: 0 },
  idle: { label: "待機中", description: "次の指示を待っています。", row: 1 },
  waiting: { label: "確認待ち", description: "あなたの確認や判断を待っています。", row: 3 },
  done: { label: "完了", description: "作業が完了しました。", row: 4 },
  error: { label: "エラー", description: "確認が必要な状態です。", row: 5 },
};

const storageKey = "codex-pet-status";
const petVisual = document.querySelector("#pet-visual");
const petDescription = document.querySelector("#pet-description");
const sourceLabel = document.querySelector("#source-label");
const statusOptions = [...document.querySelectorAll(".status-option")];
const demoButton = document.querySelector("#demo-button");
const settingsDialog = document.querySelector("#settings-dialog");
const reducedMotionToggle = document.querySelector("#reduced-motion-toggle");
let demoTimer = null;

function normalizeStatus(status) {
  return Object.hasOwn(STATUS, status) ? status : "idle";
}

function setStatus(nextStatus, source = "手動") {
  const status = normalizeStatus(nextStatus);
  const info = STATUS[status];
  petVisual.dataset.status = status;
  petVisual.setAttribute("aria-label", `${info.label}のひよこ`);
  petDescription.textContent = info.description;
  sourceLabel.textContent = source;
  statusOptions.forEach((option) => {
    const selected = option.dataset.status === status;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
  localStorage.setItem(storageKey, status);
  document.title = `${info.label}｜Codexひよこ`;
}

function applyUrlStatus() {
  const queryStatus = new URLSearchParams(location.search).get("status");
  const hashStatus = location.hash.replace(/^#/, "");
  const requested = queryStatus || hashStatus;
  if (requested && Object.hasOwn(STATUS, requested)) {
    setStatus(requested, "URL");
    return true;
  }
  return false;
}

function startDemo() {
  const order = ["working", "waiting", "done", "idle", "error"];
  let index = 0;
  demoButton.textContent = "デモ停止";
  demoButton.dataset.running = "true";
  setStatus(order[index], "デモ");
  demoTimer = window.setInterval(() => {
    index = (index + 1) % order.length;
    setStatus(order[index], "デモ");
  }, 1600);
}

function stopDemo() {
  if (demoTimer) window.clearInterval(demoTimer);
  demoTimer = null;
  demoButton.textContent = "デモ再生";
  delete demoButton.dataset.running;
}

statusOptions.forEach((option) => {
  option.addEventListener("click", () => {
    stopDemo();
    setStatus(option.dataset.status, "手動");
  });
});

demoButton.addEventListener("click", () => {
  if (demoTimer) stopDemo();
  else startDemo();
});

document.querySelector("#settings-button").addEventListener("click", () => settingsDialog.showModal());
document.querySelector("#close-button").addEventListener("click", () => {
  const windowElement = document.querySelector(".pet-window");
  const closeButton = document.querySelector("#close-button");
  const minimized = windowElement.classList.toggle("is-minimized");
  closeButton.textContent = minimized ? "+" : "×";
  closeButton.setAttribute("aria-label", minimized ? "ひよこを展開" : "ひよこを最小化");
});

reducedMotionToggle.addEventListener("change", () => {
  document.documentElement.classList.toggle("reduce-motion", reducedMotionToggle.checked);
});

window.addEventListener("message", (event) => {
  if (event.data?.type !== "codex-status") return;
  const status = event.data.status;
  if (!Object.hasOwn(STATUS, status)) return;
  stopDemo();
  setStatus(status, "外部連携");
});

const savedStatus = localStorage.getItem(storageKey);
if (!applyUrlStatus()) setStatus(savedStatus || "working", savedStatus ? "保存済み" : "手動");
