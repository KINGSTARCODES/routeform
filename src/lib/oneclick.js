// Thin client for the NEAR Intents 1Click API, reached through /api/oneclick (see api/oneclick/[...path].js).
const BASE = "/api/oneclick";

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${BASE}/${path}`, options);
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || `Request failed (${response.status}).`);
  return body;
}

export const getTokens = () => request("tokens");

export const postJson = (path, payload) => request(path, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

/** dry=true returns an indicative quote with no deposit address; dry=false reserves one. */
export function requestQuote({ dry, originAsset, destinationAsset, amount, recipient, refundTo, slippageBps = 100, deadlineMinutes = 30 }) {
  return postJson("quote", {
    dry,
    swapType: "EXACT_INPUT",
    slippageTolerance: slippageBps,
    originAsset,
    depositType: "ORIGIN_CHAIN",
    destinationAsset,
    amount,
    refundTo,
    refundType: "ORIGIN_CHAIN",
    recipient,
    recipientType: "DESTINATION_CHAIN",
    deadline: new Date(Date.now() + deadlineMinutes * 60 * 1000).toISOString(),
  });
}

export const submitDeposit = (txHash, depositAddress) => postJson("deposit/submit", { txHash, depositAddress });

export const getStatus = (depositAddress, depositMemo) =>
  request(`status?depositAddress=${encodeURIComponent(depositAddress)}${depositMemo ? `&depositMemo=${encodeURIComponent(depositMemo)}` : ""}`);

export const TERMINAL_STATUSES = ["SUCCESS", "REFUNDED", "FAILED"];
