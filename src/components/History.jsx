import { AnimatePresence, motion } from "framer-motion";
import { ArrowCounterClockwise, Trash } from "@phosphor-icons/react";

export default function History({ items, onReuse, onClear }) {
  return (
    <section aria-labelledby="history-title" className="mt-10">
      <div className="flex items-center justify-between">
        <h2 id="history-title" className="font-semibold text-[18px]">Recent routes</h2>
        {items.length > 0 && (
          <button onClick={onClear} className="flex items-center gap-1.5 text-[14px] text-ink-3 hover:text-ink">
            <Trash size={14} /> Clear
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-[15px] text-ink-3">Routes you pick will appear here.</p>
      ) : (
        <ul className="mt-3 divide-y divide-hairline">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
              >
                <button onClick={() => onReuse(item)} className="w-full flex items-center justify-between py-3 text-left">
                  <span>
                    <span className="block text-[15px]">{item.outcome}</span>
                    <span className="block font-mono text-[12px] text-ink-3">{item.route}</span>
                  </span>
                  <ArrowCounterClockwise size={16} className="text-ink-3" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
