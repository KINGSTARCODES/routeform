import { useEffect, useState } from "react";
import { CHAIN_ICONS, TOKEN_ICONS } from "../lib/icons.js";

// Wrapped / bridged variants share the icon of the asset they represent.
const TOKEN_ALIAS = { weth: "ETH", wbtc: "BTC", cbbtc: "BTC", tbtc: "BTC", usdt0: "USDT", wnear: "NEAR", usdce: "USDC", usdbc: "USDC", usdte: "USDT", wsol: "SOL", wbnb: "BNB", wpol: "MATIC", pol: "MATIC", wavax: "AVAX", dai: "DAI", steth: "ETH", wsteth: "ETH", weeth: "ETH", reth: "ETH" };
const cleanSymbol = (symbol) => String(symbol || "").replace(/\(.*?\)/g, "").trim();

const slug = (text) => String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
// Network label -> file in /icons/networks. Anything else falls back to its kebab-case name.
const CHAIN_FILES = { ethereum: "ethereum", arbitrum: "arbitrum-one", base: "base", optimism: "optimism", polygon: "polygon", "bnb chain": "binance-smart-chain", avalanche: "avalanche", near: "near-protocol", solana: "solana", bitcoin: "bitcoin", ton: "ton", tron: "tron", sui: "sui", aptos: "aptos", "xrp ledger": "xrp", litecoin: "litecoin", stellar: "stellar", cardano: "cardano", berachain: "berachain", gnosis: "gnosis", starknet: "starknet" };

/** Tries each source in order (bundled mark, then the local pack); shows the fallback text when none loads. */
function Mark({ sources, fallback }) {
  const list = sources.filter(Boolean);
  const [index, setIndex] = useState(0);
  const key = list.join("|");
  useEffect(() => setIndex(0), [key]);
  const url = list[index];
  if (!url) return <>{fallback}</>;
  return <img className="net-icon" src={url} alt="" aria-hidden="true" draggable="false" loading="lazy" onError={() => setIndex((i) => i + 1)} />;
}

/** Token mark: bundled official icon first (USDC, USDT, ETH, NEAR), then the local pack, then the first letter. */
export function TokenIcon({ symbol }) {
  const key = cleanSymbol(symbol).toUpperCase();
  const own = slug(key);
  const target = (TOKEN_ALIAS[own] || own).toLowerCase();
  const sources = [TOKEN_ICONS[key] || TOKEN_ICONS[TOKEN_ALIAS[own]], own && `/icons/tokens/${own}.svg`, target && target !== own && `/icons/tokens/${target}.svg`];
  return <Mark sources={sources} fallback={key.slice(0, 1) || "?"} />;
}

/** Network mark: bundled official icon first (Arbitrum, Optimism, Base, Ethereum, NEAR), then the local pack, then the first letter. */
export function ChainIcon({ name }) {
  const label = String(name || "");
  const lower = label.toLowerCase();
  const bundledKey = Object.keys(CHAIN_ICONS).find((chain) => chain.toLowerCase() === lower);
  const file = CHAIN_FILES[lower] || lower.trim().replace(/[^a-z0-9]+/g, "-");
  const sources = [bundledKey && CHAIN_ICONS[bundledKey], file && `/icons/networks/${file}.svg`];
  return <Mark sources={sources} fallback={label.slice(0, 1).toUpperCase() || "?"} />;
}

const STACK_DEFAULT = ["Ethereum", "Arbitrum", "Base", "Optimism", "NEAR", "Polygon"];

// Overlapping network marks, used wherever the UI means "many networks".
export function ChainStack({ names = STACK_DEFAULT, max = 4, size = 18 }) {
  const shown = names.slice(0, max);
  return <span className="chain-stack" style={{ "--cs": `${size}px` }} aria-hidden="true">
    {shown.map((name) => <span className="chain-stack-item" key={name}><ChainIcon name={name} /></span>)}
  </span>;
}
