// Reads the connected wallet's balances for the listed assets, in the background. Failures are silent: balances are optional.
import { EVM_CHAINS, encodeBalanceOf } from "./evm.js";
import { getNearBalance } from "./near.js";

const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));
const toBig = (hex) => (typeof hex === "string" && /^0x[0-9a-fA-F]+$/.test(hex) ? BigInt(hex) : 0n);

async function evmChain(address, tokens, rpc, signal, done) {
  for (const group of chunk(tokens, 20)) {
    const body = group.map((t, i) => (t.contractAddress
      ? { jsonrpc: "2.0", id: i, method: "eth_call", params: [{ to: t.contractAddress, data: encodeBalanceOf(address) }, "latest"] }
      : { jsonrpc: "2.0", id: i, method: "eth_getBalance", params: [address, "latest"] }));
    try {
      const res = await fetch(rpc, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
      const json = await res.json();
      const rows = Array.isArray(json) ? json : [json];
      const found = new Map();
      rows.forEach((r) => { if (r && typeof r.id === "number" && group[r.id]) found.set(group[r.id].assetId, toBig(r.result)); });
      done(found);
    } catch { /* skip this batch */ }
  }
}

async function nearTokens(account, tokens, signal, done) {
  const queue = [...tokens];
  const worker = async () => {
    while (queue.length && !signal.aborted) {
      const t = queue.shift();
      try { done(new Map([[t.assetId, await getNearBalance(account, t)]])); } catch { /* skip */ }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
}

/** Calls onUpdate(Map<assetId, bigint>) as results arrive. Abort with the signal to stop early. */
export async function fetchBalances({ kind, address, tokens, signal, onUpdate }) {
  const all = new Map();
  const push = (found) => { found.forEach((v, k) => all.set(k, v)); onUpdate(new Map(all)); };
  if (kind === "near") return nearTokens(address, tokens.filter((t) => t.blockchain === "near"), signal, push);
  const byChain = {};
  tokens.forEach((t) => { if (EVM_CHAINS[t.blockchain]) (byChain[t.blockchain] ||= []).push(t); });
  await Promise.all(Object.entries(byChain).map(([id, list]) => evmChain(address, list, EVM_CHAINS[id].rpc, signal, push)));
}
