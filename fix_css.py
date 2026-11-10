
import pathlib
p = pathlib.Path("src/index.css")
t = p.read_text()
t = t.replace(
  ".near-mark{background:rgba(68,199,176,.15)}.near-mark.logo-tint{display:grid;place-items:center}bitget-mark",
  ".near-mark{background:rgba(68,199,176,.15)}.near-mark.logo-tint{display:grid;place-items:center}.bitget-mark"
)
# also the orb-logo/logo-tint nested rules - ensure orb-logo container doesn't strip size
p.write_text(t)
print("fixed")
# verify
print([l[:120] for l in t.splitlines() if "bitget-mark" in l][:1])
