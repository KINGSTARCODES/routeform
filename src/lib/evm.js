// Minimal EVM helpers: EIP-6963 wallet discovery and EIP-1193 requests. No dependencies.

/** 1Click blockchain id -> EVM chain. Only these chains can be used as the *source* in Live mode. */
export const EVM_CHAINS = {
  eth: { id: 1, name: "Ethereum", currency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpc: "https://ethereum-rpc.publicnode.com", explorer: "https://etherscan.io" },
  arb: { id: 42161, name: "Arbitrum One", currency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpc: "https://arb1.arbitrum.io/rpc", explorer: "https://arbiscan.io" },
  base: { id: 8453, name: "Base", currency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpc: "https://mainnet.base.org", explorer: "https://basescan.org" },
  op: { id: 10, name: "OP Mainnet", currency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpc: "https://mainnet.optimism.io", explorer: "https://optimistic.etherscan.io" },
  pol: { id: 137, name: "Polygon", currency: { name: "POL", symbol: "POL", decimals: 18 }, rpc: "https://polygon-rpc.com", explorer: "https://polygonscan.com" },
  bsc: { id: 56, name: "BNB Smart Chain", currency: { name: "BNB", symbol: "BNB", decimals: 18 }, rpc: "https://bsc-dataseed.binance.org", explorer: "https://bscscan.com" },
  avax: { id: 43114, name: "Avalanche C-Chain", currency: { name: "AVAX", symbol: "AVAX", decimals: 18 }, rpc: "https://api.avax.network/ext/bc/C/rpc", explorer: "https://snowtrace.io" },
};

export const isEvmAddress = (value) => /^0x[0-9a-fA-F]{40}$/.test(value || "");

/** Discover installed wallets via EIP-6963, falling back to window.ethereum. Returns a stop() function. */
export function discoverWallets(onChange) {
  const found = new Map();
  const emit = () => onChange(Array.from(found.values()));
  const onAnnounce = (event) => {
    const { info, provider } = event.detail || {};
    if (!info?.uuid || !provider) return;
    found.set(info.uuid, { id: info.uuid, name: info.name, icon: info.icon, provider });
    emit();
  };
  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  const timer = window.setTimeout(() => {
    if (found.size === 0 && window.ethereum) {
      found.set("injected", { id: "injected", name: window.ethereum.isMetaMask ? "MetaMask" : "Browser wallet", icon: "", provider: window.ethereum });
    }
    emit();
  }, 400);
  return () => { window.removeEventListener("eip6963:announceProvider", onAnnounce); window.clearTimeout(timer); };
}

export async function connect(provider) {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!accounts?.length) throw new Error("The wallet did not share an account.");
  const chainId = parseInt(await provider.request({ method: "eth_chainId" }), 16);
  return { address: accounts[0], chainId };
}

export async function switchChain(provider, chain) {
  const hexId = "0x" + chain.id.toString(16);
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (error) {
    if (error?.code === 4902 || error?.data?.originalError?.code === 4902) {
      await provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: hexId, chainName: chain.name, nativeCurrency: chain.currency, rpcUrls: [chain.rpc], blockExplorerUrls: [chain.explorer] }] });
    } else {
      throw error;
    }
  }
}

/** "1.5", 6 -> 1500000n. Returns null when the text is not a valid non-negative decimal for that precision. */
export function parseUnits(text, decimals) {
  const value = String(text).trim();
  if (!/^\d*\.?\d*$/.test(value) || value === "" || value === ".") return null;
  const [whole = "0", fraction = ""] = value.split(".");
  if (fraction.length > decimals) return null;
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0");
}

export function formatUnits(raw, decimals, maxFraction = 6) {
  const value = BigInt(raw);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(decimals, "0").slice(0, maxFraction).replace(/0+$/, "");
  return fraction ? `${whole.toLocaleString("en-US")}.${fraction}` : whole.toLocaleString("en-US");
}

export const toHex = (value) => "0x" + BigInt(value).toString(16);
const pad32 = (hex) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");

/** ERC-20 transfer(address,uint256) calldata. */
export const encodeTransfer = (to, amount) => "0xa9059cbb" + pad32(to) + pad32(toHex(amount));
/** ERC-20 balanceOf(address) calldata. */
export const encodeBalanceOf = (owner) => "0x70a08231" + pad32(owner);

export async function getBalance(provider, owner, token) {
  if (!token.contractAddress) return BigInt(await provider.request({ method: "eth_getBalance", params: [owner, "latest"] }));
  const result = await provider.request({ method: "eth_call", params: [{ to: token.contractAddress, data: encodeBalanceOf(owner) }, "latest"] });
  return BigInt(result && result !== "0x" ? result : "0x0");
}

/** Send native coin or ERC-20 to the 1Click deposit address. Resolves to the transaction hash. */
export function sendDeposit(provider, { from, to, token, amount }) {
  const tx = token.contractAddress
    ? { from, to: token.contractAddress, data: encodeTransfer(to, amount), value: "0x0" }
    : { from, to, value: toHex(amount) };
  return provider.request({ method: "eth_sendTransaction", params: [tx] });
}

export const shortAddress = (address) => `${address.slice(0, 6)}…${address.slice(-4)}`;

/** Best-effort: ask the wallet to forget this site so the next connect shows its prompt again. */
export async function disconnectEvm(provider) {
  try { await provider.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }); } catch { /* not supported by every wallet */ }
}
