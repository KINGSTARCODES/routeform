// NEAR wallet support via @near-wallet-selector (loaded on demand so the demo and landing page stay light).
// UNTESTED against live wallets: verify module names/versions after `npm install`.
const RPC = "https://rpc.mainnet.near.org";
const GAS = "30000000000000"; // 30 Tgas
const STORAGE_DEPOSIT = "1250000000000000000000"; // 0.00125 NEAR; unused part is refunded by the token contract
const ONE_YOCTO = "1";

let selectorPromise;
export function getSelector() {
  if (!selectorPromise) {
    selectorPromise = (async () => {
      const [{ setupWalletSelector }, meteor, mynear, here, hot] = await Promise.all([
        import("@near-wallet-selector/core"),
        import("@near-wallet-selector/meteor-wallet"),
        import("@near-wallet-selector/my-near-wallet"),
        import("@near-wallet-selector/here-wallet"),
        import("@near-wallet-selector/hot-wallet"),
      ]);
      return setupWalletSelector({
        network: "mainnet",
        modules: [meteor.setupMeteorWallet(), hot.setupHotWallet(), here.setupHereWallet(), mynear.setupMyNearWallet()],
      });
    })();
    selectorPromise.catch(() => { selectorPromise = undefined; });
  }
  return selectorPromise;
}

/** Wallets the selector offers, shaped like the EVM list used by the popup. */
export async function listNearWallets() {
  const selector = await getSelector();
  return selector.store.getState().modules.map((m) => ({ id: m.id, name: m.metadata.name, icon: m.metadata.iconUrl || "", kind: "near" }));
}

export async function connectNear(id) {
  const selector = await getSelector();
  const wallet = await selector.wallet(id);
  const accounts = await wallet.signIn({ contractId: "wrap.near", methodNames: [], accounts: [] });
  const accountId = accounts?.[0]?.accountId || selector.store.getState().accounts[0]?.accountId;
  if (!accountId) throw new Error("The wallet did not share an account.");
  return { kind: "near", id, address: accountId, wallet };
}

export async function restoreNear(id) {
  const selector = await getSelector();
  const state = selector.store.getState();
  const accountId = state.accounts.find((a) => a.active)?.accountId || state.accounts[0]?.accountId;
  if (!accountId || state.selectedWalletId !== id) return null;
  return { kind: "near", id, address: accountId, wallet: await selector.wallet(id) };
}

export async function signOutNear(wallet) {
  try { await wallet.signOut(); } catch { /* already signed out */ }
}

async function rpc(params) {
  const response = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: "rf", method: "query", params }) });
  const body = await response.json();
  if (body.error || body.result?.error) throw new Error("NEAR RPC error");
  return body.result;
}

/** Balance in raw units: native NEAR (spendable approximation) or a NEP-141 token. */
export async function getNearBalance(accountId, token) {
  if (!token.contractAddress) {
    const r = await rpc({ request_type: "view_account", finality: "final", account_id: accountId });
    return BigInt(r.amount) - BigInt(r.locked || "0");
  }
  const args = btoa(JSON.stringify({ account_id: accountId }));
  const r = await rpc({ request_type: "call_function", finality: "final", account_id: token.contractAddress, method_name: "ft_balance_of", args_base64: args });
  return BigInt(JSON.parse(new TextDecoder().decode(new Uint8Array(r.result))));
}

const call = (methodName, args, deposit = "0") => ({ type: "FunctionCall", params: { methodName, args, gas: GAS, deposit } });

/**
 * Deposit a NEP-141 token (or wrapped NEAR) to the 1Click deposit address.
 * Batch: storage_deposit (register the address) -> [near_deposit if wrapping native NEAR] -> ft_transfer.
 */
export async function sendNearDeposit(nearWallet, { depositAddress, token, amount }) {
  const contract = token.contractAddress;
  if (!contract) throw new Error("This NEAR asset cannot be sent directly. Choose a token listed with a contract.");
  const wrapsNative = contract === "wrap.near" && token.symbol === "NEAR";
  const actions = [call("storage_deposit", { account_id: depositAddress, registration_only: true }, STORAGE_DEPOSIT)];
  if (wrapsNative) actions.push(call("near_deposit", {}, amount.toString()));
  actions.push(call("ft_transfer", { receiver_id: depositAddress, amount: amount.toString() }, ONE_YOCTO));
  const result = await nearWallet.signAndSendTransactions({ transactions: [{ receiverId: contract, actions }] });
  const outcome = Array.isArray(result) ? result[result.length - 1] : result;
  return outcome?.transaction?.hash || outcome?.transaction_outcome?.id || "";
}

export const nearExplorerTx = (hash) => `https://nearblocks.io/txns/${hash}`;
