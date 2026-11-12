/** Splits a search box value into lowercase terms and drops filler words, so "usdc on arbitrum" finds USDC on Arbitrum. */
export const searchTerms = (query) => String(query || "").toLowerCase().split(/[\s,]+/).filter((t) => t && t !== "on" && t !== "in" && t !== "to");
/** Every term must appear somewhere in the haystack (order does not matter). */
export const matchesAll = (terms, haystack) => terms.every((t) => haystack.includes(t));
