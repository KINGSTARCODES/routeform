import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleNotch, ShieldWarning, Wallet, Warning } from "@phosphor-icons/react";
import { BrandMark } from "./ProductFlow.jsx";
import TokenPicker from "./TokenPicker.jsx";
import { chainLabel } from "../lib/chains.js";
import WalletModal from "./WalletModal.jsx";
import { getStatus, getTokens, requestQuote, submitDeposit, TERMINAL_STATUSES } from "../lib/oneclick.js";
import { EVM_CHAINS, connect, discoverWallets, formatUnits, getBalance, isEvmAddress, parseUnits, sendDeposit, shortAddress, switchChain } from "../lib/evm.js";
import { getNearBalance, nearExplorerTx, restoreNear, sendNearDeposit, signOutNear } from "../lib/near.js";
import { clearLiveSession, loadLiveSession, saveLiveSession } from "../lib/liveSession.js";

const chainName = (id) => chainLabel(id);
const label = (t) => `${t.symbol} · ${chainName(t.blockchain)}`;
const short = (a) => (a.startsWith("0x") ? shortAddress(a) : a.length > 22 ? `${a.slice(0, 10)}…${a.slice(-8)}` : a);
const STATUS_COPY = {
  PENDING_DEPOSIT: "Waiting for your deposit to be detected…",
  KNOWN_DEPOSIT_TX: "Deposit seen, confirming…",
  PROCESSING: "Swapping across networks…",
  INCOMPLETE_DEPOSIT: "Deposit was smaller than quoted. It will be refunded if not completed.",
  SUCCESS: "Complete. Funds were delivered.",
  REFUNDED: "The swap could not complete and your funds were refunded.",
  FAILED: "The swap failed. Check your wallet and the explorer.",
};

export default function LivePage() {
  const [wallet, setWallet] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [tokenError, setTokenError] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [balance, setBalance] = useState(null);
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [tx, setTx] = useState(null); // { hash, depositAddress, status }
  const pollRef = useRef(null);

  const from = tokens.find((t) => t.assetId === fromId);
  const to = tokens.find((t) => t.assetId === toId);
  const kind = wallet?.kind || "evm";
  const sourceTokens = useMemo(() => tokens.filter((t) => (kind === "near" ? t.blockchain === "near" : EVM_CHAINS[t.blockchain])), [tokens, kind]);
  const raw = from ? parseUnits(amount, from.decimals) : null;
  const validAmount = raw !== null && raw > 0n;
  const destIsEvm = to && EVM_CHAINS[to.blockchain];
  const ownsDestination = to && wallet && ((kind === "near" && to.blockchain === "near") || (kind === "evm" && destIsEvm));
  const recipientOk = destIsEvm ? isEvmAddress(recipient) : recipient.trim().length > 2;

  // Restore a wallet connected earlier in this tab, otherwise ask to connect.
  useEffect(() => {
    const saved = loadLiveSession();
    if (!saved) { setModalOpen(true); return undefined; }
    if (saved.kind === "near") {
      restoreNear(saved.id).then((w) => (w ? setWallet({ ...w, name: saved.name }) : setModalOpen(true))).catch(() => setModalOpen(true));
      return undefined;
    }
    return discoverWallets(async (list) => {
      const match = list.find((w) => w.id === saved.id);
      if (!match) return;
      try {
        const accounts = await match.provider.request({ method: "eth_accounts" });
        if (accounts?.length) setWallet({ ...match, kind: "evm", address: accounts[0] });
        else setModalOpen(true);
      } catch { setModalOpen(true); }
    });
  }, []);

  useEffect(() => {
    getTokens().then((list) => {
      setTokens(list);
    }).catch((e) => setTokenError(e.message));
    return () => window.clearInterval(pollRef.current);
  }, []);

  // Pick sensible defaults whenever the token list or the connected wallet type changes.
  useEffect(() => {
    if (!tokens.length) return;
    if (!sourceTokens.some((t) => t.assetId === fromId)) {
      const pick = kind === "near" ? sourceTokens.find((t) => t.symbol === "USDC") || sourceTokens[0] : sourceTokens.find((t) => t.symbol === "USDC" && t.blockchain === "arb") || sourceTokens[0];
      setFromId(pick?.assetId || "");
    }
    if (!tokens.some((t) => t.assetId === toId)) {
      const dest = kind === "near" ? tokens.find((t) => t.symbol === "USDC" && t.blockchain === "arb") : tokens.find((t) => t.symbol === "NEAR");
      setToId((dest || tokens[1] || tokens[0]).assetId);
    }
  }, [tokens, sourceTokens, kind, fromId, toId]);

  useEffect(() => {
    if (ownsDestination && !recipient) setRecipient(wallet.address);
  }, [ownsDestination, wallet, recipient]);

  useEffect(() => {
    setBalance(null);
    if (!wallet || !from) return;
    let live = true;
    (async () => {
      try {
        let value;
        if (kind === "near") value = await getNearBalance(wallet.address, from);
        else {
          await switchChain(wallet.provider, EVM_CHAINS[from.blockchain]).catch(() => {});
          value = await getBalance(wallet.provider, wallet.address, from);
        }
        if (live) setBalance(value);
      } catch { /* balance is optional */ }
    })();
    return () => { live = false; };
  }, [wallet, from, kind]);

  const invalidate = () => { setQuote(null); setError(""); };
  const onConnected = useCallback((w) => { saveLiveSession(w); setWallet(w); setModalOpen(false); }, []);
  const disconnect = () => { if (wallet?.kind === "near") signOutNear(wallet.wallet); clearLiveSession(); setWallet(null); setFromId(""); setQuote(null); setModalOpen(true); };

  const preview = async () => {
    setBusy("quote"); setError(""); setQuote(null);
    try {
      const refundTo = wallet.address;
      const res = await requestQuote({ dry: true, originAsset: from.assetId, destinationAsset: to.assetId, amount: raw.toString(), recipient: recipient.trim(), refundTo });
      setQuote(res.quote);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  };

  const confirm = async () => {
    setError("");
    if (balance !== null && balance < raw) { setError("Your balance is lower than the amount you entered."); return; }
    try {
      setBusy("sign");
      const res = await requestQuote({ dry: false, originAsset: from.assetId, destinationAsset: to.assetId, amount: raw.toString(), recipient: recipient.trim(), refundTo: wallet.address });
      const q = res.quote;
      if (!q?.depositAddress) throw new Error("The service did not return a deposit address. Nothing was sent.");
      const sendAmount = BigInt(q.amountIn || raw);
      let hash;
      if (kind === "near") {
        hash = await sendNearDeposit(wallet.wallet, { depositAddress: q.depositAddress, token: from, amount: sendAmount });
      } else {
        await switchChain(wallet.provider, EVM_CHAINS[from.blockchain]);
        hash = await sendDeposit(wallet.provider, { from: wallet.address, to: q.depositAddress, token: from, amount: sendAmount });
      }
      setTx({ hash, depositAddress: q.depositAddress, status: "PENDING_DEPOSIT" });
      submitDeposit(hash, q.depositAddress).catch(() => {}); // optional speed-up; polling continues regardless
      window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(async () => {
        try {
          const s = await getStatus(q.depositAddress);
          setTx((prev) => prev && { ...prev, status: s.status });
          if (TERMINAL_STATUSES.includes(s.status)) window.clearInterval(pollRef.current);
        } catch { /* keep polling */ }
      }, 5000);
    } catch (e) {
      setError(e?.code === 4001 ? "You rejected the transaction in your wallet. Nothing was sent." : (e?.message || "Something went wrong. Nothing was sent."));
    } finally { setBusy(""); }
  };

  const txUrl = (hash) => (kind === "near" ? nearExplorerTx(hash) : `${EVM_CHAINS[from?.blockchain]?.explorer}/tx/${hash}`);
  const reset = () => { setTx(null); setQuote(null); setAmount(""); };

  return <div className="product-shell live-shell">
    <div className="live-banner" role="note"><ShieldWarning size={15} aria-hidden="true"/> Live · real funds. Transactions are final once sent.</div>
    <header className="site-header"><div className="nav-wrap"><BrandMark/><nav className="nav-links product-nav" aria-label="Main navigation"><a href="/">Home</a><a href="/product">Demo</a>
      {wallet ? <button type="button" className="live-account" onClick={disconnect} title="Disconnect"><i aria-hidden="true"/> {wallet.name} · {short(wallet.address)}</button> : <button type="button" className="nav-live" onClick={() => setModalOpen(true)}><Wallet size={15} aria-hidden="true"/> Connect</button>}</nav></div></header>
    <main className="product-main use-main live-main">
      <a className="product-back" href="/"><ArrowLeft size={14} aria-hidden="true"/> Back to Routeform</a>
      <h1>Swap for real.<br/><span>Across networks.</span></h1>
      <p className="live-lead">Quotes and routes come from NEAR Intents. You approve every transaction in your wallet.</p>
      {tokenError && <p className="product-error" role="alert">Could not load assets: {tokenError}</p>}
      <section className="swap-panel live-panel" aria-label="Live swap form">
        <div className="swap-input-card"><div className="swap-input-row"><label htmlFor="live-amount">You send</label><span>{balance !== null && from ? `Balance · ${formatUnits(balance, from.decimals)} ${from.symbol}` : " "}</span></div>
          <div className="swap-edit-row"><input id="live-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => { setAmount(e.target.value); invalidate(); }}/>
            <TokenPicker label="You send" tokens={sourceTokens} value={fromId} onChange={(id) => { setFromId(id); invalidate(); }}/></div></div>
        <div className="swap-input-card swap-destination"><div className="swap-input-row"><span>You receive</span><span>{quote ? `$${Number(quote.amountOutUsd || 0).toFixed(2)}` : " "}</span></div>
          <div className="swap-edit-row"><strong className="swap-estimate">{quote ? quote.amountOutFormatted : "—"}</strong>
            <TokenPicker label="You receive" tokens={tokens} value={toId} onChange={(id) => { setToId(id); setRecipient(""); invalidate(); }}/></div></div>
        <label className="live-field" htmlFor="live-recipient"><span>Recipient address on {to ? chainName(to.blockchain) : "destination"}</span>
          <input id="live-recipient" value={recipient} placeholder={destIsEvm ? "0x…" : to?.blockchain === "near" ? "account.near" : "Destination address"} onChange={(e) => { setRecipient(e.target.value); invalidate(); }} spellCheck="false" autoComplete="off"/></label>
        {!recipientOk && recipient && <p className="product-footnote" role="alert">Enter a valid address for this network. Funds sent to a wrong address cannot be recovered.</p>}
        {quote && <dl className="live-quote" aria-label="Quote details">
          <div><dt>You send</dt><dd>{quote.amountInFormatted} {from.symbol}</dd></div>
          <div><dt>You receive (min)</dt><dd>{formatUnits(quote.minAmountOut, to.decimals)} {to.symbol}</dd></div>
          <div><dt>Estimated time</dt><dd>~{quote.timeEstimate ?? "—"} sec</dd></div>
          <div><dt>Refund address</dt><dd>{short(wallet.address)}</dd></div>
          <div><dt>Recipient</dt><dd>{short(recipient)}</dd></div>
        </dl>}
        {error && <p className="product-error" role="alert"><Warning size={14} aria-hidden="true"/> {error}</p>}
        {!tx && !quote && <button type="button" className="button button-primary product-review-button" disabled={!wallet || !validAmount || !recipientOk || !!busy || from?.assetId === to?.assetId} onClick={preview}>{busy === "quote" ? <><CircleNotch className="spin" size={16} aria-hidden="true"/> Getting quote…</> : <>Get live quote <ArrowRight size={16} aria-hidden="true"/></>}</button>}
        {!tx && quote && <><p className="live-risk"><ShieldWarning size={15} aria-hidden="true"/> This sends real funds. Review the recipient above. If the swap cannot complete, funds are refunded to your connected address.</p>
          <button type="button" className="button button-primary product-review-button" disabled={!!busy} onClick={confirm}>{busy === "sign" ? <><CircleNotch className="spin" size={16} aria-hidden="true"/> Confirm in your wallet…</> : <>Confirm and send <ArrowRight size={16} aria-hidden="true"/></>}</button></>}
        {!wallet && <p className="product-footnote">Connect a wallet to continue.</p>}
      </section>
      {tx && <div className="demo-result live-result" role="status"><span>{TERMINAL_STATUSES.includes(tx.status) ? <Check size={16} aria-hidden="true"/> : <CircleNotch className="spin" size={16} aria-hidden="true"/>}</span><div><b>{STATUS_COPY[tx.status] || tx.status}</b>
        <small>Transaction {short(tx.hash)}{tx.hash && <> · <a href={txUrl(tx.hash)} target="_blank" rel="noreferrer">View on explorer</a></>}</small>
        {TERMINAL_STATUSES.includes(tx.status) && <button type="button" className="live-again" onClick={reset}>Start another swap</button>}</div></div>}
    </main>
  </div>;
}
