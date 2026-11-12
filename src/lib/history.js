// Recent swaps, kept only in this browser (localStorage). Nothing is sent to a server.
const KEY = "routeform:swap-history";
const MAX = 30;

export function loadHistory() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch { /* storage unavailable */ } }

export function addSwap(entry) {
  const list = loadHistory().filter((e) => e.depositAddress !== entry.depositAddress);
  list.unshift({ createdAt: Date.now(), status: "PENDING_DEPOSIT", ...entry });
  save(list);
  return list;
}
export function updateSwap(depositAddress, patch) {
  const list = loadHistory().map((e) => (e.depositAddress === depositAddress ? { ...e, ...patch } : e));
  save(list);
  return list;
}
export function clearHistory(address) {
  save(loadHistory().filter((e) => address && e.wallet !== address));
}
