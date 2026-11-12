import { ArrowRight, ArrowSquareOut, Check, CircleNotch, Warning } from "@phosphor-icons/react";
import Tray from "./Tray.jsx";

const FAIL = {
  REFUNDED: ["Refunded", "The swap couldn't complete, so your funds were returned to your connected wallet."],
  FAILED: ["Swap failed", "Something went wrong. Check your wallet and the explorer."],
  INCOMPLETE_DEPOSIT: ["Deposit too small", "The deposit was smaller than quoted. It will be refunded if it isn't completed."],
};

// Step states: "done" | "active" | "wait" | "fail"
function steps(tx, status) {
  if (!tx) return [["active", "IN WALLET"], ["wait", "WAITING"], ["wait", "WAITING"]];
  if (status === "SUCCESS") return [["done", "DONE"], ["done", "DONE"], ["done", "DONE"]];
  if (FAIL[status]) return [["done", "DONE"], ["done", "DONE"], ["fail", status === "REFUNDED" ? "REFUNDED" : "FAILED"]];
  if (status === "PROCESSING") return [["done", "DONE"], ["active", "IN PROGRESS"], ["wait", "WAITING"]];
  if (status === "KNOWN_DEPOSIT_TX") return [["done", "DONE"], ["active", "STARTING"], ["wait", "WAITING"]];
  return [["active", "SENT"], ["wait", "WAITING"], ["wait", "WAITING"]];
}

export default function SwapStatusModal({ open, onClose, tx, summary, explorerUrl, onAgain }) {
  const status = tx?.status;
  const finished = status === "SUCCESS" || !!FAIL[status];
  const [s1, s2, s3] = steps(tx, status);
  const items = [
    [s1, !tx ? "Confirm in your wallet" : s1[0] === "done" ? "Deposit detected" : "Deposit sent", !tx ? "Approve the transfer to start" : s1[0] === "done" ? "Your funds arrived" : "Waiting for it to be detected"],
    [s2, "Swapping across networks", s2[0] === "wait" ? "Starts once your deposit lands" : s2[0] === "done" ? "Route completed" : "Finding the best route"],
    [s3, s3[0] === "fail" ? FAIL[status][0] : "Delivered to your wallet", s3[0] === "done" ? "Sent to your address" : s3[0] === "fail" ? "Funds are safe" : "Sent to your address"],
  ];
  const title = status === "SUCCESS" ? "Swap complete" : FAIL[status] ? FAIL[status][0] : "Swap in progress";
  return <Tray open={open} onClose={onClose} title={title} className="swap-status-tray">
    <div className="ss-summary">{summary} {!finished && <span className="ss-live"><i/> Live</span>}</div>
    <div className="state-timeline ss-timeline">
      {items.map(([[state, label], head, sub], i) => <div key={i} className={`timeline-item${state === "done" || state === "active" ? " active" : ""}${state === "fail" ? " fail" : ""}`}>
        <span className="timeline-dot">{state === "done" ? <Check size={10} aria-hidden="true"/> : state === "active" ? <CircleNotch className="spin" size={12} aria-hidden="true"/> : state === "fail" ? <Warning size={11} aria-hidden="true"/> : <Check size={10} aria-hidden="true"/>}</span>
        <span className="timeline-text"><b>{head}</b><small>{sub}</small></span><time>{label}</time>
      </div>)}
    </div>
    {FAIL[status] && <p className="ss-note">{FAIL[status][1]}</p>}
    {!tx && <p className="ss-note">Keep this window open and approve the request in your wallet.</p>}
    {tx && !finished && <p className="ss-note">You can close this window. Your swap keeps going and shows under Recent swaps.</p>}
    <div className="ss-actions">
      {explorerUrl && <a className="ss-link" href={explorerUrl} target="_blank" rel="noreferrer">View deposit <ArrowSquareOut size={13} aria-hidden="true"/></a>}
      {finished ? <button type="button" className="tray-action" onClick={onAgain}>Start another swap <ArrowRight size={15} aria-hidden="true"/></button> : <button type="button" className="ss-close" onClick={onClose}>Close</button>}
    </div>
  </Tray>;
}
