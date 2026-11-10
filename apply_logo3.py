
import pathlib
# CSS fixes
p = pathlib.Path("src/index.css")
t = p.read_text()
t = t.replace(
  ".near-mark{background:linear-gradient(145deg,#75cef7,#2f82c2)}.",
  ".near-mark{background:rgba(68,199,176,.15)}.near-mark.logo-tint{display:grid;place-items:center}"
)
# add logo-tint rules + ceils for all logo slots
t += """
/* logo placements */
.brand-mark img,.product-footer .brand-mark img{width:24px;height:24px;object-fit:contain}
.brand-mark.logo-tint{background:transparent;border-color:transparent;box-shadow:none}
.orb-logo img{width:100%;height:100%;object-fit:contain}
.orb-logo{display:grid;place-items:center;width:84px;height:84px}
.orb-logo.logo-tint{background:transparent;border:0;box-shadow:none}
.orb-core.logo-tint{background:transparent;border-color:transparent;box-shadow:none}
.orb-node.logo-tint{background:transparent;border-color:transparent;padding:0}
.orb-node.logo-tint img{width:100%;height:100%;object-fit:contain}
.eco-chip i.logo-tint,.footer-ecosystem i.logo-tint{background:transparent;padding:0;display:grid;place-items:center}
.eco-chip i.logo-tint img,.footer-ecosystem i.logo-tint img{width:100%;height:100%;object-fit:contain}
.node-emblem.logo-tint{background:transparent;border-color:transparent;box-shadow:none;padding:4px}
.node-emblem.logo-tint img{width:100%;height:100%;object-fit:contain}
.closing-token.logo-tint{background:transparent;border-color:transparent}
.closing-token.logo-tint img{width:100%;height:100%;object-fit:contain}
.token-near.logo-tint{background:transparent}
.token-near.logo-tint img{width:100%;height:100%;object-fit:contain}
.wallet-option-mark .logo-tint img,.art-wallet-mark img,.wallet-art-orb img{width:100%;height:100%;object-fit:contain}
.wallet-option-mark.logo-tint,.art-wallet-mark.logo-tint{background:transparent;box-shadow:none;padding:2px}
.wallet-art-orb span.logo-tint{background:transparent;text-shadow:none}
.wallet-art-orb span.logo-tint img{width:100%;height:100%;object-fit:contain}
.route-path-node.logo-tint{background:transparent;border-color:transparent}
.route-path-node.logo-tint img{width:100%;height:100%;object-fit:contain}
.connect-orb.logo-tint{background:transparent;border-color:transparent}
.token-near.logo-tint img{width:24px;height:24px}
"""
p.write_text(t)
print("css ok")

# ProductFlow fixes: order of class + logo-tint on all logo slots
p2 = pathlib.Path("src/components/ProductFlow.jsx")
t2 = p2.read_text()
# token icon logo: add logo-tint when logo true
t2 = t2.replace(
  '<i className={`product-token-icon ${value.color}`} aria-hidden="true">{value.logo ? <LogoMark size={18}/> : value.mark}</i>',
  '<i className={`product-token-icon ${value.color}${value.logo ? " logo-tint" : ""}`} aria-hidden="true">{value.logo ? <LogoMark size={22}/> : value.mark}</i>'
)
t2 = t2.replace(
  '{" id: "near", name: "NEAR Wallet", kind: "NEAR network", mark: "N", className: "near-mark", logo: true },',
  '  { id: "near", name: "NEAR Wallet", kind: "NEAR network", mark: "N", className: "near-mark", logo: true },'
)
# wallet art orb + wallet option marks: add logo-tint conditionally by string replace with template
t2 = t2.replace(
  '<div className="wallet-art-orb"><span><LogoMark size={46}/></span><i/><i/><i/></div>',
  '<div className="wallet-art-orb"><span className="logo-tint"><LogoMark size={46}/></span><i/><i/><i/></div>'
)
t2 = t2.replace(
  '<span className={`art-wallet-mark ${wallet.className}`}>{wallet.logo ? <LogoMark size={24}/> : wallet.mark}</span>',
  '<span className={`art-wallet-mark ${wallet.className}${wallet.logo ? " logo-tint" : ""}`}>{wallet.logo ? <LogoMark size={26}/> : wallet.mark}</span>'
)
t2 = t2.replace(
  '<span className={`wallet-option-mark ${wallet.className}`} aria-hidden="true">{wallet.logo ? <LogoMark size={20}/> : wallet.mark}</span>',
  '<span className={`wallet-option-mark ${wallet.className}${wallet.logo ? " logo-tint" : ""}`} aria-hidden="true">{wallet.logo ? <LogoMark size={22}/> : wallet.mark}</span>'
)
t2 = t2.replace(
  '<span className="brand-mark"><LogoMark size={30}/></span>',
  '<span className="brand-mark logo-tint"><LogoMark size={28}/></span>'
)
p2.write_text(t2)
print("pf ok")

# App.jsx: brand mark class fix, closing token, etc.
p3 = pathlib.Path("src/App.jsx")
t3 = p3.read_text()
t3 = t3.replace(
  '<span className="brand-mark"><LogoMark size={30}/></span>',
  '<span className="brand-mark logo-tint"><LogoMark size={28}/></span>'
)
t3 = t3.replace(
  '<div className="closing-token" aria-hidden="true"><LogoMark size={24}/></div>',
  '<div className="closing-token logo-tint" aria-hidden="true"><LogoMark size={28}/></div>'
)
# brand in footer? it uses Brand footer component already replaced? check product-footer brand uses Brand - it's fine
# theme toggle? previously done, check exists
p3.write_text(t3)
print("app ok")
