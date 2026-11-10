import { motion, useReducedMotion } from "framer-motion";
import { formatEta, formatAmount } from "../lib/routes.js";

export default function RouteCard({ route, selected, onSelect, index, amount = 250 }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      layout={!reduce}
      layoutId={`route-${route.id}`}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 300, delay: reduce ? 0 : index * 0.06 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      onClick={() => onSelect(route.id)}
      aria-pressed={selected}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${
        selected ? "border-primary bg-canvas shadow-soft" : "border-hairline bg-canvas hover:border-ink-4"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-[16px]">{route.name}</span>
        <span className="font-mono text-[12px] text-primary">{route.badge}</span>
      </div>
      <p className="mt-1 font-mono text-[13px] text-ink-3">{route.hops.join(" → ")}</p>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
        <span><span className="text-ink-3">Time </span>{formatEta(route.eta)}</span>
        <span><span className="text-ink-3">Fee </span>${route.fee.toFixed(2)}</span>
        <span><span className="text-ink-3">You get </span>${formatAmount(amount * route.receive)}</span>
      </div>
    </motion.button>
  );
}
