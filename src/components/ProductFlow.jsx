import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleNotch, Cube, ShieldCheck, Wallet } from "@phosphor-icons/react";
import { ROUTES, buildHops, demoRate, formatAmount, formatEta } from "../lib/routes.js";
import ConceptBanner from "./ConceptBanner.jsx";
import LogoMark, { RLogoMark } from "./LogoMark.jsx";
import BrandIcon from "./BrandIcon.jsx";
import LiveButton from "./LiveButton.jsx";

const tokens = [
  { symbol: "USDC", chain: "Arbitrum", mark: "$", color: "token-usdc", icon: "usdc" },
  { symbol: "ETH", chain: "Ethereum", mark: "Ξ", color: "token-eth", icon: "eth" },
  { symbol: "NEAR", chain: "NEAR", mark: "N", color: "token-near", logo: true },
  { symbol: "USDT", chain: "Optimism", mark: "₮", color: "token-usdt", icon: "usdt" },
];

function BrandMark() {
  return <a className="brand" href="/" aria-label="Routeform home"><span className="brand-mark logo-tint"><RLogoMark size={28}/></span><span>routeform</span></a>;
}

function TokenSelect({ value, onChange, label }) {
  return <label className="product-token-select"><span className="product-token-label">{label}</span><span className="product-token-control"><i className={`product-token-icon ${value.color}${value.logo ? " logo-tint" : ""}${value.icon ? " brand-icon-slot" : ""}`} aria-hidden="true">{value.logo ? <LogoMark size={22}/> : value.icon ? <BrandIcon icon={value.icon} size={24}/> : value.mark}</i><span className="product-token-name"><b>{value.symbol}</b><small>{value.chain}</small></span><select aria-label={label} value={value.symbol} onChange={(event) => onChange(tokens.find((token) => token.symbol === event.target.value))}>{tokens.map((token) => <option key={token.symbol} value={token.symbol}>{token.symbol} on {token.chain}</option>)}</select><span className="product-select-caret" aria-hidden="true">⌄</span></span></label>;
}

// Official wallet logos from the supplied icon set. Bitget has no asset in the archive, so its letter mark stays.
const walletChoices = [
  { id: "near", name: "NEAR Wallet", kind: "NEAR network", mark: "N", className: "near-mark", logo: true },
  { id: "bitget", name: "Bitget Wallet", kind: "EVM wallet", mark: "B", className: "bitget-mark" },
  { id: "okx", name: "OKX Wallet", kind: "EVM wallet", mark: "X", className: "okx-mark", icon: "okx" },
  { id: "metamask", name: "MetaMask", kind: "EVM wallet", mark: "M", className: "metamask-mark", icon: "metamask" },
  { id: "walletconnect", name: "WalletConnect", kind: "Multi-chain protocol", mark: "W", className: "walletconnect-mark", icon: "walletconnect" },
  { id: "coinbase", name: "Coinbase Wallet", kind: "EVM wallet", mark: "C", className: "coinbase-mark", icon: "coinbase" },
];

function WalletArtwork({ selected }) {
  const wallet = walletChoices.find((item) => item.id === selected) || walletChoices[0];
  return <div className="wallet-art" aria-hidden="true">
    <div className="wallet-art-grid"/>
    <div className="wallet-art-glow"/>
    <div className="wallet-art-orbit orbit-one"/><div className="wallet-art-orbit orbit-two"/>
    <div className="wallet-art-orb"><span className="logo-tint"><RLogoMark size={46}/></span><i/><i/><i/></div>
    <div className="wallet-card-stack">
      <div className="wallet-art-card card-back"><span className="art-card-chip"/><i/><i/></div>
      <div className="wallet-art-card card-mid"><span className="art-card-chip"/><i/><i/></div>
      <div className="wallet-art-card card-front"><span className={`art-wallet-mark ${wallet.className}${wallet.logo ? " logo-tint" : ""}${wallet.icon ? " brand-icon-slot" : ""}`}>{wallet.logo ? <LogoMark size={26}/> : wallet.icon ? <BrandIcon icon={wallet.icon} size={34}/> : wallet.mark}</span><span className="art-card-copy"><b>{wallet.name}</b><small>Selected wallet</small></span><span className="art-card-spark">✦</span></div>
    </div>
  </div>;
}

export function WalletConnectPage() {
  const [selected, setSelected] = useState("near");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const continueDemo = () => {
    setBusy(true);
    setError("");
    window.setTimeout(() => {
      try {
        const wallet = walletChoices.find((item) => item.id === selected) || walletChoices[0];
        sessionStorage.setItem("routeform:demo-wallet", JSON.stringify({ mode: "demo", walletName: wallet.name, connected: false }));
        window.location.assign("/product");
      } catch {
        setError("This browser is blocking session storage. Allow site storage and try again.");
        setBusy(false);
      }
    }, 350);
  };

  return <div className="product-shell wallet-connect-shell">
    <ConceptBanner/>
    <header className="site-header"><div className="nav-wrap"><BrandMark/><nav className="nav-links product-nav" aria-label="Main navigation"><a href="/">Home</a><a href="/product">Demo <ArrowUpRight size={14} aria-hidden="true"/></a></nav></div></header>
    <main className="product-main connect-main">
      <a className="product-back" href="/"><ArrowLeft size={14} aria-hidden="true"/> Back to Routeform</a>
      <section className="connect-card" aria-labelledby="connect-title">
        <div className="connect-copy">
          <h1 id="connect-title">Choose a<br/><span>wallet.</span></h1>
          <p className="connect-lead">Pick a wallet to continue to the demo. Live wallet connections aren't available yet.</p>
          <div className="wallet-options" role="group" aria-label="Wallet choices">
            {walletChoices.map((wallet) => <button key={wallet.id} type="button" className={`wallet-option${selected === wallet.id ? " selected" : ""}`} aria-pressed={selected === wallet.id} onClick={() => setSelected(wallet.id)}>
              <span className={`wallet-option-mark ${wallet.className}${wallet.logo ? " logo-tint" : ""}${wallet.icon ? " brand-icon-slot" : ""}`} aria-hidden="true">{wallet.logo ? <LogoMark size={22}/> : wallet.icon ? <BrandIcon icon={wallet.icon} size={26}/> : wallet.mark}</span><span className="wallet-option-copy"><b>{wallet.name}</b><small>{wallet.kind}</small></span><span className="wallet-radio" aria-hidden="true"/>
            </button>)}
          </div>
          <button className="button button-primary connect-submit" onClick={continueDemo} disabled={busy}>{busy ? <><CircleNotch className="spin" size={17} aria-hidden="true"/> Opening demo…</> : <><Wallet size={17} aria-hidden="true"/> Continue to demo <ArrowRight size={16} aria-hidden="true"/></>}</button>
          {error && <p className="product-error" role="alert">{error}</p>}
          <div className="connect-safety"><ShieldCheck size={16} aria-hidden="true"/><span><b>No wallet is connected</b><small>No permissions, signatures or assets involved.</small></span></div>
        </div>
        <WalletArtwork selected={selected}/>
      </section>
    </main>
  </div>;
}

export function UseProductPage() {
  const [wallet] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("routeform:demo-wallet") || "null"); } catch { return null; }
  });
  const [from, setFrom] = useState(tokens[0]);
  const [to, setTo] = useState(tokens[2]);
  const [amount, setAmount] = useState("250");
  const [route, setRoute] = useState(ROUTES[0].id);
  const [result, setResult] = useState(false);
  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const sameAsset = from.symbol === to.symbol;
  const selectedRoute = ROUTES.find((item) => item.id === route) || ROUTES[0];
  const rate = demoRate(from.symbol, to.symbol);
  const hops = buildHops(from.chain, selectedRoute.via, to.chain);
  const estimateValue = validAmount && !sameAsset ? numericAmount * rate * selectedRoute.receive : 0;
  const estimate = formatAmount(estimateValue);

  const flip = () => { setFrom(to); setTo(from); setResult(false); };

  return <div className="product-shell">
    <ConceptBanner/>
    <header className="site-header"><div className="nav-wrap"><BrandMark/><nav className="nav-links product-nav" aria-label="Main navigation"><a href="/">Home</a><LiveButton/><span className="product-wallet-state"><i aria-hidden="true"/> {wallet?.walletName ? `${wallet.walletName} (demo)` : "Demo session"}</span></nav></div></header>
    <main className="product-main use-main">
      <div className="product-heading"><div><a className="product-back" href="/"><ArrowLeft size={14} aria-hidden="true"/> Back to Routeform</a><h1>One intent.<br/><span>A clearer route.</span></h1><p>Choose what you have, where it should end up, and review a sample route.</p></div></div>
      <div className="demo-session-note"><ShieldCheck size={16} aria-hidden="true"/><span>{wallet?.walletName ? `${wallet.walletName} selected, not connected.` : "No wallet connected."} <a href="/connect">Change wallet <ArrowUpRight size={13} aria-hidden="true"/></a></span></div>
      <div className="use-product-grid">
        <section className="swap-panel" aria-label="Swap form">
          <div className="swap-panel-head"><div><h2>Set your outcome</h2></div><span className="product-step">Step 1 of 2</span></div>
          <div className="swap-input-card"><div className="swap-input-row"><label htmlFor="swap-amount">You send</label><span>Demo balance · 1,000 USDC</span></div><div className="swap-edit-row"><input id="swap-amount" inputMode="decimal" type="number" min="0" step="any" value={amount} onChange={(event) => { setAmount(event.target.value); setResult(false); }}/><TokenSelect value={from} onChange={(token) => { setFrom(token); setResult(false); }} label="Source asset"/></div><div className="swap-input-bottom"><span>&nbsp;</span><button type="button" onClick={() => { setAmount("1000"); setResult(false); }}>MAX</button></div></div>
          <button type="button" className="swap-flip" aria-label="Switch source and destination assets" onClick={flip}><ArrowDown size={16} aria-hidden="true"/></button>
          <div className="swap-input-card swap-destination"><div className="swap-input-row"><span id="receive-label">Estimated receive</span><span>Illustrative</span></div><div className="swap-edit-row"><strong className="swap-estimate" aria-labelledby="receive-label">{estimate}</strong><TokenSelect value={to} onChange={(token) => { setTo(token); setResult(false); }} label="Destination asset"/></div><div className="swap-input-bottom"><span>Not a live quote</span><span>After demo route fee</span></div></div>
          <div className="swap-rate-line"><span>Illustrative rate</span><span>{sameAsset ? "Choose two different assets" : `1 ${from.symbol} ≈ ${formatAmount(rate)} ${to.symbol}`}</span></div>
        </section>
        <section className="route-panel" aria-label="Choose a route">
          <div className="swap-panel-head"><div><h2>Pick a path</h2></div><span className="product-step">Step 2 of 2</span></div>
          <div className="product-route-list">{ROUTES.map((choice) => <button type="button" key={choice.id} className={`product-route-option${route === choice.id ? " selected" : ""}`} onClick={() => { setRoute(choice.id); setResult(false); }} aria-pressed={route === choice.id}><span className="route-choice-radio" aria-hidden="true"/><span className="route-choice-copy"><b>{choice.name}</b><small>{choice.path}</small></span><span className="route-choice-stats"><small>{choice.badge}</small><b>{formatEta(choice.eta)}</b><em>${choice.fee.toFixed(2)} fee</em></span></button>)}</div>
          <div className="route-context"><span className="route-context-icon"><Cube size={16} aria-hidden="true"/></span><span><b>Route</b><small>{hops.join(" → ")}</small></span></div>
          <button type="button" className="button button-primary product-review-button" disabled={!validAmount || sameAsset} onClick={() => setResult(true)}>{result ? <><Check size={16} aria-hidden="true"/> Sample route ready</> : <>Review sample route <ArrowRight size={16} aria-hidden="true"/></>}</button>
          {sameAsset && <p className="product-footnote" role="status">Choose two different assets to preview a route.</p>}
        </section>
      </div>
      {result && <div className="demo-result" role="status"><span><Check size={16} aria-hidden="true"/></span><div><b>Sample route ready</b><small>{amount} {from.symbol} → ~{estimate} {to.symbol} via {selectedRoute.name}, {formatEta(selectedRoute.eta)}. No transaction was sent.</small></div></div>}
      <footer className="product-footer"><BrandMark/><span><ShieldCheck size={13} aria-hidden="true"/> Illustrative values, route times and fees.</span></footer>
    </main>
  </div>;
}
