import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, CaretLeft } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

const spring = { type: "spring", damping: 30, stiffness: 320 };
const FOCUSABLE = 'button:not([tabindex="-1"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Tray({ open, title, onClose, onBack, children }) {
  const reduce = useReducedMotion();
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;

    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
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
      window.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(raf);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  return (
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
            layout
            initial={reduce ? { opacity: 0 } : { y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 48, opacity: 0, scale: 0.98 }}
            transition={reduce ? { duration: 0.15 } : spring}
            className="tray-card"
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
    </AnimatePresence>
  );
}
