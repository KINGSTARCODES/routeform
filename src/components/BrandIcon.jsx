import usdcUrl from "../assets/icons/usdc.svg";
import usdtUrl from "../assets/icons/usdt.svg";
import ethUrl from "../assets/icons/eth.svg";
import ethereumUrl from "../assets/icons/ethereum.svg";
import arbitrumUrl from "../assets/icons/arbitrum.svg";
import optimismUrl from "../assets/icons/optimism.svg";
import baseUrl from "../assets/icons/base.svg";
import metamaskUrl from "../assets/icons/metamask.svg";
import okxUrl from "../assets/icons/okx.svg";
import coinbaseUrl from "../assets/icons/coinbase.svg";
import walletconnectUrl from "../assets/icons/walletconnect.svg";

const ICONS = {
  usdc: usdcUrl,
  usdt: usdtUrl,
  eth: ethUrl,
  ethereum: ethereumUrl,
  arbitrum: arbitrumUrl,
  optimism: optimismUrl,
  base: baseUrl,
  metamask: metamaskUrl,
  okx: okxUrl,
  coinbase: coinbaseUrl,
  walletconnect: walletconnectUrl,
};

export default function BrandIcon({ icon, size = 24 }) {
  const src = ICONS[icon];
  if (!src) return null;
  return <img src={src} width={size} height={size} style={{ display: "block", width: size, height: size, borderRadius: size * 0.22, objectFit: "contain" }} alt="" aria-hidden="true" />;
}
