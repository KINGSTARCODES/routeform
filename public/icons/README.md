# Icon pack

Token and network marks from the open-source web3icons project (MIT, see LICENSE), "background" variants.
Trademarks and logos remain the property of their owners.

- `tokens/<symbol>.svg`: lowercase symbol with non-alphanumerics removed (USDC -> usdc.svg, cbBTC -> cbbtc.svg).
- `networks/<network>.svg`: kebab-case network name (arbitrum-one.svg, binance-smart-chain.svg, near-protocol.svg).
- Served as static files from /icons/... and used by src/components/NetIcon.jsx before any remote fallback.
