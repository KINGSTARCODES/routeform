import { useEffect, useState } from "react";
import { CircleNotch, ShieldCheck } from "@phosphor-icons/react";
import Tray from "./Tray.jsx";
import { LogoMark as NewLogoMark } from "./Logo.jsx";
import { connect, discoverWallets } from "../lib/evm.js";
import { connectNear, listNearWallets } from "../lib/near.js";

/** Decorative "pick a wallet" artwork. Shown on PC only (hidden by CSS on tablets and phones). */
function WalletArtwork({ wallet }) {
  return <div className="wallet-art" aria-hidden="true">
    <div className="wallet-art-grid"/>
    <div className="wallet-art-glow"/>
    <div className="wallet-art-orbit orbit-one"/><div className="wallet-art-orbit orbit-two"/>
    <div className="wallet-art-orb"><span className="logo-tint"><NewLogoMark size={46}/></span><i/><i/><i/></div>
    <div className="wallet-card-stack">
      <div className="wallet-art-card card-back"><span className="art-card-chip"/><i/><i/></div>
      <div className="wallet-art-card card-mid"><span className="art-card-chip"/><i/><i/></div>
      <div className="wallet-art-card card-front"><span className="art-wallet-mark">{wallet?.icon ? <img className="net-icon" src={wallet.icon} alt="" draggable="false"/> : (wallet?.name || "R").slice(0, 1)}</span><span className="art-card-copy"><b>{wallet?.name || "Your wallet"}</b><small>{wallet ? "Selected wallet" : "Pick a wallet"}</small></span><span className="art-card-spark">✦</span></div>
    </div>
  </div>;
}

/** Wallet-connect popup for Live mode. Lists wallets the browser actually exposes (EIP-6963) plus NEAR wallets. */
export default function WalletModal({ open, onClose, onConnected }) {
  const [wallets, setWallets] = useState([]);
  const [nearWallets, setNearWallets] = useState([]);
  const [nearLoading, setNearLoading] = useState(true);
  const [scanning, setScanning] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [focus, setFocus] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    setScanning(true); setError(""); setBusyId(""); setFocus(null);
    const stop = discoverWallets((list) => { setWallets(list.map((w) => ({ ...w, kind: "evm" }))); setScanning(false); });
    let alive = true;
    setNearLoading(true);
    listNearWallets().then((list) => alive && setNearWallets(list)).catch(() => {}).finally(() => alive && setNearLoading(false));
    return () => { alive = false; stop(); };
  }, [open]);

  const pick = async (wallet) => {
    setBusyId(wallet.kind + wallet.id); setError(""); setFocus(wallet);
    try {
      if (wallet.kind === "near") {
        const result = await connectNear(wallet.id);
        onConnected({ ...result, name: wallet.name, icon: wallet.icon });
      } else {
        const { address, chainId } = await connect(wallet.provider);
        onConnected({ ...wallet, address, chainId });
      }
    } catch (e) {
      setError(e?.code === 4001 ? "Connection request was declined in the wallet." : (e?.message || "Could not connect to the wallet."));
      setBusyId("");
    }
  };

  const list = (items) => items.map((wallet) => <button type="button" key={wallet.kind + wallet.id} className="live-wallet-btn" disabled={!!busyId}
    onMouseEnter={() => setFocus(wallet)} onFocus={() => setFocus(wallet)} onClick={() => pick(wallet)}>
    {wallet.icon ? <img src={wallet.icon} alt="" width="28" height="28"/> : <span className="live-wallet-fallback" aria-hidden="true">{wallet.name.slice(0, 1)}</span>}
    <b>{wallet.name}</b>
    {busyId === wallet.kind + wallet.id && <CircleNotch className="spin" size={16} aria-hidden="true"/>}
  </button>);

  const art = focus || nearWallets[0] || wallets[0];
  return <Tray open={open} title="Connect a wallet" onClose={onClose} className="tray-wallet">
    <div className="wm-grid">
      <div className="live-modal">
        <p className="live-modal-lead">Connect a NEAR or EVM wallet to swap real assets through NEAR Intents.</p>
        {(scanning || nearLoading) && <p className="live-modal-status" role="status">Loading wallets…</p>}
        {nearWallets.length > 0 && <><p className="live-section-label">NEAR wallets</p><div className="live-wallet-list">{list(nearWallets)}</div></>}
        {wallets.length > 0 && <><p className="live-section-label">Browser wallets</p><div className="live-wallet-list">{list(wallets)}</div></>}
        {!scanning && !nearLoading && wallets.length === 0 && nearWallets.length === 0 && <p className="live-modal-status" role="status">No wallets found. Install a wallet extension such as MetaMask, then reopen this window.</p>}
        {error && <p className="product-error" role="alert">{error}</p>}
        <div className="connect-safety"><ShieldCheck size={16} aria-hidden="true"/><span><b>Live mode uses real funds</b><small>Routeform never holds your assets. You review everything before anything is sent, and every transaction is approved in your wallet.</small></span></div>
        <button type="button" className="live-cancel" onClick={onClose}>Cancel</button>
      </div>
      <div className="wm-art"><WalletArtwork wallet={art}/></div>
    </div>
  </Tray>;
}
