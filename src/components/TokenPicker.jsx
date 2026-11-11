import { useEffect, useMemo, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import Tray from "./Tray.jsx";
import { ChainIcon, TokenIcon } from "./NetIcon.jsx";
import { chainLabel } from "../lib/chains.js";

const POPULAR = ["USDC", "USDT", "ETH", "NEAR", "BTC", "WBTC", "SOL", "BNB"];
const MAX_ROWS = 120;
const isDeprecated = (t) => /deprecated/i.test(t.symbol);

export function TokenAvatar({ token }) {
  return <span className="tp-avatar" aria-hidden="true"><span className="tp-main"><TokenIcon symbol={token.symbol}/></span><span className="tp-chain"><ChainIcon name={chainLabel(token.blockchain)}/></span></span>;
}

/** Tap-to-open asset picker: search, network filter, popular section, scrollable list. */
export default function TokenPicker({ tokens, value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState("all");
  const selected = tokens.find((t) => t.assetId === value);

  useEffect(() => { if (open) { setQuery(""); setChain("all"); } }, [open]);

  const chains = useMemo(() => {
    const counts = new Map();
    tokens.forEach((t) => counts.set(t.blockchain, (counts.get(t.blockchain) || 0) + 1));
    return Array.from(counts.keys()).sort((a, b) => counts.get(b) - counts.get(a));
  }, [tokens]);

  const { popular, rest, total } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tokens
      .filter((t) => !isDeprecated(t) || t.assetId === value)
      .filter((t) => chain === "all" || t.blockchain === chain)
      .filter((t) => !q || t.symbol.toLowerCase().includes(q) || chainLabel(t.blockchain).toLowerCase().includes(q) || (t.contractAddress || "").toLowerCase() === q);
    const byName = [...list].sort((a, b) => a.symbol.localeCompare(b.symbol) || a.blockchain.localeCompare(b.blockchain));
    if (q) return { popular: [], rest: byName, total: byName.length };
    const pop = POPULAR.flatMap((s) => byName.filter((t) => t.symbol === s));
    const popIds = new Set(pop.map((t) => t.assetId));
    return { popular: pop, rest: byName.filter((t) => !popIds.has(t.assetId)), total: byName.length };
  }, [tokens, query, chain, value]);

  const pick = (token) => { onChange(token.assetId); setOpen(false); };
  const row = (token) => <li key={token.assetId}><button type="button" className={`tp-row${token.assetId === value ? " selected" : ""}`} onClick={() => pick(token)}>
    <TokenAvatar token={token}/>
    <span className="tp-info"><b>{token.symbol}</b><small>{chainLabel(token.blockchain)}</small></span>
  </button></li>;
  const shown = rest.slice(0, Math.max(0, MAX_ROWS - popular.length));

  return <>
    <button type="button" className="tp-trigger" aria-label={`${label}: ${selected ? `${selected.symbol} on ${chainLabel(selected.blockchain)}` : "choose an asset"}`} onClick={() => setOpen(true)} disabled={!tokens.length}>
      {selected ? <><TokenAvatar token={selected}/><span className="tp-info"><b>{selected.symbol}</b><small>{chainLabel(selected.blockchain)}</small></span></> : <span className="tp-info"><b>Select</b></span>}
      <CaretDown size={14} aria-hidden="true"/>
    </button>
    <Tray open={open} title={label} onClose={() => setOpen(false)} className="tray-tall">
      <div className="tp-sheet">
        <label className="tp-search"><MagnifyingGlass size={18} aria-hidden="true"/><input type="search" placeholder="Search a token or network" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck="false" aria-label="Search assets"/></label>
        <div className="tp-chips" role="group" aria-label="Filter by network">
          <button type="button" className={chain === "all" ? "on" : ""} onClick={() => setChain("all")}>All</button>
          {chains.map((id) => <button type="button" key={id} className={chain === id ? "on" : ""} onClick={() => setChain(id)}><span className="tp-chip-icon" aria-hidden="true"><ChainIcon name={chainLabel(id)}/></span>{chainLabel(id)}</button>)}
        </div>
        <div className="tp-scroll">
          {popular.length > 0 && <><p className="tp-heading">Popular</p><ul className="tp-list">{popular.map(row)}</ul></>}
          {shown.length > 0 && <><p className="tp-heading">{query || chain !== "all" ? `${total} result${total === 1 ? "" : "s"}` : "All assets"}</p><ul className="tp-list">{shown.map(row)}</ul></>}
          {total > MAX_ROWS && <p className="tp-more">Showing the first {MAX_ROWS}. Search or pick a network to narrow down.</p>}
          {total === 0 && <p className="tp-empty">No assets match “{query}”.</p>}
        </div>
      </div>
    </Tray>
  </>;
}
