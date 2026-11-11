# Live mode

- `Live` button (nav, home + demo) opens a wallet popup (EIP-6963 browser wallets), then `/live`.
- Demo mode is unchanged and has no wallet.
- Quotes/status go through `api/oneclick/[...path].js`, which calls the NEAR Intents 1Click API.
- Set `ONECLICK_JWT` in Vercel (Project Settings -> Environment Variables) to avoid the default 0.1% fee. The key never reaches the browser.
- Source chains: NEAR, Ethereum, Arbitrum, Base, Optimism, Polygon, BNB, Avalanche. Destinations: any chain 1Click lists.
- NEAR wallets (Meteor, HOT, HERE, MyNearWallet) via `@near-wallet-selector`, loaded on demand. Run `npm install` after pulling (new deps in package.json).
- Popup: centered with blurred backdrop on PC, bottom sheet sliding up on mobile.
- Not yet supported: Solana/BTC sources. MyNearWallet redirects away and back; the tx result is not read after the redirect yet.
