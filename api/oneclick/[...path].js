// Server-side proxy for the NEAR Intents 1Click API.
// Keeps the JWT (ONECLICK_JWT) out of the browser and only forwards the four documented endpoints.
const BASE = "https://1click.chaindefuser.com/v0/";
const ALLOWED = { tokens: "GET", quote: "POST", "deposit/submit": "POST", status: "GET" };

export default async function handler(req, res) {
  const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const endpoint = parts.join("/");
  if (!(endpoint in ALLOWED)) return res.status(404).json({ message: "Unknown endpoint" });
  if (req.method !== ALLOWED[endpoint]) return res.status(405).json({ message: "Method not allowed" });

  const url = new URL(BASE + endpoint);
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== "path") url.searchParams.set(key, Array.isArray(value) ? value[0] : value);
  }
  const headers = { Accept: "application/json" };
  if (process.env.ONECLICK_JWT) headers.Authorization = `Bearer ${process.env.ONECLICK_JWT}`;
  const init = { method: req.method, headers };
  if (req.method === "POST") {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(req.body ?? {});
  }
  try {
    const upstream = await fetch(url, init);
    const text = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "application/json");
    if (endpoint === "tokens") res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.send(text || "{}");
  } catch {
    return res.status(502).json({ message: "Could not reach the NEAR Intents service." });
  }
}
