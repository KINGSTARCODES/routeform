
from PIL import Image
import numpy as np, os
src="/w/hosts/0/u/6ae2d4721bfd42d44dfb9c7f/cache/images/img_2f236896b062.jpg"
im=Image.open(src).convert("RGB")
a=np.asarray(im).astype(int)
r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
# stronger background suppression
alpha=np.clip((g-90)*2.2,0,255).astype(np.uint8)
mask=(g>r+15)&(g>b+15)&(g>100)
alpha=np.where(mask, alpha, 0)
alpha=np.where(alpha<25,0,alpha)
rgba=np.dstack([a,alpha]).astype(np.uint8)
img=Image.fromarray(rgba,"RGBA")
ys,xs=np.where(alpha>30)
print("bbox", int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max()), "count", len(xs))
bbox=(max(0,int(xs.min())-8), max(0,int(ys.min())-8), min(320,int(xs.max())+9), min(320,int(ys.max())+9))
img=img.crop(bbox)
w,h=img.size
side=int(max(w,h)*1.30)
sq=Image.new("RGBA",(side,side),(0,0,0,0))
sq.paste(img, ((side-w)//2,(side-h)//2), img)
sq=sq.resize((256,256), Image.LANCZOS)
os.makedirs("src/assets", exist_ok=True)
sq.save("src/assets/logo-near.png")
print("saved", sq.size)
# preview on dark bg for visual check
bg=Image.new("RGBA",(256,256),(10,20,25,255))
bg.paste(sq,(0,0),sq)
bg.save("/tmp/logo-preview.png")
print("preview saved")
