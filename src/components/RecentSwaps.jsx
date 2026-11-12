import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowSquareOut, CircleNotch } from "@phosphor-icons/react";
import { getStatus, TERMINAL_STATUSES } from "../lib/oneclick.js";
import { clearHistory, loadHistory, updateSwap } from "../lib/history.js";

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

// Lists this wallet's recent swaps and re-checks any that are not finished, so a swap you left mid-way still shows its real result.
export default function RecentSwaps({ wallet, refreshKey }) {
  const [items, setItems] = useState(() => loadHistory());
  const [, tick] = useState(0);
  const busy = useRef(false);
  const mine = items.filter((e) => e.wallet === wallet);

  useEffect(() => { setItems(loadHistory()); }, [refreshKey, wallet]);

  useEffect(() => {
    if (!wallet) return undefined;
    let stop = false;
    const refresh = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        for (const e of loadHistory().filter((x) => x.wallet === wallet && !TERMINAL_STATUSES.includes(x.status))) {
          try {
            const s = await getStatus(e.depositAddress);
            if (s?.status && s.status !== e.status && !stop) setItems(updateSwap(e.depositAddress, { status: s.status }));
          } catch { /* try again next round */ }
        }
      } finally { busy.current = false; }
      if (!stop) tick((n) => n + 1);
    };
    refresh();
    const id = window.setInterval(refresh, 15000);
    return () => { stop = true; window.clearInterval(id); };
  }, [wallet, refreshKey]);

  if (!wallet || mine.length === 0) return null;
  return <section className="lv-recent" aria-label="Recent swaps">
    <div className="lv-recent-head"><h2>Recent swaps</h2><button type="button" onClick={() => { clearHistory(wallet); setItems(loadHistory()); }}>Clear</button></div>
    <ul>{mine.slice(0, 8).map((e) => {
      const [text, tone] = LABEL[e.status] || [e.status, "wait"];
      return <li key={e.depositAddress}>
        <div className="lv-recent-main"><b>{e.amountIn} {e.fromSymbol} <ArrowRight size={12} aria-hidden="true"/> {e.amountOut ? `~${e.amountOut} ` : ""}{e.toSymbol}</b><small>{ago(e.createdAt)}{e.explorerUrl && <> · <a href={e.explorerUrl} target="_blank" rel="noreferrer">Deposit tx <ArrowSquareOut size={11} aria-hidden="true"/></a></>}</small></div>
        <span className={`lv-chip ${tone}`}>{tone === "wait" && <CircleNotch className="spin" size={11} aria-hidden="true"/>}{text}</span>
      </li>;
    })}</ul>
    <p className="lv-recent-note">Saved in this browser only. Delivered means the funds reached the recipient address.</p>
  </section>;
}
