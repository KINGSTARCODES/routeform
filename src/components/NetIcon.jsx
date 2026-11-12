import { CHAIN_ICONS, TOKEN_ICONS } from "../lib/icons.js";

// Wrapped / bridged variants share the icon of the asset they represent.
const TOKEN_ALIAS = { weth: "ETH", wbtc: "BTC", cbbtc: "BTC", tbtc: "BTC", usdt0: "USDT", wnear: "NEAR", usdce: "USDC", usdbc: "USDC", usdte: "USDT", wsol: "SOL", wbnb: "BNB", wpol: "MATIC", pol: "MATIC", wavax: "AVAX", dai: "DAI", steth: "ETH", wsteth: "ETH", weeth: "ETH", reth: "ETH" };
const cleanSymbol = (symbol) => String(symbol || "").replace(/\(.*?\)/g, "").trim();

function Mark({ src, fallback }) {
  if (!src) return <>{fallback}</>;
  return <img className="net-icon" src={src} alt="" aria-hidden="true" draggable="false" />;
}

/** Official token mark (USDC, USDT, ETH, NEAR). Falls back to the first letter for unknown symbols. */
export function TokenIcon({ symbol }) {
  const key = cleanSymbol(symbol).toUpperCase();
  const slug = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return <Mark src={TOKEN_ICONS[key] || TOKEN_ICONS[TOKEN_ALIAS[slug]]} fallback={key.slice(0, 1) || "?"} />;
}

/** Official network mark (Arbitrum, Optimism, Base, Ethereum, NEAR). */
export function ChainIcon({ name }) {
  const label = String(name || "");
  const key = Object.keys(CHAIN_ICONS).find((chain) => chain.toLowerCase() === label.toLowerCase());
  return <Mark src={key ? CHAIN_ICONS[key] : null} fallback={label.slice(0, 1).toUpperCase() || "?"} />;
}

const STACK_DEFAULT = ["Ethereum", "Arbitrum", "Base", "Optimism", "NEAR", "Polygon"];

// Overlapping network marks, used wherever the UI means "many networks".
export function ChainStack({ names = STACK_DEFAULT, max = 4, size = 18 }) {
  const shown = names.slice(0, max);
  return <span className="chain-stack" style={{ "--cs": `${size}px` }} aria-hidden="true">
    {shown.map((name) => <span className="chain-stack-item" key={name}><ChainIcon name={name} /></span>)}
  </span>;
}
