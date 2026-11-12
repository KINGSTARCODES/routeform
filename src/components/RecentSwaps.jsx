import { useEffect, useState } from "react";
import { ArrowRight, ArrowSquareOut, CircleNotch } from "@phosphor-icons/react";

const LABEL = {
  PENDING_DEPOSIT: ["Waiting for deposit", "wait"],
  KNOWN_DEPOSIT_TX: ["Confirming", "wait"],
  PROCESSING: ["Swapping", "wait"],
  INCOMPLETE_DEPOSIT: ["Deposit too small", "bad"],
  SUCCESS: ["Delivered", "ok"],
  REFUNDED: ["Refunded", "bad"],
  FAILED: ["Failed", "bad"],
};
const ago = (t) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(t).toLocaleDateString();
};

// Public feed of recent Routeform swaps. Read-only: nobody can edit or clear it from the site.
export default function RecentSwaps({ refreshKey }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch("/api/recent");
        const j = await r.json();
        if (!stop) setItems(j.configured === false ? [] : j.items || []);
      } catch { if (!stop) setItems((v) => v ?? []); }
    };
    load();
    const id = window.setInterval(load, 20000);
    return () => { stop = true; window.clearInterval(id); };
  }, [refreshKey]);

  if (!items || items.length === 0) return null;
  return <section className="lv-recent" aria-label="Recent swaps">
    <div className="lv-recent-head"><h2>Recent swaps</h2><span className="lv-recent-live">Public</span></div>
    <ul>{items.slice(0, 10).map((e) => {
      const [text, tone] = LABEL[e.status] || [e.status, "wait"];
      return <li key={e.id}>
        <div className="lv-recent-main"><b>{e.amountIn} {e.fromSymbol} <ArrowRight size={12} aria-hidden="true"/> {e.amountOut ? `~${e.amountOut} ` : ""}{e.toSymbol}</b><small>{e.wallet && <>{e.wallet} · </>}{ago(e.createdAt)} · <a href={`https://explorer.near-intents.org/transactions/${encodeURIComponent(e.id)}`} target="_blank" rel="noreferrer">Details <ArrowSquareOut size={11} aria-hidden="true"/></a></small></div>
        <span className={`lv-chip ${tone}`}>{tone === "wait" && <CircleNotch className="spin" size={11} aria-hidden="true"/>}{text}</span>
      </li>;
    })}</ul>
    <p className="lv-recent-note">Swaps made through Routeform, visible to everyone. Wallets are shortened. Nothing here can be cleared.</p>
  </section>;
}
