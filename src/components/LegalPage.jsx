import { ArrowLeft } from "@phosphor-icons/react";
import { BrandMark } from "./ProductFlow.jsx";

// Plain-language starter text. Have a lawyer review it before relying on it for real-money use.
const PAGES = {
  terms: {
    title: "Terms of use",
    sections: [
      ["What Routeform is", "Routeform is an interface concept for NEAR Intents. The demo uses illustrative data. Live mode shows real quotes from NEAR Intents and asks your wallet to send real funds."],
      ["Your funds, your wallet", "Routeform does not hold or custody your assets. Every transaction is approved and signed in your own wallet. Blockchain transactions are final once sent."],
      ["Quotes and risk", "Quotes are estimates and can change. Swaps may be refunded if they cannot complete. Cross-chain activity carries risk, including delays, price movement and smart-contract or network failures. Only use amounts you can afford to lose."],
      ["No advice", "Nothing on this site is financial, legal or tax advice."],
      ["No warranty", "The service is provided as is, without warranties of any kind, to the extent permitted by law."],
    ],
  },
  privacy: {
    title: "Privacy",
    sections: [
      ["What we collect", "Routeform does not ask for an account, email or password. Connecting a wallet shares your public address with this site."],
      ["What stays in your browser", "The demo may save a short history on your device. Your connected wallet choice is kept only for the current tab session."],
      ["Third parties", "Live quotes and swap status are requested from the NEAR Intents service through Routeform's server. Your wallet provider and the blockchains you use have their own policies. The site is hosted on Vercel, which may log standard request data."],
      ["Contact", "Questions or concerns: open an issue at github.com/KINGSTARCODES/routeform/issues."],
    ],
  },
};

export default function LegalPage({ kind }) {
  const page = PAGES[kind];
  return <div className="product-shell legal-shell">
    <header className="site-header"><div className="nav-wrap"><BrandMark/><nav className="nav-links product-nav" aria-label="Main navigation"><a href="/">Home</a><a href="/product">Demo</a></nav></div></header>
    <main className="product-main legal-main">
      <a className="product-back" href="/"><ArrowLeft size={14} aria-hidden="true"/> Back to Routeform</a>
      <h1>{page.title}</h1>
      {page.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
    </main>
  </div>;
}
