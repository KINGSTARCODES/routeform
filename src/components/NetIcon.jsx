import { CHAIN_ICONS, TOKEN_ICONS } from "../lib/icons.js";

function Mark({ src, fallback }) {
  if (!src) return <>{fallback}</>;
  return <img className="net-icon" src={src} alt="" aria-hidden="true" draggable="false" />;
}

/** Official token mark (USDC, USDT, ETH, NEAR). Falls back to the first letter for unknown symbols. */
export function TokenIcon({ symbol }) {
  const key = String(symbol || "").toUpperCase();
  return <Mark src={TOKEN_ICONS[key]} fallback={key.slice(0, 1) || "?"} />;
}

/** Official network mark (Arbitrum, Optimism, Base, Ethereum, NEAR). */
export function ChainIcon({ name }) {
  const label = String(name || "");
  const key = Object.keys(CHAIN_ICONS).find((chain) => chain.toLowerCase() === label.toLowerCase());
  return <Mark src={key ? CHAIN_ICONS[key] : null} fallback={label.slice(0, 1).toUpperCase() || "?"} />;
}
