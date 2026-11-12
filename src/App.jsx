import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CircleNotch, Command, Cube, Lightning, List, Planet, ShieldCheck, X } from "@phosphor-icons/react";
import { ROUTES, loadHistory, saveHistory } from "./lib/routes.js";
import Tray from "./components/Tray.jsx";
import RouteCard from "./components/RouteCard.jsx";
import History from "./components/History.jsx";
import ConceptBanner from "./components/ConceptBanner.jsx";
import { WalletConnectPage, UseProductPage } from "./components/ProductFlow.jsx";
import LiveButton from "./components/LiveButton.jsx";
import LivePage from "./components/LivePage.jsx";
import BrandLogo, { LogoMark as NewLogoMark } from "./components/Logo.jsx";
import OutcomeInput from "./components/OutcomeInput.jsx";
import LegalPage from "./components/LegalPage.jsx";
import LogoMark, { RLogoMark } from "./components/LogoMark.jsx";
import BrandIcon from "./components/BrandIcon.jsx";
import { TokenIcon } from "./components/NetIcon.jsx";

const SIGNATURE_SPRING = { type: "spring", damping: 28, stiffness: 260 };
const KNOWN_CHAINS = ["Arbitrum", "Optimism", "Ethereum", "NEAR", "Base"];

/** Finds a known chain name in the user's outcome text, e.g. "USDC on Optimism". */
function destinationFrom(outcome) {
  const text = outcome.toLowerCase();
  return KNOWN_CHAINS.find((chain) => text.includes(chain.toLowerCase())) || null;
}

/** Re-targets the demo routes so the last hop matches the destination the user typed. */
function withDestination(route, destination) {
  if (!destination) return route;
  let hops = [...route.hops];
  hops[hops.length - 1] = destination;
  if (hops[0] === destination) hops[0] = destination === "Ethereum" ? "Base" : "Ethereum";
  // Drop any middle hop that would repeat the destination (e.g. "Base → Optimism → Optimism").
  hops = hops.filter((hop, index) => index === 0 || index === hops.length - 1 || hop !== destination);
  return { ...route, hops };
}

function AnimatedNumber({ value, format = (v) => v }) {
  const reduce = useReducedMotion();
  return <AnimatePresence mode="popLayout" initial={false}><motion.span key={value} initial={reduce ? false : { y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { y: -8, opacity: 0 }} transition={SIGNATURE_SPRING} className="inline-block tabular-nums">{format(value)}</motion.span></AnimatePresence>;
}

const Brand = ({ footer }) => <BrandLogo footer={footer} href="#home"/>;

function RoutePreview({ route, outcome }) {
  const wanted = outcome.trim() || "USDC on Arbitrum";
  return <div className="preview-card" aria-label="Example route">
    <div className="preview-top"><div><span className="eyebrow">ROUTE PREVIEW</span><h3>Intent, meet outcome</h3></div></div>
    <div className="preview-intent"><span className="token-icon token-usdc brand-icon-slot" aria-hidden="true"><BrandIcon icon="usdc" size={30}/></span><div><small>YOU WANT</small><strong>{wanted}</strong></div><ArrowUpRight size={17} className="muted-icon" aria-hidden="true"/></div>
    <div className="route-line"><span/><span/><span/></div>
    <div className="preview-path"><div className="path-icon"><Lightning weight="fill" aria-hidden="true"/></div><div className="path-copy"><small>SUGGESTED PATH</small><strong>{route.name}</strong><span>{route.hops.join("  →  ")}</span></div><span className="path-chevron"><ArrowRight aria-hidden="true"/></span></div>
    <div className="preview-bottom"><span><ShieldCheck size={15} aria-hidden="true"/> Settlement-aware</span><span>NEAR Intents</span></div>
    <div className="preview-glow"/>
  </div>;
}

// Supported networks revolve around the Routeform mark: two counter-rotating rings.
const NET_ICON = (slug) => `/icons/networks/${slug}.svg`;
const ORBIT_INNER = [{ n: "NEAR" }, { n: "Ethereum", b: "ethereum" }, { n: "Arbitrum", b: "arbitrum" }, { n: "Base", b: "base" }];
const ORBIT_OUTER = [{ n: "Optimism", b: "optimism" }, { n: "Polygon", s: "polygon" }, { n: "BNB Chain", s: "binance-smart-chain" }, { n: "Avalanche", s: "avalanche" }, { n: "USDC", t: true }];
function OrbitRing({ nodes, className, offset = 0, size = 30 }) {
  return <div className={`orb-ring ${className}`}>{nodes.map((node, i) => {
    const a = (offset + (360 / nodes.length) * i) * (Math.PI / 180);
    return <span className="orb-node orb-ring-node" key={node.n} style={{ left: `${50 + 50 * Math.cos(a)}%`, top: `${50 + 50 * Math.sin(a)}%` }} title={node.n}><span className="orb-node-inner">{node.t ? <span style={{ display: "block", width: size, height: size, borderRadius: "50%", overflow: "hidden" }}><TokenIcon symbol="USDC"/></span> : node.b ? <BrandIcon icon={node.b} size={size}/> : node.s ? <img src={NET_ICON(node.s)} width={size} height={size} style={{ display: "block", width: size, height: size, borderRadius: "50%", objectFit: "contain" }} alt="" aria-hidden="true"/> : <LogoMark size={size - 4}/>}</span></span>;
  })}</div>;
}
function NetworkOrb() {
  return <div className="network-orb" aria-hidden="true"><i className="orbit orbit-a"/><i className="orbit orbit-b"/><div className="orb-core"><span className="orb-logo"><NewLogoMark size={72}/></span></div><OrbitRing nodes={ORBIT_INNER} className="ring-inner"/><OrbitRing nodes={ORBIT_OUTER} className="ring-outer" offset={20} size={26}/></div>;
}

function DashboardPreview({ route, outcome }) {
  const wanted = outcome.trim();
  const [asset, ...rest] = (wanted || "USDC on Arbitrum").split(/\s+on\s+/i);
  const network = rest.join(" on ") || (wanted ? "" : "Arbitrum");
  return <section className="dashboard-section section-wrap" aria-label="Example Routeform workspace" data-reveal>
    <div className="dashboard-heading"><div><span className="eyebrow">THE ROUTEFORM VIEW</span><h2>One intent.<br/><span>Everything in view.</span></h2></div><p>Your destination, the proposed path and settlement context, together in one calm workspace.</p></div>
    <div className="dashboard-frame route-workspace"><aside className="dash-sidebar"><Brand/><span className="dash-side-label">WORKSPACE</span><span className="dash-nav active"><Planet size={15} aria-hidden="true"/> Route view</span><span className="dash-nav"><Command size={15} aria-hidden="true"/> Route builder</span><span className="dash-nav"><Cube size={15} aria-hidden="true"/> Recent routes</span></aside>
      <div className="dash-main"><div className="dash-topline"><div><h3>Good moves start with an outcome.</h3></div><span className="demo-pill">EXAMPLE</span></div>
        <div className="route-dashboard-grid"><article className="dashboard-card route-destination"><div className="card-header"><span className="card-label">YOUR INTENT</span><span className="card-menu">01</span></div><div className="route-dest-big"><span>{asset}</span>{network && <small>on {network}</small>}</div><p>Start with where value should end up.</p></article>
        <article className="dashboard-card route-path-card"><div className="card-header"><span className="card-label">SUGGESTED PATH</span></div><div className="route-path-track" aria-hidden="true">{route.hops.map((hop, index) => <span key={`${hop}-${index}`} style={{display:"contents"}}>{index > 0 && <i/>}<span className={`route-path-node${hop === "NEAR" ? " logo-tint" : " brand-icon-slot"}`}>{hop === "NEAR" ? <LogoMark size={20}/> : <BrandIcon icon={hop.toLowerCase()} size={30}/>}</span></span>)}</div><div className="route-path-labels">{route.hops.map((hop, index) => <span key={`${hop}-${index}`}>{hop}</span>)}</div><div className="route-path-name">{route.name}</div></article>
        <article className="dashboard-card route-settlement"><span className="settle-symbol"><ShieldCheck size={17} aria-hidden="true"/></span><div className="settle-copy"><span className="card-label">SETTLEMENT CONTEXT</span><strong>Visible before you act</strong><small>See what has happened and what comes next, at every step.</small></div></article></div>
        <div className="dash-footer"><a href="#route-builder">Try the route builder <ArrowUpRight size={14} aria-hidden="true"/></a></div>
      </div>
    </div>
  </section>;
}

function HomePage() {
  const [outcome, setOutcome] = useState("");
  const [selectedId, setSelectedId] = useState(ROUTES[0].id);
  const [amount, setAmount] = useState(250);
  const [history, setHistory] = useState(loadHistory);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const destination = useMemo(() => destinationFrom(outcome), [outcome]);
  const routes = useMemo(() => ROUTES.map((r) => withDestination(r, destination)), [destination]);
  const route = routes.find((r) => r.id === selectedId) || routes[0];
  const received = useMemo(() => amount * route.receive, [amount, route]);
  const canSubmit = outcome.trim().length > 2 && amount > 0;

  useEffect(() => saveHistory(history), [history]);
  useEffect(() => {
    const root = document.documentElement;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reveal = (el) => el.classList.add("is-visible");
    const revealAll = () => document.querySelectorAll("[data-reveal]").forEach(reveal);
    const onFocusIn = (e) => { const el = e.target instanceof Element ? e.target.closest("[data-reveal]") : null; if (el) reveal(el); };
    let io = null;
    const teardown = () => { io?.disconnect(); io = null; document.removeEventListener("focusin", onFocusIn); };
    const setup = () => {
      teardown();
      if (motionQuery.matches || typeof window.IntersectionObserver !== "function") { revealAll(); root.classList.remove("reveal-ready"); return; }
      root.classList.add("reveal-ready");
      io = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); } }), { threshold: 0.08, rootMargin: "0px 0px -56px 0px" });
      document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
      document.addEventListener("focusin", onFocusIn);
    };
    const observer = new MutationObserver(() => document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => io?.observe(el)));
    setup(); observer.observe(document.querySelector("main"), { childList: true, subtree: true }); motionQuery.addEventListener("change", setup);
    return () => { observer.disconnect(); motionQuery.removeEventListener("change", setup); teardown(); root.classList.remove("reveal-ready"); };
  }, []);

  const close = useCallback(() => setConfirmOpen(false), []);
  const confirm = () => {
    const entry = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), outcome: outcome.trim(), route: `${route.name} · $${amount}`, at: new Date().toISOString() };
    setHistory((h) => [entry, ...h].slice(0, 8)); setDone(true); setConfirmOpen(false);
  };
  const reuse = (item) => { setOutcome(item.outcome); setDone(false); };
  const closeMenu = () => setMenuOpen(false);

  return <div className="site-shell" id="home">
    <ConceptBanner/>
    <header className="site-header"><div className="nav-wrap"><Brand/><button type="button" className="menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="primary-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X aria-hidden="true"/> : <List aria-hidden="true"/>}</button><nav id="primary-nav" className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation"><a href="#home" onClick={closeMenu}>Home</a><a href="#how" onClick={closeMenu}>How it works</a><a href="#features" onClick={closeMenu}>Features</a><a href="#route-builder" onClick={closeMenu}>Route builder</a><LiveButton onOpen={closeMenu}/><a className="nav-cta" href="/product">Try the demo <ArrowUpRight size={15} aria-hidden="true"/></a></nav></div></header>

    <main>
      <section className="hero section-wrap" aria-labelledby="hero-title">
        <div className="hero-copy" data-reveal><h1 id="hero-title">Move value.<br/><span>Skip the maze.</span></h1><p className="hero-description">Say which asset you want and where it should land. Routeform lays out the cross-chain routes through NEAR Intents, with time, fees and settlement in one view.</p><div className="hero-actions"><a className="button button-primary" href="#route-builder">Explore a route <ArrowRight size={17} aria-hidden="true"/></a><a className="button button-ghost hero-demo" href="/product">Try the demo</a><a className="text-link" href="#how">See how it works <ArrowDown size={15} aria-hidden="true"/></a></div></div>
        <div className="hero-visual" data-reveal><div className="visual-grid"/><NetworkOrb/><RoutePreview route={route} outcome={outcome}/><div className="floating-note note-settlement"><span className="mini-check"><Check size={11} weight="bold" aria-hidden="true"/></span><span><b>Settlement</b><small>visible at a glance</small></span></div><div className="floating-note note-intent"><span className="mini-spark"><Lightning size={13} weight="fill" aria-hidden="true"/></span><span><b>One clear intent</b><small>many possible paths</small></span></div><div className="visual-caption"><span>ROUTING, MADE LEGIBLE</span><span className="caption-line"/></div></div>
      </section>

      <DashboardPreview route={route} outcome={outcome}/>

      <section className="ecosystem section-wrap" aria-label="Designed for the NEAR Intents ecosystem" data-reveal><span className="eyebrow">DESIGNED FOR THE NEAR INTENTS ECOSYSTEM</span><div className="ecosystem-row"><span className="ecosystem-lead">A clearer way across</span><div className="ecosystem-chips"><span className="eco-chip"><i className="eco-near logo-tint" aria-hidden="true"><LogoMark size={13}/></i> NEAR Intents</span><span className="eco-chip"><i className="eco-chain brand-icon-slot" aria-hidden="true"><BrandIcon icon="base" size={14}/></i> Multi-chain</span><span className="eco-chip"><i className="eco-settle" aria-hidden="true"><Check size={12}/></i> Settlement-aware</span></div></div></section>

      <section className="section-wrap how-section" id="how"><div className="section-heading" data-reveal><div><span className="eyebrow">A SIMPLE FLOW, FEWER SURPRISES</span><h2>From intention<br/>to <span>settlement.</span></h2></div><p>Cross-chain moves can feel like a maze of bridges, networks and status screens. Routeform puts the decision in plain view.</p></div><div className="steps-grid"><article className="step-card" data-reveal><span className="step-index">01</span><div className="step-icon"><Command size={22} aria-hidden="true"/></div><h3>Describe the outcome</h3><p>Start with the asset and destination you actually want, not a list of protocols to figure out.</p><span className="step-foot">INTENT FIRST <ArrowUpRight size={14} aria-hidden="true"/></span></article><article className="step-card" data-reveal><span className="step-index">02</span><div className="step-icon"><Cube size={22} aria-hidden="true"/></div><h3>Understand the route</h3><p>See the proposed path, its hops and key trade-offs together before making a decision.</p><span className="step-foot">ROUTE, MADE CLEAR <ArrowUpRight size={14} aria-hidden="true"/></span></article><article className="step-card" data-reveal><span className="step-index">03</span><div className="step-icon"><ShieldCheck size={22} aria-hidden="true"/></div><h3>Follow settlement</h3><p>Keep the important state visible as the intent moves toward its destination.</p><span className="step-foot">STATE IN CONTEXT <ArrowUpRight size={14} aria-hidden="true"/></span></article></div></section>

      <section className="feature-section" id="features"><div className="section-wrap feature-row"><div className="feature-copy" data-reveal><span className="eyebrow">THE ROUTE SHOULD MAKE SENSE</span><h2>Clarity at every<br/><span>decision point.</span></h2><p>Move beyond protocol names and fragmented status. Routeform is shaped around what you want to do, with route details that stay readable from first glance to final state.</p><ul className="feature-list"><li><Check size={15} aria-hidden="true"/> Outcome-led route previews</li><li><Check size={15} aria-hidden="true"/> Hops and trade-offs together</li><li><Check size={15} aria-hidden="true"/> Settlement status with context</li></ul><a className="text-link" href="#route-builder">Explore the route builder <ArrowRight size={15} aria-hidden="true"/></a></div><div className="feature-art art-route" data-reveal><div className="art-topline"><span className="eyebrow">ROUTE OVERVIEW</span></div><div className="art-flow"><div className="flow-node node-origin"><span className="node-emblem logo-tint"><LogoMark size={26}/></span><small>ORIGIN</small><b>NEAR</b></div><div className="flow-connector"><span className="flow-beam"/><span className="flow-bubble"><ArrowRight size={14} aria-hidden="true"/></span></div><div className="flow-node node-intent"><span className="node-emblem"><Lightning size={15} weight="fill" aria-hidden="true"/></span><small>INTENT</small><b>USDC</b></div><div className="flow-connector"><span className="flow-beam"/><span className="flow-bubble"><ArrowRight size={14} aria-hidden="true"/></span></div><div className="flow-node node-destination"><span className="node-emblem brand-icon-slot" aria-hidden="true"><BrandIcon icon="arbitrum" size={30}/></span><small>DESTINATION</small><b>Arbitrum</b></div></div><div className="art-status"><span><i/> example route</span><span>settlement details included</span></div><div className="art-orbit"/></div></div></section>

      <section className="feature-section feature-alt confidence-section"><div className="section-wrap feature-row reverse"><div className="feature-copy" data-reveal><span className="eyebrow">TRACK EVERY SWAP</span><h2>Know where every<br/><span>swap stands.</span></h2><p>See each step as it happens: deposit seen, swapping, delivered. If something goes wrong, you see that too, and your funds are refunded.</p><ul className="feature-list"><li><Check size={15} aria-hidden="true"/><span>See the quote and minimum you'll receive before you sign</span></li><li><Check size={15} aria-hidden="true"/><span>Live status after you send</span></li><li><Check size={15} aria-hidden="true"/><span>Automatic refund if a swap can't complete</span></li></ul></div><div className="feature-art art-state" data-reveal><div className="state-header"><span className="eyebrow">SWAP STATUS</span><span className="status-pill"><i/> Example</span></div><div className="state-title">Your swap, step by step</div><div className="state-timeline"><div className="timeline-item active"><span className="timeline-dot"><Check size={10} aria-hidden="true"/></span><span className="timeline-text"><b>Deposit detected</b><small>Your funds arrived</small></span><time>DONE</time></div><div className="timeline-item active"><span className="timeline-dot"><CircleNotch size={12} aria-hidden="true"/></span><span className="timeline-text"><b>Swapping across networks</b><small>Finding the route</small></span><time>IN PROGRESS</time></div><div className="timeline-item"><span className="timeline-dot"><Check size={10} aria-hidden="true"/></span><span className="timeline-text"><b>Delivered to your wallet</b><small>Sent to your address</small></span><time>WAITING</time></div></div><div className="state-halo"/></div></div></section>

      <section className="builder-section" id="route-builder"><div className="section-wrap builder-layout"><div className="builder-intro" data-reveal><span className="eyebrow">TRY THE INTERFACE</span><h2>Start with<br/><span>your outcome.</span></h2><p>Enter the asset and network you want, then compare the example routes. Figures are illustrative, not live quotes.</p></div><div className="builder-panel" data-reveal><div className="builder-panel-head"><div><span className="eyebrow">ROUTE BUILDER</span><h3>Compare routes</h3></div></div><form onSubmit={(e) => { e.preventDefault(); if (!canSubmit) return; setDone(false); setConfirmOpen(true); }} className="route-form"><label htmlFor="outcome">I want to end up with</label><OutcomeInput value={outcome} onChange={setOutcome} describedBy="outcome-hint"/><p id="outcome-hint" className="field-hint">Name a network to retarget the routes: Arbitrum, Optimism, Ethereum, NEAR or Base.</p><div className="form-bottom"><label className="amount-field"><span>Amount (USD)</span><span className="amount-input"><b aria-hidden="true">$</b><input type="number" min="1" value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}/></span></label><div className="receive-field"><span>Estimated output</span><strong>$<AnimatedNumber value={received.toFixed(2)}/></strong></div></div><button type="submit" disabled={!canSubmit} className="button button-primary builder-submit">Save this route <ArrowRight size={16} aria-hidden="true"/></button><p className="demo-disclaimer">Illustrative values. Fees and rates are not live.</p></form><div className="route-options"><div className="route-options-title"><span>EXAMPLE ROUTES</span><span>SELECT ONE</span></div><div className="route-option-list">{routes.map((r, i) => <RouteCard key={r.id} route={r} index={i} amount={amount} selected={r.id === selectedId} onSelect={setSelectedId}/>)}</div></div></div></div>
        <div className="section-wrap builder-after"><AnimatePresence>{done && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="success-message"><span><Check size={14} aria-hidden="true"/></span> Saved to recent routes <button type="button" onClick={() => setDone(false)}>Dismiss</button></motion.div>}</AnimatePresence><History items={history} onReuse={reuse} onClear={() => setHistory([])}/></div></section>

      <section className="closing-section section-wrap" data-reveal><div className="closing-card"><div className="closing-glow"/><div className="closing-copy"><span className="eyebrow">MAKE THE NEXT MOVE CLEAR</span><h2>Your intent is<br/>the <span>starting point.</span></h2><p>Try the route builder and see how Routeform makes cross-chain movement easier to understand.</p><a className="button button-light" href="#route-builder">Try the route builder <ArrowRight size={16} aria-hidden="true"/></a></div><div className="closing-visual"><NetworkOrb/><div className="closing-token logo-tint" aria-hidden="true"><NewLogoMark size={28}/></div></div></div></section>
    </main>

    <footer className="site-footer"><div className="section-wrap footer-main"><div className="footer-brand"><Brand footer/><p>Cross-chain routes, shaped around the outcome you want.</p><span className="footer-note">An interface concept for NEAR Intents.</span></div><div className="footer-col"><span className="eyebrow">EXPLORE</span><a href="#how">How it works</a><a href="#features">Features</a><a href="#route-builder">Route builder</a></div><div className="footer-col"><span className="eyebrow">PRODUCT</span><a href="/product">Try the demo</a><a href="/connect">Choose a wallet</a></div><div className="footer-col footer-status"><span className="eyebrow">BUILT AROUND</span><span className="footer-ecosystem"><i className="eco-near logo-tint" aria-hidden="true"><LogoMark size={13}/></i> NEAR Intents</span></div></div><div className="section-wrap footer-bottom"><span>© {new Date().getFullYear()} Routeform</span><span className="footer-legal"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="https://github.com/KINGSTARCODES/routeform/issues" target="_blank" rel="noreferrer">Feedback</a></span><span className="footer-legal">Estimates are illustrative, not live quotes.</span><a href="#home">Back to top ↑</a></div></footer>

    <Tray open={confirmOpen} title="Save this route?" onClose={close}><div className="tray-body"><p className="tray-text">{outcome.trim()} via <strong>{route.name}</strong></p><div className="tray-hops">{route.hops.join(" → ")}</div><p className="tray-note">Saved to recent routes on this device only. Nothing is sent.</p><button type="button" onClick={confirm} className="tray-action">Save to recent routes</button></div></Tray>
  </div>;
}

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/connect") return <WalletConnectPage/>;
  if (pathname === "/product") return <UseProductPage/>;
  if (pathname === "/live") return <LivePage/>;
  if (pathname === "/terms") return <LegalPage kind="terms"/>;
  if (pathname === "/privacy") return <LegalPage kind="privacy"/>;
  return <HomePage/>;
}
