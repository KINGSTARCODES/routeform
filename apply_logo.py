
import pathlib
p = pathlib.Path("src/App.jsx")
t = p.read_text()

# import
t = t.replace(
  'import { WalletConnectPage, UseProductPage } from "./components/ProductFlow.jsx";',
  'import { WalletConnectPage, UseProductPage } from "./components/ProductFlow.jsx";\nimport LogoMark from "./components/LogoMark.jsx";'
)

# Brand R svg
old_brand = '<span className="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 25V7h9a6 6 0 0 1 0 12H7m9 0 9 6M16 19l9-8"/><circle cx="25" cy="7" r="2.5"/></svg></span>'
assert t.count(old_brand)==1, "brand"
t = t.replace(old_brand, '<span className="brand-mark"><LogoMark size={30}/></span>')

# NetworkOrb R + N node
old = '<span className="orb-logo">R</span>'
assert t.count(old)==1
t = t.replace(old, '<span className="orb-logo"><LogoMark size={72}/></span>')
old = '<span className="orb-node node-a">N</span>'
assert t.count(old)==1
t = t.replace(old, '<span className="orb-node node-a"><LogoMark size={16}/></span>')

# eco-near (appears twice: ecosystem + footer)
old = '<i className="eco-near" aria-hidden="true">N</i>'
assert t.count(old)==2, t.count(old)
t = t.replace(old, '<i className="eco-near" aria-hidden="true"><LogoMark size={13}/></i>')

# flow node origin emblem N
old = '<span className="node-emblem">N</span>'
assert t.count(old)==1
t = t.replace(old, '<span className="node-emblem"><LogoMark size={26}/></span>')

# closing token N
old = '<div className="closing-token" aria-hidden="true">N</div>'
assert t.count(old)==1
t = t.replace(old, '<div className="closing-token" aria-hidden="true"><LogoMark size={24}/></div>')

# ProductFlow
q = pathlib.Path("src/components/ProductFlow.jsx")
s = q.read_text()
s = s.replace(
  'import ConceptBanner from "./ConceptBanner.jsx";',
  'import ConceptBanner from "./ConceptBanner.jsx";\nimport LogoMark from "./LogoMark.jsx";'
)
old_brand2 = '<span className="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 25V7h9a6 6 0 0 1 0 12H7m9 0 9 6M16 19l9-8"/><circle cx="25" cy="7" r="2.5"/></svg></span>'
assert s.count(old_brand2)==1
s = s.replace(old_brand2, '<span className="brand-mark"><LogoMark size={30}/></span>')

# NEAR token: add logo flag
old = '{ symbol: "NEAR", chain: "NEAR", mark: "N", color: "token-near" }'
assert s.count(old)==1
s = s.replace(old, '{ symbol: "NEAR", chain: "NEAR", mark: "N", color: "token-near", logo: true }')

# TokenSelect render
old = '<i className={`product-token-icon ${value.color}`} aria-hidden="true">{value.mark}</i>'
assert s.count(old)==1
s = s.replace(old, '<i className={`product-token-icon ${value.color}`} aria-hidden="true">{value.logo ? <LogoMark size={18}/> : value.mark}</i>')

# NEAR wallet: add logo flag
old = '{ id: "near", name: "NEAR Wallet", kind: "NEAR network", mark: "N", className: "near-mark" }'
assert s.count(old)==1
s = s.replace(old, '{ id: "near", name: "NEAR Wallet", kind: "NEAR network", mark: "N", className: "near-mark", logo: true }')

# wallet option mark render
old = '<span className={`wallet-option-mark ${wallet.className}`} aria-hidden="true">{wallet.mark}</span>'
assert s.count(old)==1
s = s.replace(old, '<span className={`wallet-option-mark ${wallet.className}`} aria-hidden="true">{wallet.logo ? <LogoMark size={20}/> : wallet.mark}</span>')

# art wallet mark render
old = '<span className={`art-wallet-mark ${wallet.className}`}>{wallet.mark}</span>'
assert s.count(old)==1
s = s.replace(old, '<span className={`art-wallet-mark ${wallet.className}`}>{wallet.logo ? <LogoMark size={24}/> : wallet.mark}</span>')

# wallet art orb R
old = '<div className="wallet-art-orb"><span>R</span><i/><i/><i/></div>'
assert s.count(old)==1
s = s.replace(old, '<div className="wallet-art-orb"><span><LogoMark size={46}/></span><i/><i/><i/></div>')

p.write_text(t)
q.write_text(s)
print("patched ok")
