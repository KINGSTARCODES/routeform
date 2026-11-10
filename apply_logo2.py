
import pathlib
p = pathlib.Path("src/App.jsx")
t = p.read_text()
t = t.replace(
  "<span className=\"orb-node node-a\"><LogoMark size={16}/></span>",
  "<span className=\"orb-node node-a logo-tint\"><LogoMark size={17}/></span>"
)
t = t.replace(
  "<i className=\"eco-near\" aria-hidden=\"true\"><LogoMark size={13}/></i>",
  "<i className=\"eco-near logo-tint\" aria-hidden=\"true\"><LogoMark size={13}/></i>"
)
t = t.replace(
  "<span className=\"node-emblem\"><LogoMark size={26}/></span>",
  "<span className=\"node-emblem logo-tint\"><LogoMark size={26}/></span>"
)
p.write_text(t)
print("ok")
