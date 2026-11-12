import { useId, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { ChainIcon, TokenIcon } from "./NetIcon.jsx";
import { matchesAll, searchTerms } from "../lib/search.js";

const ASSETS = ["USDC", "USDT", "ETH", "NEAR"];
const CHAINS = ["Arbitrum", "Optimism", "Ethereum", "NEAR", "Base"];
const ALL = ASSETS.flatMap((asset) => CHAINS.map((chain) => ({ asset, chain, text: `${asset} on ${chain}` })));
const STARTERS = ["USDC on Arbitrum", "USDT on Ethereum", "ETH on Base", "NEAR on NEAR", "USDC on Optimism"].map((t) => ALL.find((o) => o.text === t));

/** Outcome text box with suggestions: typing "usdc on" lists USDC on every network, "arb" lists every asset on Arbitrum. */
export default function OutcomeInput({ value, onChange, id = "outcome", describedBy }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef(null);

  const options = useMemo(() => {
    const terms = searchTerms(value);
    const base = terms.length ? ALL.filter((o) => matchesAll(terms, `${o.asset} ${o.chain}`.toLowerCase())) : STARTERS;
    // "usdc on" (trailing filler) should still surface every USDC route; hide an exact match of what is already typed.
    return base.filter((o) => o.text.toLowerCase() !== value.trim().toLowerCase()).slice(0, 6);
  }, [value]);

  const show = open && options.length > 0;
  const choose = (option) => { onChange(option.text); setOpen(false); setActive(-1); };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % Math.max(options.length, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setActive((a) => (a <= 0 ? options.length - 1 : a - 1)); }
    else if (e.key === "Enter" && show && active >= 0) { e.preventDefault(); choose(options[active]); }
    else if (e.key === "Escape" && show) { e.stopPropagation(); setOpen(false); setActive(-1); }
  };

  return <div className="outcome-input">
    <input id={id} value={value} role="combobox" aria-expanded={show} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
      aria-describedby={describedBy} placeholder="e.g. USDC on Arbitrum" autoComplete="off" spellCheck="false"
      onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
      onFocus={() => { window.clearTimeout(blurTimer.current); setOpen(true); }}
      onBlur={() => { blurTimer.current = window.setTimeout(() => setOpen(false), 120); }}
      onKeyDown={onKeyDown}/>
    <span className="input-arrow"><ArrowUpRight size={16} aria-hidden="true"/></span>
    {show && <ul className="outcome-suggest" id={listId} role="listbox" aria-label="Suggested outcomes">
      {options.map((o, i) => <li key={o.text} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={i === active ? "on" : ""} onMouseDown={(e) => { e.preventDefault(); choose(o); }} onMouseEnter={() => setActive(i)}>
        <span className="os-icon" aria-hidden="true"><span className="os-token"><TokenIcon symbol={o.asset}/></span><span className="os-chain"><ChainIcon name={o.chain}/></span></span>
        <span className="os-text"><b>{o.asset}</b> on {o.chain}</span>
      </li>)}
    </ul>}
  </div>;
}
