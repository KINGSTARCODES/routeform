import { useState } from "react";
import { Lightning } from "@phosphor-icons/react";
import WalletModal from "./WalletModal.jsx";
import { saveLiveSession } from "../lib/liveSession.js";

/** "Live" nav button: opens the wallet popup, then continues to /live. */
export default function LiveButton({ className = "nav-live", onOpen }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={className} onClick={() => { onOpen?.(); setOpen(true); }}><Lightning size={15} weight="fill" aria-hidden="true"/> Live</button>
    <WalletModal open={open} onClose={() => setOpen(false)} onConnected={(wallet) => { saveLiveSession(wallet); window.location.assign("/live"); }}/>
  </>;
}
