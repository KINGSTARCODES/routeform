// Demo data only. Every number in this file is illustrative, not a live quote.
// One source of truth for the landing page and the product preview.
export const ROUTES = [
  { id: "intent", name: "NEAR Intents", path: "Outcome-first route", via: "NEAR", hops: ["Base", "NEAR", "Arbitrum"], eta: 120, fee: 1.24, receive: 0.9969, badge: "Suggested" },
  { id: "direct", name: "Direct path", path: "Single network hop", via: null, hops: ["Base", "Arbitrum"], eta: 45, fee: 2.8, receive: 0.9944, badge: "Fastest" },
  { id: "efficient", name: "Efficient path", path: "Optimized for fewer fees", via: "Optimism", hops: ["Base", "Optimism", "Arbitrum"], eta: 240, fee: 0.76, receive: 0.9976, badge: "Lowest fee" },
];

/** Hops for a route between two chosen networks, e.g. ["Arbitrum", "NEAR", "Ethereum"]. */
export function buildHops(origin, via, destination) {
  return [origin, via, destination].filter((hop, index, all) => hop && (index === 0 || hop !== all[index - 1]) && (index === 2 || hop !== destination));
}

// Illustrative USD prices used only to make demo conversions behave sensibly.
const DEMO_PRICE_USD = { USDC: 1, USDT: 1, ETH: 3000, NEAR: 3 };

/** Illustrative rate for one unit of `from` expressed in `to` (before route fees). */
export function demoRate(from, to) {
  const a = DEMO_PRICE_USD[from];
  const b = DEMO_PRICE_USD[to];
  if (!a || !b) return 1;
  return a / b;
}

/** "~45 sec", "~2 min" */
export function formatEta(seconds) {
  if (seconds < 60) return `~${seconds} sec`;
  const minutes = Math.round(seconds / 60);
  return `~${minutes} min`;
}

/** Readable amount: fewer decimals for big numbers, more for small ones. */
export function formatAmount(value) {
  if (!Number.isFinite(value) || value <= 0) return "0.00";
  const digits = value >= 100 ? 2 : value >= 1 ? 3 : 5;
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits });
}

export const STORAGE_KEY = "routeform:history";

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function saveHistory(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked: the app keeps working without history */
  }
}
