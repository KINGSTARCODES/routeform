
from PIL import Image
import numpy as np, os
src="/w/hosts/0/u/6ae2d4721bfd42d44dfb9c7f/cache/images/img_2f236896b062.jpg"
im=Image.open(src).convert("RGB")
a=np.asarray(im).astype(int)
r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
alpha=np.clip((g-40)*1.6,0,255).astype(np.uint8)
mask=(g>r+10)&(g>b+10)
alpha=np.where(mask, alpha, 0)
alpha=np.where(alpha<18,0,alpha)
rgba=np.dstack([a,alpha]).astype(np.uint8)
img=Image.fromarray(rgba,"RGBA")
ys,xs=np.where(alpha>30)
print("bbox", xs.min(), xs.max(), ys.min(), ys.max())
bbox=(max(0,int(xs.min())-6), max(0,int(ys.min())-6), min(320,int(xs.max())+7), min(320,int(ys.max())+7))
img=img.crop(bbox)
w,h=img.size
side=int(max(w,h)*1.36)
sq=Image.new("RGBA",(side,side),(0,0,0,0))
sq.paste(img, ((side-w)//2,(side-h)//2), img)
sq=sq.resize((320,320), Image.LANCZOS)
import os
os.makedirs("src/assets", exist_ok=True)
sq.save("src/assets/logo-near.png")
print("saved", sq.size, os.path.getsize("src/assets/logo-near.png"))
