import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, CaretLeft } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const spring = { type: "spring", damping: 30, stiffness: 320 };
const FOCUSABLE = 'button:not([tabindex="-1"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function useIsMobile() {
  const query = "(max-width: 620px)";
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export default function Tray({ open, title, onClose, onBack, className = "", children }) {
  const reduce = useReducedMotion();
  const mobile = useIsMobile();
  // Desktop: centered card that fades/scales in. Mobile: bottom sheet that slides up.
  const hidden = reduce ? { opacity: 0 } : mobile ? { y: "100%", opacity: 1 } : { y: 24, opacity: 0, scale: 0.98 };
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  // Keep the latest onClose without re-running the effect below: an inline onClose changes on every
  // parent render (e.g. each keystroke in a search box), which would steal focus and close the keyboard.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") { onCloseRef.current(); return; }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE)).filter((el) => !el.disabled);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);

    // Move focus into the dialog once it has mounted.
    const raf = window.requestAnimationFrame(() => {
      const target = dialogRef.current?.querySelector(".tray-action") || dialogRef.current?.querySelector(FOCUSABLE);
      target?.focus();
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(raf);
      returnFocusRef.current?.focus?.();
    };
  }, [open]);

  // Portal to <body>: ancestors with backdrop-filter/transform (the sticky header) would otherwise trap position:fixed.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="tray-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="tray-backdrop"
            tabIndex={-1}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={hidden}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={hidden}
            transition={reduce ? { duration: 0.15 } : mobile ? { type: "spring", damping: 34, stiffness: 340 } : spring}
            className={`tray-card ${className}`.trim()}
          >
            <div className="tray-head">
              {onBack ? (
                <button type="button" onClick={onBack} aria-label="Back" className="tray-icon-btn">
                  <CaretLeft size={18} aria-hidden="true" />
                </button>
              ) : null}
              <h2 className="tray-title">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Dismiss" className="tray-icon-btn">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
