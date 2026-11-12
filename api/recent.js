// Public "Recent swaps" feed shared by every visitor.
// - GET returns the latest swaps (no write access, nothing to clear).
// - POST adds a swap, but only after the deposit address is confirmed to exist at the 1Click service.
// There is deliberately no delete/clear endpoint. Storage: Upstash Redis (UPSTASH_REDIS_REST_URL / _TOKEN).
const BASE = "https://1click.chaindefuser.com/v0/status";
const KEY = "routeform:recent-swaps";
const MAX = 50;
const TERMINAL = ["SUCCESS", "REFUNDED", "FAILED"];

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(cmd) {
  const r = await fetch(redisUrl(), { method: "POST", headers: { Authorization: `Bearer ${redisToken()}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error("store");
  return (await r.json()).result;
}
const read = async () => { try { return JSON.parse((await redis(["GET", KEY])) || "[]"); } catch { return []; } };
const write = (list) => redis(["SET", KEY, JSON.stringify(list.slice(0, MAX))]);

async function lookup(depositAddress) {
  const headers = { Accept: "application/json" };
  if (process.env.ONECLICK_JWT) headers.Authorization = `Bearer ${process.env.ONECLICK_JWT}`;
  const r = await fetch(`${BASE}?depositAddress=${encodeURIComponent(depositAddress)}`, { headers });
  if (!r.ok) return null;
  return r.json();
}
const clean = (v, n = 24) => String(v ?? "").replace(/[^\w.\-~ ]/g, "").slice(0, n);
const maskWallet = (a = "") => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
const publicItem = (e) => ({ id: e.depositAddress, fromSymbol: e.fromSymbol, toSymbol: e.toSymbol, amountIn: e.amountIn, amountOut: e.amountOut, status: e.status, createdAt: e.createdAt, wallet: e.wallet });

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!redisUrl() || !redisToken()) return res.status(200).json({ configured: false, items: [] });

  if (req.method === "GET") {
    const list = await read();
    // Refresh a few unfinished swaps so the feed shows real results without anyone having the page open.
    const open = list.filter((e) => !TERMINAL.includes(e.status)).slice(0, 5);
    let changed = false;
    await Promise.all(open.map(async (e) => {
      try {
        const s = await lookup(e.depositAddress);
        if (s?.status && s.status !== e.status) { e.status = s.status; changed = true; }
      } catch { /* keep old status */ }
    }));
    if (changed) { try { await write(list); } catch { /* ignore */ } }
    return res.status(200).json({ configured: true, items: list.slice(0, 20).map(publicItem) });
  }

  if (req.method === "POST") {
    const b = req.body || {};
    const depositAddress = String(b.depositAddress || "").slice(0, 200);
    if (!depositAddress) return res.status(400).json({ message: "Missing deposit address" });
    let s;
    try { s = await lookup(depositAddress); } catch { s = null; }
    if (!s?.status) return res.status(400).json({ message: "Unknown deposit address" });
    const list = await read();
    if (list.some((e) => e.depositAddress === depositAddress)) return res.status(200).json({ ok: true });
    const d = s.swapDetails || {};
    list.unshift({
      depositAddress, status: s.status, createdAt: Date.now(),
      fromSymbol: clean(b.fromSymbol, 12), toSymbol: clean(b.toSymbol, 12),
      amountIn: clean(d.amountInFormatted ?? b.amountIn), amountOut: clean(d.amountOutFormatted ?? b.amountOut),
      wallet: maskWallet(String(b.wallet || "")),
    });
    await write(list);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ message: "Method not allowed" });
}
