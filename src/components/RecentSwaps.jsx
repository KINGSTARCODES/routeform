import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowSquareOut, CircleNotch, ClockCounterClockwise } from "@phosphor-icons/react";

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

// Public feed of recent Routeform swaps, opened from the Live page bar. Read-only: nobody can edit or clear it from the site.
export default function RecentSwaps({ refreshKey }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch("/api/recent");
        const j = await r.json();
        if (!stop) setItems(j.configured === false ? false : j.items || []);
      } catch { if (!stop) setItems((v) => v ?? []); }
    };
    load();
    const id = window.setInterval(load, 20000);
    return () => { stop = true; window.clearInterval(id); };
  }, [refreshKey]);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const list = Array.isArray(items) ? items.slice(0, 10) : [];
  return <div className="lv-recent-wrap" ref={ref}>
    <button type="button" className="lv-recent-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>
      <ClockCounterClockwise size={16} aria-hidden="true"/><span className="lv-recent-label">Recent swaps</span>
    </button>
    {open && <div className="lv-recent" role="dialog" aria-label="Recent swaps">
      <div className="lv-recent-head"><h2>Recent swaps</h2><span className="lv-recent-live">Public</span></div>
      {items === null ? <p className="lv-recent-note">Loading…</p>
        : items === false ? <p className="lv-recent-note">The public feed isn’t switched on yet.</p>
        : list.length === 0 ? <p className="lv-recent-note">No swaps yet. The first one will show up here.</p>
        : <ul>{list.map((e) => {
          const [text, tone] = LABEL[e.status] || [e.status, "wait"];
          return <li key={e.id}>
            <div className="lv-recent-main"><b>{e.amountIn} {e.fromSymbol} <ArrowRight size={12} aria-hidden="true"/> {e.amountOut ? `~${e.amountOut} ` : ""}{e.toSymbol}</b><small>{e.wallet && <>{e.wallet} · </>}{ago(e.createdAt)} · <a href={`https://explorer.near-intents.org/transactions/${encodeURIComponent(e.id)}`} target="_blank" rel="noreferrer">Details <ArrowSquareOut size={11} aria-hidden="true"/></a></small></div>
            <span className={`lv-chip ${tone}`}>{tone === "wait" && <CircleNotch className="spin" size={11} aria-hidden="true"/>}{text}</span>
          </li>;
        })}</ul>}
      <p className="lv-recent-note">Swaps made through Routeform, visible to everyone. Wallets are shortened. Nothing here can be cleared.</p>
    </div>}
  </div>;
}
