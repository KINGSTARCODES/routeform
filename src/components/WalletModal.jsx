import { useEffect, useState } from "react";
import { CircleNotch, ShieldCheck } from "@phosphor-icons/react";
import Tray from "./Tray.jsx";
import { connect, discoverWallets } from "../lib/evm.js";
import { connectNear, listNearWallets } from "../lib/near.js";

/** Wallet-connect popup for Live mode. Lists wallets the browser actually exposes (EIP-6963). */
export default function WalletModal({ open, onClose, onConnected }) {
  const [wallets, setWallets] = useState([]);
  const [nearWallets, setNearWallets] = useState([]);
  const [scanning, setScanning] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setScanning(true); setError(""); setBusyId("");
    const stop = discoverWallets((list) => { setWallets(list.map((w) => ({ ...w, kind: "evm" }))); setScanning(false); });
    let alive = true;
    listNearWallets().then((list) => alive && setNearWallets(list)).catch(() => {});
    return () => { alive = false; stop(); };
  }, [open]);

  const pick = async (wallet) => {
    setBusyId(wallet.id); setError("");
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

  return <Tray open={open} title="Connect a wallet" onClose={onClose}>
    <div className="live-modal">
      <p className="live-modal-lead">Connect a NEAR or EVM wallet to swap real assets through NEAR Intents.</p>
      {scanning && <p className="live-modal-status" role="status"><CircleNotch className="spin" size={15} aria-hidden="true"/> Looking for wallets…</p>}
      
      {nearWallets.length > 0 && <p className="live-section-label">NEAR</p>}
      <div className="live-wallet-list">
        {nearWallets.map((wallet) => <button type="button" key={wallet.kind + wallet.id} className="live-wallet-btn" disabled={!!busyId} onClick={() => pick(wallet)}>
          {wallet.icon ? <img src={wallet.icon} alt="" width="28" height="28"/> : <span className="live-wallet-fallback" aria-hidden="true">{wallet.name.slice(0, 1)}</span>}
          <b>{wallet.name}</b>
          {busyId === wallet.id && <CircleNotch className="spin" size={16} aria-hidden="true"/>}
        </button>)}
      </div>
      {wallets.length > 0 && <p className="live-section-label">EVM wallets</p>}
      <div className="live-wallet-list">
        {wallets.map((wallet) => <button type="button" key={wallet.kind + wallet.id} className="live-wallet-btn" disabled={!!busyId} onClick={() => pick(wallet)}>
          {wallet.icon ? <img src={wallet.icon} alt="" width="28" height="28"/> : <span className="live-wallet-fallback" aria-hidden="true">{wallet.name.slice(0, 1)}</span>}
          <b>{wallet.name}</b>
          {busyId === wallet.id && <CircleNotch className="spin" size={16} aria-hidden="true"/>}
        </button>)}
      </div>
      {error && <p className="product-error" role="alert">{error}</p>}
      <div className="connect-safety"><ShieldCheck size={16} aria-hidden="true"/><span><b>Live mode uses real funds</b><small>Routeform never holds your assets. Every transaction is approved in your wallet.</small></span></div>
    </div>
  </Tray>;
}
