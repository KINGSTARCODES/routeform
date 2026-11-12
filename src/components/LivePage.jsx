import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, CaretDown, CircleNotch, ShieldWarning, Warning } from "@phosphor-icons/react";
import Brand from "./Logo.jsx";
import TokenPicker from "./TokenPicker.jsx";
import WalletModal from "./WalletModal.jsx";
import { chainLabel } from "../lib/chains.js";
import { getStatus, getTokens, requestQuote, submitDeposit, TERMINAL_STATUSES } from "../lib/oneclick.js";
import { EVM_CHAINS, disconnectEvm, formatUnits, getBalance, isEvmAddress, parseUnits, sendDeposit, shortAddress, switchChain } from "../lib/evm.js";
import { getNearBalance, nearExplorerTx, restoreNear, sendNearDeposit, signOutNear } from "../lib/near.js";
import { discoverWallets } from "../lib/evm.js";
import { fetchBalances } from "../lib/balances.js";
import { clearLiveSession, loadLiveSession, saveLiveSession } from "../lib/liveSession.js";

const short = (a = "") => (a.startsWith("0x") ? shortAddress(a) : a.length > 22 ? `${a.slice(0, 10)}…${a.slice(-8)}` : a);
const plain = (raw, decimals) => formatUnits(raw, decimals, decimals).replace(/,/g, "");

// Route choices. NEAR Intents returns one route per quote request, so the choice is how much price movement to tolerate.
const ROUTE_CHOICES = [
  { id: "standard", name: "Standard", note: "Balanced price and reliability", slippage: 100, tag: "Recommended" },
  { id: "tight", name: "Tight price", note: "Lower slippage, may refund if the price moves", slippage: 50 },
  { id: "flexible", name: "Flexible", note: "More room for price moves, fewer refunds", slippage: 300 },
];

const STATUS_COPY = {
  PENDING_DEPOSIT: "Waiting for your deposit to be detected…",
  KNOWN_DEPOSIT_TX: "Deposit seen, confirming…",
  PROCESSING: "Swapping across networks…",
  INCOMPLETE_DEPOSIT: "Deposit was smaller than quoted. It will be refunded if not completed.",
  SUCCESS: "Complete. Funds were delivered.",
  REFUNDED: "The swap could not complete and your funds were refunded.",
  FAILED: "The swap failed. Check your wallet and the explorer.",
};

function WalletMenu({ wallet, balance, onConnect, onChange, onDisconnect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  if (!wallet) return <button type="button" className="nav-live" onClick={onConnect}>Connect wallet</button>;
  return <div className="lv-menu" ref={ref}>
    <button type="button" className="live-account" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}><i aria-hidden="true"/> <span className="lv-wname">{wallet.name} · </span>{short(wallet.address)} <CaretDown size={13} aria-hidden="true"/></button>
    {open && <div className="lv-menu-pop" role="menu">
      <div className="lv-menu-info"><small>Available balance</small><b>{balance ? balance.amount : "Loading…"}</b>{balance?.network && <small>{balance.network}</small>}</div>
      <button type="button" role="menuitem" onClick={() => { setOpen(false); onChange(); }}>Change wallet</button>
      <button type="button" role="menuitem" className="danger" onClick={() => { setOpen(false); onDisconnect(); }}>Disconnect wallet</button>
    </div>}
  </div>;
}

export default function LivePage() {
  const [wallet, setWallet] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [tokenError, setTokenError] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [useOther, setUseOther] = useState(false);
  const [other, setOther] = useState("");
  const [balance, setBalance] = useState(null);
  const [routeId, setRouteId] = useState("standard");
  const [quotes, setQuotes] = useState({}); // id -> { quote } | { error }
  const [quoting, setQuoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tx, setTx] = useState(null); // { hash, status }
  const [holdings, setHoldings] = useState(new Map());
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const pollRef = useRef(null);
  const holdingsRun = useRef({ key: "", ctl: null });
  const seq = useRef(0);

  const kind = wallet?.kind || "evm";
  const from = tokens.find((t) => t.assetId === fromId);
  const to = tokens.find((t) => t.assetId === toId);
  const sourceTokens = useMemo(() => tokens.filter((t) => (kind === "near" ? t.blockchain === "near" : EVM_CHAINS[t.blockchain])), [tokens, kind]);
  const raw = from ? parseUnits(amount, from.decimals) : null;
  const validAmount = raw !== null && raw > 0n;
  const destIsEvm = !!(to && EVM_CHAINS[to.blockchain]);
  const ownsDestination = !!(to && wallet && ((kind === "near" && to.blockchain === "near") || (kind === "evm" && destIsEvm)));
  const customMode = useOther || (!!wallet && !ownsDestination);
  const recipient = customMode ? other.trim() : wallet?.address || "";
  const recipientOk = destIsEvm ? isEvmAddress(recipient) : recipient.length > 2;
  const insufficient = balance !== null && raw !== null && raw > balance;
  const chosen = quotes[routeId]?.quote;
  const toChain = to ? chainLabel(to.blockchain) : "";

  // Restore a wallet connected earlier in this tab; otherwise ask to connect.
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
    getTokens().then(setTokens).catch((e) => setTokenError(e.message));
    return () => window.clearInterval(pollRef.current);
  }, []);

  // Sensible defaults whenever the token list or the connected wallet type changes.
  useEffect(() => {
    if (!tokens.length) return;
    if (!sourceTokens.some((t) => t.assetId === fromId)) {
      const pick = kind === "near" ? sourceTokens.find((t) => t.symbol === "USDC") || sourceTokens[0] : sourceTokens.find((t) => t.symbol === "USDC" && t.blockchain === "arb") || sourceTokens[0];
      setFromId(pick?.assetId || "");
    }
    if (!tokens.some((t) => t.assetId === toId)) {
      const dest = kind === "near" ? tokens.find((t) => t.symbol === "USDC" && t.blockchain === "arb") : tokens.find((t) => t.symbol === "USDC" && t.blockchain === "eth") || tokens.find((t) => t.symbol === "NEAR");
      setToId((dest || tokens[1] || tokens[0]).assetId);
    }
  }, [tokens, sourceTokens, kind, fromId, toId]);

  // Balance of the asset being sold.
  useEffect(() => {
    setBalance(null);
    if (!wallet || !from) return undefined;
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

  // Live preview: one free (dry) quote per route choice, refreshed as the form changes.
  useEffect(() => {
    setQuotes({}); setError("");
    if (!wallet || !from || !to || !validAmount || !recipientOk || from.assetId === to.assetId) { setQuoting(false); return undefined; }
    const mine = ++seq.current;
    setQuoting(true);
    const timer = window.setTimeout(async () => {
      const results = await Promise.all(ROUTE_CHOICES.map(async (r) => {
        try {
          const res = await requestQuote({ dry: true, originAsset: from.assetId, destinationAsset: to.assetId, amount: raw.toString(), recipient, refundTo: wallet.address, slippageBps: r.slippage });
          return [r.id, { quote: res.quote }];
        } catch (e) { return [r.id, { error: e.message }]; }
      }));
      if (seq.current !== mine) return;
      setQuotes(Object.fromEntries(results));
      setQuoting(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [wallet, from, to, amount, recipient, recipientOk, validAmount, raw]);

  // Balances for every listed asset on the wallet's networks, loaded once the asset picker is opened.
  const loadHoldings = useCallback(() => {
    if (!wallet || !tokens.length) return;
    const key = `${wallet.kind}:${wallet.address}`;
    if (holdingsRun.current.key === key) return;
    holdingsRun.current.ctl?.abort();
    const ctl = new AbortController();
    holdingsRun.current = { key, ctl };
    setHoldings(new Map()); setHoldingsLoading(true);
    fetchBalances({ kind: wallet.kind, address: wallet.address, tokens, signal: ctl.signal, onUpdate: setHoldings }).finally(() => setHoldingsLoading(false));
  }, [wallet, tokens]);
  useEffect(() => { holdingsRun.current.ctl?.abort(); holdingsRun.current = { key: "", ctl: null }; setHoldings(new Map()); }, [wallet]);

  const onConnected = useCallback((w) => { saveLiveSession(w); setWallet(w); setModalOpen(false); }, []);
  const disconnect = async () => {
    if (wallet?.kind === "near") await signOutNear(wallet.wallet); else if (wallet?.provider) await disconnectEvm(wallet.provider);
    clearLiveSession(); setWallet(null); setFromId(""); setBalance(null); setUseOther(false); setOther("");
  };

  const setPercent = (pct) => {
    if (balance === null || !from) return;
    let value = pct === 100 ? balance : (balance * BigInt(pct)) / 100n;
    if (pct === 100 && !from.contractAddress && kind === "evm") { const reserve = 10n ** BigInt(from.decimals) / 1000n; value = value > reserve ? value - reserve : 0n; }
    setAmount(value > 0n ? plain(value, from.decimals) : "");
  };

  const flip = () => {
    if (!to || !sourceTokens.some((t) => t.assetId === to.assetId)) return;
    setFromId(to.assetId); setToId(from.assetId); setAmount(""); setUseOther(false); setOther("");
  };

  const confirm = async () => {
    setError("");
    if (!chosen) return;
    const route = ROUTE_CHOICES.find((r) => r.id === routeId);
    try {
      setBusy(true);
      const res = await requestQuote({ dry: false, originAsset: from.assetId, destinationAsset: to.assetId, amount: raw.toString(), recipient, refundTo: wallet.address, slippageBps: route.slippage });
      const q = res.quote;
      if (!q?.depositAddress) throw new Error("The service did not return a deposit address. Nothing was sent.");
      const sendAmount = BigInt(q.amountIn || raw);
      let hash;
      if (kind === "near") hash = await sendNearDeposit(wallet.wallet, { depositAddress: q.depositAddress, token: from, amount: sendAmount });
      else {
        await switchChain(wallet.provider, EVM_CHAINS[from.blockchain]);
        hash = await sendDeposit(wallet.provider, { from: wallet.address, to: q.depositAddress, token: from, amount: sendAmount });
      }
      setTx({ hash, status: "PENDING_DEPOSIT" });
      submitDeposit(hash, q.depositAddress).catch(() => {});
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
    } finally { setBusy(false); }
  };

  const txUrl = (hash) => (kind === "near" ? nearExplorerTx(hash) : `${EVM_CHAINS[from?.blockchain]?.explorer}/tx/${hash}`);
  const reset = () => { setTx(null); setAmount(""); };
  const done = tx && TERMINAL_STATUSES.includes(tx.status);

  let cta;
  if (!wallet) cta = { label: "Connect wallet", onClick: () => setModalOpen(true) };
  else if (!validAmount) cta = { label: "Enter an amount", disabled: true };
  else if (insufficient) cta = { label: "Insufficient balance", disabled: true };
  else if (!recipientOk) cta = { label: "Enter a valid recipient", disabled: true };
  else if (from?.assetId === to?.assetId) cta = { label: "Choose two different assets", disabled: true };
  else if (quoting) cta = { label: "Getting quotes…", disabled: true, spin: true };
  else if (!chosen) cta = { label: "No quote available", disabled: true };
  else cta = { label: busy ? "Confirm in your wallet…" : "Confirm and send", onClick: confirm, disabled: busy, spin: busy, go: true };

  return <div className="product-shell live-shell">
    <div className="live-banner" role="note"><ShieldWarning size={15} aria-hidden="true"/> Live · real funds. Transactions are final once sent.</div>
    <header className="site-header"><div className="nav-wrap"><Brand href="/"/><div className="lv-nav"><a href="/" className="lv-link-nav">Home</a><a href="/product" className="lv-link-nav">Demo</a>
      <WalletMenu wallet={wallet} balance={balance !== null && from ? { amount: `${formatUnits(balance, from.decimals)} ${from.symbol}`, network: `on ${chainLabel(from.blockchain)}` } : null} onConnect={() => setModalOpen(true)} onChange={() => setModalOpen(true)} onDisconnect={disconnect}/></div></div></header>

    <main className="lv-main">
      <div className="lv-head">
        <span className="lv-badge"><i aria-hidden="true"/> Live</span>
        <h1>Swap across networks</h1>
        <p>Real quotes from NEAR Intents. You approve every transaction in your wallet.</p>
      </div>
      {tokenError && <p className="product-error" role="alert">Could not load assets: {tokenError}</p>}

      <section className="lv-card" aria-label="Sell">
        <div className="lv-row"><label htmlFor="lv-amount">Sell</label><span className="lv-muted">{balance !== null && from ? `Balance: ${formatUnits(balance, from.decimals)} ${from.symbol}` : " "}</span></div>
        <div className="lv-amount-row">
          <input id="lv-amount" inputMode="decimal" placeholder="0" value={amount} autoComplete="off" onChange={(e) => setAmount(e.target.value)}/>
          <TokenPicker label="Sell" tokens={sourceTokens} value={fromId} onChange={setFromId} balances={holdings} balancesLoading={holdingsLoading} onOpen={loadHoldings}/>
        </div>
        <div className="lv-pcts" role="group" aria-label="Fill from balance">{[[20, "20%"], [50, "50%"], [100, "MAX"]].map(([n, t]) => <button type="button" key={n} onClick={() => setPercent(n)} disabled={balance === null}>{t}</button>)}</div>
      </section>

      <button type="button" className="lv-flip" aria-label="Switch sell and buy assets" onClick={flip}><ArrowDown size={16} aria-hidden="true"/></button>

      <section className="lv-card lv-buy" aria-label="Buy">
        <div className="lv-row"><span>Buy</span><span className="lv-muted">{chosen?.amountOutUsd ? `≈ $${Number(chosen.amountOutUsd).toFixed(2)}` : " "}</span></div>
        <div className="lv-amount-row">
          <strong className={`lv-out${chosen ? "" : " empty"}`} aria-live="polite">{chosen ? chosen.amountOutFormatted : quoting ? "…" : "0"}</strong>
          <TokenPicker label="Buy" tokens={tokens} value={toId} onChange={(id) => { setToId(id); setOther(""); }} balances={holdings} balancesLoading={holdingsLoading} onOpen={loadHoldings}/>
        </div>
      </section>

      <section className="lv-card lv-recipient" aria-label="Recipient">
        <div className="lv-row"><span>Recipient</span>{wallet && ownsDestination && (useOther
          ? <button type="button" className="lv-link" onClick={() => setUseOther(false)}>Use my wallet</button>
          : <button type="button" className="lv-link" onClick={() => setUseOther(true)}>Send to another address</button>)}</div>
        {customMode
          ? <><input className="lv-addr" value={other} onChange={(e) => setOther(e.target.value)} placeholder={destIsEvm ? "0x…" : to?.blockchain === "near" ? "account.near" : `${toChain || "Destination"} address`} spellCheck="false" autoComplete="off" aria-label={`Recipient address on ${toChain}`}/>
            {!ownsDestination && wallet && <p className="lv-hint">Your connected wallet can’t receive on {toChain}. Enter an address on that network.</p>}
            {other && !recipientOk && <p className="lv-hint warn" role="alert">That doesn’t look like a valid {toChain} address. Funds sent to a wrong address can’t be recovered.</p>}</>
          : <div className="lv-self"><span className="lv-self-dot" aria-hidden="true"/><span><b>Your wallet</b><small>{wallet ? `${short(wallet.address)} on ${toChain}` : `Connect a wallet to receive on ${toChain || "the destination"}`}</small></span></div>}
      </section>

      {(quoting || Object.keys(quotes).length > 0) && <section className="lv-card lv-routes" aria-label="Pick a route">
        <div className="lv-row"><span>Pick a route</span><span className="lv-muted">via NEAR Intents</span></div>
        <div className="lv-route-list" role="radiogroup" aria-label="Route">
          {ROUTE_CHOICES.map((r) => {
            const q = quotes[r.id];
            return <button type="button" role="radio" aria-checked={routeId === r.id} key={r.id} className={`lv-route${routeId === r.id ? " on" : ""}`} onClick={() => setRouteId(r.id)} disabled={!!q?.error}>
              <span className="lv-radio" aria-hidden="true"/>
              <span className="lv-route-copy"><b>{r.name}{r.tag && <em>{r.tag}</em>}</b><small>{q?.error ? "Not available for this pair" : r.note}</small></span>
              <span className="lv-route-num">{q?.quote ? <><b>{q.quote.amountOutFormatted}</b><small>Min {formatUnits(q.quote.minAmountOut, to.decimals)}</small><small>~{q.quote.timeEstimate ?? "—"} sec</small></> : quoting ? <small>Quoting…</small> : <small>—</small>}</span>
            </button>;
          })}
        </div>
        {chosen && <dl className="lv-facts"><div><dt>Max slippage</dt><dd>{ROUTE_CHOICES.find((r) => r.id === routeId).slippage / 100}%</dd></div><div><dt>Refund address</dt><dd>{short(wallet.address)}</dd></div><div><dt>Recipient</dt><dd>{short(recipient)}</dd></div></dl>}
      </section>}

      {error && <p className="product-error" role="alert"><Warning size={14} aria-hidden="true"/> {error}</p>}
      {chosen && !tx && <p className="live-risk"><ShieldWarning size={15} aria-hidden="true"/> This sends real funds. Check the recipient above. If the swap can’t complete, funds are refunded to your connected address.</p>}
      {!tx && <button type="button" className="button button-primary lv-cta" disabled={cta.disabled} onClick={cta.onClick}>{cta.spin && <CircleNotch className="spin" size={16} aria-hidden="true"/>} {cta.label} {cta.go && <ArrowRight size={16} aria-hidden="true"/>}</button>}

      {tx && <div className="demo-result live-result" role="status"><span>{done ? <Check size={16} aria-hidden="true"/> : <CircleNotch className="spin" size={16} aria-hidden="true"/>}</span><div><b>{STATUS_COPY[tx.status] || tx.status}</b>
        <small>Transaction {short(tx.hash)}{tx.hash && <> · <a href={txUrl(tx.hash)} target="_blank" rel="noreferrer">View on explorer</a></>}</small>
        {done && <button type="button" className="live-again" onClick={reset}>Start another swap</button>}</div></div>}
    </main>
    <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} onConnected={onConnected}/>
  </div>;
}
