from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageDraw
import hashlib
import json
import random

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/historical-sf/textures'
OUT.mkdir(parents=True, exist_ok=True)
records = []

def save(image, name, sources, transform):
    path = OUT / name
    image.save(path, quality=93)
    sources = ['ferry-terminal-1905' if source == 'ferry-market-terminal-1905' else source for source in sources]
    records.append({'outputPath': str(path.relative_to(ROOT)), 'sourceImageIds': sources,
                    'transformation': transform, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})

def crop(source, box, size, name, color=None):
    original = Image.open(ROOT / f'public/historical-sf/references/{source}.jpg').convert('RGB')
    image = ImageOps.autocontrast(original.crop(box).convert('L'), cutoff=1).resize(size, Image.Resampling.LANCZOS)
    if color:
        image = ImageOps.colorize(image, color[0], color[1])
    save(image, name, [source], {'cropPixels': box, 'outputSize': size, 'operations': ['grayscale', '1% autocontrast', 'Lanczos resize'] + (['interpretive duotone tint'] if color else []), 'tintEndpoints': color, 'use': 'Period material detail; not proof of the modeled building or its placement.'})

crop('market-shop-1899', (535, 625, 654, 773), (256, 384), 'sash-reflection.jpg', ['#28312f','#b1b4a4'])
crop('market-shop-1899', (384, 400, 436, 670), (192, 768), 'brick-course.jpg', ['#716b60','#c9bda4'])
crop('market-shop-1899', (461, 542, 679, 603), (512, 128), 'carved-frieze.jpg', ['#6c665a','#cabd9f'])
crop('cigar-shop-1899', (271, 813, 444, 934), (512, 384), 'shop-display.jpg', ['#322e24','#bbaa88'])
crop('cigar-shop-1899', (967, 598, 1034, 703), (256, 384), 'shop-shelves.jpg', ['#24241e','#a89573'])
crop('ferry-market-terminal-1905', (200,545,392,948), (384,768), 'terminal-bay.jpg', ['#343a34','#b8b6a4'])
crop('ferry-market-terminal-1905', (2050,813,2960,959), (1536,256), 'coffee-house-upper.jpg', ['#353c34','#aaa994'])
crop('ferry-market-terminal-1905', (1925,953,2960,1117), (1536,256), 'coffee-house-shops.jpg', ['#282d26','#b8b199'])
crop('ferry-market-terminal-1905', (53,148,946,429), (1536,512), 'terminal-wall-adverts.jpg', ['#343b36','#e1dac4'])
crop('ferry-market-terminal-1905', (1680,105,2370,532), (1024,768), 'warehouse-facade.jpg', ['#56514a','#b7a992'])
crop('cigar-shop-1899', (927,735,944,842), (128,512), 'painted-wood-wear.jpg', ['#969286','#f0eedf'])

# Grain comes from the actual track-edge stone surface, with no generated image model.
original = Image.open(ROOT / 'public/historical-sf/references/market-film-470.jpg')
grain = ImageOps.autocontrast(original.crop((56, 717, 335, 954)).convert('L')).resize((1024, 1024), Image.Resampling.BICUBIC)
rng = random.Random(1906)
setts = Image.new('RGB', (1024, 1024), '#77766b')
d = ImageDraw.Draw(setts)
for row in range(32):
    for col in range(-1, 17):
        x = col * 64 + (row % 2) * 32
        y = row * 32
        value = rng.randrange(123, 173)
        d.rounded_rectangle((x+2,y+2,x+62,y+30), radius=3, fill=(value+10,value+7,value))
        d.line((x+5,y+3,x+58,y+3), fill=(value+24,value+21,value+12), width=1)
        for _ in range(18):
            px,py=x+rng.randrange(4,60),y+rng.randrange(3,29)
            v=value+rng.randrange(-16,17)
            d.ellipse((px,py,px+2,py+1),fill=(v+8,v+5,v))
grain = ImageOps.colorize(grain, '#5e5b4e','#c3bca4')
setts = Image.blend(setts, grain, .28)
save(setts, 'granite-setts.jpg', ['film-470'], {'cropPixels':[56,717,335,954],'operations':['grayscale and autocontrast of original stone surface','resample to1024square','interpretive warm tint','28% blend over hand-drawn staggered stone courses'],'use':'Interpretive seamless paving material, not a surveyed road orthophoto.'})
trackbed=Image.blend(setts.filter(ImageFilter.GaussianBlur(1.5)),grain.filter(ImageFilter.GaussianBlur(2)),.42)
trackbed=ImageEnhance.Contrast(trackbed).enhance(.65)
save(trackbed,'worn-trackbed.jpg',['film-470'],{'cropPixels':[56,717,335,954],'operations':['blend granite-setts.jpg derivative with softened original film grain','1.5 pixel blur of paving','42% grain blend','reduce contrast to65%'],'use':'Interpretive worn setts between the rails.'})

# A normal map retains the photographed and hand-drawn surface relief at restrained strength.
height = setts.convert('L').filter(ImageFilter.GaussianBlur(.6))
normal=Image.new('RGB',height.size)
h=height.load();n=normal.load();w,hh=height.size
for y in range(hh):
    for x in range(w):
        dx=(h[(x+1)%w,y]-h[(x-1)%w,y])*.9
        dy=(h[x,(y+1)%hh]-h[x,(y-1)%hh])*.9
        n[x,y]=(max(0,min(255,int(128-dx))),max(0,min(255,int(128-dy))),245)
save(normal,'granite-normal.png',['film-470'],{'operations':['finite-difference normal map from granite-setts.jpg derivative'],'use':'Approximate rendering relief.'})

(ROOT/'data/historical-sf/texture-provenance.json').write_text(json.dumps({'generatedAt':'2026-10-09','method':'Non-generative Pillow crops, tone adjustments, drawing, blending and normal-map conversion.','textures':records},indent=2)+'\n')
print(f'Wrote {len(records)} documented texture derivatives.')
