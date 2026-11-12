import { useEffect, useMemo, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import Tray from "./Tray.jsx";
import { ChainIcon, ChainStack, TokenIcon } from "./NetIcon.jsx";
import { chainLabel } from "../lib/chains.js";
import { formatUnits } from "../lib/evm.js";
import { matchesAll, searchTerms } from "../lib/search.js";

const POPULAR = ["USDC", "USDT", "ETH", "NEAR", "BTC", "WBTC", "SOL", "BNB"];
const MAX_ROWS = 120;
const isDeprecated = (t) => /deprecated/i.test(t.symbol);
const held = (balances, t) => (balances?.get(t.assetId) ?? 0n) > 0n;
const worth = (balances, t) => Number(formatUnits(balances.get(t.assetId), t.decimals, 8).replace(/,/g, "")) * (t.price || 0);

// Prefer networks that have a bundled official mark so the stack always renders, then fill with the rest.
const STACK_FIRST = ["Ethereum", "Arbitrum", "Base", "Optimism", "NEAR"];
const stackNames = (ids) => { const labels = ids.map(chainLabel); return [...STACK_FIRST.filter((n) => labels.includes(n)), ...labels.filter((n) => !STACK_FIRST.includes(n))]; };

export function TokenAvatar({ token }) {
  return <span className="tp-avatar" aria-hidden="true"><span className="tp-main"><TokenIcon symbol={token.symbol}/></span><span className="tp-chain"><ChainIcon name={chainLabel(token.blockchain)}/></span></span>;
}

// Tap-to-open asset picker: your balances first, then popular and all assets. Multi-word search and a network filter.
export default function TokenPicker({ tokens, value, onChange, label, balances, balancesLoading, onOpen }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState("all");
  const selected = tokens.find((t) => t.assetId === value);

  useEffect(() => { if (open) { setQuery(""); setChain("all"); onOpen?.(); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const chains = useMemo(() => {
    const counts = new Map();
    tokens.forEach((t) => counts.set(t.blockchain, (counts.get(t.blockchain) || 0) + 1));
    return Array.from(counts.keys()).sort((a, b) => counts.get(b) - counts.get(a));
  }, [tokens]);

  const { mine, popular, rest, total } = useMemo(() => {
    const terms = searchTerms(query);
    const list = tokens
      .filter((t) => !isDeprecated(t) || t.assetId === value)
      .filter((t) => chain === "all" || t.blockchain === chain)
      .filter((t) => matchesAll(terms, `${t.symbol} ${chainLabel(t.blockchain)} ${t.blockchain} ${t.contractAddress || ""}`.toLowerCase()));
    const byName = [...list].sort((a, b) => a.symbol.localeCompare(b.symbol) || a.blockchain.localeCompare(b.blockchain));
    const heldList = byName.filter((t) => held(balances, t)).sort((a, b) => worth(balances, b) - worth(balances, a));
    const heldIds = new Set(heldList.map((t) => t.assetId));
    const others = byName.filter((t) => !heldIds.has(t.assetId));
    if (terms.length) return { mine: heldList, popular: [], rest: others, total: byName.length };
    const pop = POPULAR.flatMap((s) => others.filter((t) => t.symbol === s));
    const popIds = new Set(pop.map((t) => t.assetId));
    return { mine: heldList, popular: pop, rest: others.filter((t) => !popIds.has(t.assetId)), total: byName.length };
  }, [tokens, query, chain, value, balances]);

  const pick = (token) => { onChange(token.assetId); setOpen(false); };
  const row = (token) => {
    const bal = balances?.get(token.assetId);
    return <li key={token.assetId}><button type="button" className={`tp-row${token.assetId === value ? " selected" : ""}`} onClick={() => pick(token)}>
      <TokenAvatar token={token}/>
      <span className="tp-info"><b>{token.symbol}</b><small>{chainLabel(token.blockchain)}</small></span>
      {bal > 0n && <span className="tp-bal">{formatUnits(bal, token.decimals, 4)}</span>}
    </button></li>;
  };
  const shown = rest.slice(0, Math.max(0, MAX_ROWS - mine.length - popular.length));
  const searching = searchTerms(query).length > 0 || chain !== "all";

  return <>
    <button type="button" className="tp-trigger" aria-label={`${label}: ${selected ? `${selected.symbol} on ${chainLabel(selected.blockchain)}` : "choose an asset"}`} onClick={() => setOpen(true)} disabled={!tokens.length}>
      {selected ? <><TokenAvatar token={selected}/><span className="tp-info"><b>{selected.symbol}</b><small>{chainLabel(selected.blockchain)}</small></span></> : <span className="tp-info"><b>Select</b></span>}
      <CaretDown size={14} aria-hidden="true"/>
    </button>
    <Tray open={open} title={label} onClose={() => setOpen(false)} className="tray-tall">
      <div className="tp-sheet">
        <label className="tp-search"><MagnifyingGlass size={18} aria-hidden="true"/><input type="search" placeholder="Search, e.g. usdc arbitrum" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck="false" aria-label="Search assets"/></label>
        <div className="tp-chips" role="group" aria-label="Filter by network">
          <button type="button" className={`tp-all${chain === "all" ? " on" : ""}`} onClick={() => setChain("all")}><ChainStack names={stackNames(chains)} max={4} size={18}/>All networks</button>
          {chains.map((id) => <button type="button" key={id} className={chain === id ? "on" : ""} onClick={() => setChain(id)}><span className="tp-chip-icon" aria-hidden="true"><ChainIcon name={chainLabel(id)}/></span>{chainLabel(id)}</button>)}
        </div>
        <div className="tp-scroll">
          {balancesLoading && mine.length === 0 && <p className="tp-note" role="status">Checking your balances…</p>}
          {mine.length > 0 && <><p className="tp-heading">Your balances</p><ul className="tp-list">{mine.map(row)}</ul></>}
          {popular.length > 0 && <><p className="tp-heading">Popular</p><ul className="tp-list">{popular.map(row)}</ul></>}
          {shown.length > 0 && <><p className="tp-heading">{searching ? `${total} result${total === 1 ? "" : "s"}` : "All assets"}</p><ul className="tp-list">{shown.map(row)}</ul></>}
          {total > MAX_ROWS && <p className="tp-more">Showing the first {MAX_ROWS}. Search or pick a network to narrow down.</p>}
          {total === 0 && <p className="tp-empty">No assets match “{query}”.</p>}
        </div>
      </div>
    </Tray>
  </>;
}
