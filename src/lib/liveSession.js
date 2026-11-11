const KEY = "routeform:live-wallet";
/** Remember which wallet was connected in this tab: { kind: "evm" | "near", id, name }. */
export function saveLiveSession(wallet) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ kind: wallet.kind || "evm", id: wallet.id, name: wallet.name })); } catch { /* ignore */ }
}
export function loadLiveSession() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { return null; }
}
export function clearLiveSession() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}
