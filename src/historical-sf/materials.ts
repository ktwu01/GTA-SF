import { Color3 } from '@babylonjs/core/Maths/math.color';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

export function random(seed:number) { let n=seed; return () => { n = Math.imul(n ^ n >>> 15, 1 | n); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; }; }

export function palette(scene:Scene) {
  const mat=(name:string,hex:string,specular=.04)=>{
    const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(specular,specular,specular);m.ambientColor=new Color3(.35,.35,.35);return m;
  };
  const p={
    cream:mat('sandstone','#c5b69a'), pale:mat('limestone','#d6ccba'), warm:mat('warm-stone','#bca78b'),
    grey:mat('grey-stone','#a1a299'), brick:mat('ochre-brick','#a58671'), rose:mat('terracotta','#ae907e'),
    trim:mat('carved-stone','#e0d6bd'), darkTrim:mat('weathered-cornice','#80745f'),
    roof:mat('slate','#535d5b'), copper:mat('aged-copper','#5c6c62'),
    glass:mat('window-shadow','#253d40',.35), glassLight:mat('window-reflection','#617b7a',.25),
    wood:mat('polished-wood','#533e2c'), black:mat('iron','#263232',.2), rail:mat('rail-steel','#939993',.75),
    red:mat('tram-oxblood','#703e32'), green:mat('tram-green','#395348'), ivory:mat('tram-ivory','#dbc89e'),
    cloth:mat('awning-canvas','#d1c3a5'), stripe:mat('awning-stripe','#686b55'),
    coat:mat('wool','#494e48'), navy:mat('navy-wool','#303f4b'), skirt:mat('burgundy-wool','#65514a'),
    skin:mat('skin','#b68c67'), horse:mat('horse-chestnut','#654d3b'), mane:mat('horse-mane','#302f29'),
    road:mat('granite-setts','#c2bbac'), pavement:mat('paving-stones','#c9c3b4'), water:mat('bay-water','#91a9a7',.5),
    bayPhoto:mat('terminal-bay-photograph','#c3bfad'), coffeeUpper:mat('coffee-upper-photograph','#bdbda9'), coffeeShops:mat('coffee-shops-photograph','#bdb9a4'),
    warehousePhoto:mat('warehouse-photograph','#b8b2a0'), adverts:mat('wall-adverts-photograph','#e0d7bd'),
    display:mat('period-shop-display','#c6bda4'), shelves:mat('period-shop-shelves','#c5baa0'), frieze:mat('carved-frieze','#c4b79a'), boards:mat('weathered-painted-boards','#9a9b8b'),
    brass:mat('brass','#ad9056',.65), leather:mat('leather-seat','#69523b'), rust:mat('weathered-iron','#67685b'), trackbed:mat('worn-trackbed','#b4ad99'),
    tramGlass:mat('streetcar-glass','#99afaa',.6),
  };
  const rng=random(624);
  const pave=new DynamicTexture('sidewalk-flags',{width:512,height:512},scene,true);
  const pc=pave.getContext();pc.fillStyle='#aaa89f';pc.fillRect(0,0,512,512);
  for(let y=0;y<4;y++)for(let x=0;x<4;x++) {const v=187+Math.floor(rng()*20);pc.fillStyle=`rgb(${v+7},${v+4},${v-3})`;pc.fillRect(x*128+1,y*128+1,126,126);}
  pave.update();pave.wrapU=Texture.WRAP_ADDRESSMODE;pave.wrapV=Texture.WRAP_ADDRESSMODE;pave.uScale=1;pave.vScale=70;pave.anisotropicFilteringLevel=8;p.pavement.diffuseTexture=pave;
  const grit=new DynamicTexture('stone-grain',{width:128,height:128},scene,true);
  const gc=grit.getContext();gc.fillStyle='#fff';gc.fillRect(0,0,128,128);
  for(let i=0;i<3800;i++){gc.fillStyle=`rgba(85,71,54,${rng()*.08})`;gc.fillRect(rng()*128,rng()*128,1,1);}
  grit.update();grit.wrapU=Texture.WRAP_ADDRESSMODE;grit.wrapV=Texture.WRAP_ADDRESSMODE;
  [p.cream,p.pale,p.warm,p.grey,p.brick,p.rose,p.trim].forEach(m=>m.diffuseTexture=grit);
  const photo=(material:StandardMaterial,file:string)=>{const texture=new Texture('/historical-sf/textures/'+file,scene,false,true);texture.anisotropicFilteringLevel=8;material.diffuseTexture=texture;return texture;};
  photo(p.bayPhoto,'terminal-bay.jpg');photo(p.coffeeUpper,'coffee-house-upper.jpg');photo(p.coffeeShops,'coffee-house-shops.jpg');photo(p.warehousePhoto,'warehouse-facade.jpg');photo(p.adverts,'terminal-wall-adverts.jpg');
  photo(p.display,'shop-display.jpg');photo(p.shelves,'shop-shelves.jpg');photo(p.frieze,'carved-frieze.jpg');photo(p.glassLight,'sash-reflection.jpg');
  p.glassLight.diffuseColor=new Color3(.86,.90,.85);
  const stone=photo(p.road,'granite-setts.jpg');stone.uScale=65;stone.vScale=80;
  const normal=new Texture('/historical-sf/textures/granite-normal.png',scene,false,true);normal.uScale=65;normal.vScale=80;normal.level=.55;p.road.bumpTexture=normal;
  p.road.diffuseColor=new Color3(.88,.87,.82);p.road.specularColor=new Color3(.09,.09,.075);p.road.specularPower=24;
  const bed=photo(p.trackbed,'worn-trackbed.jpg');bed.uScale=.72;bed.vScale=58.75;p.trackbed.diffuseColor=new Color3(.83,.82,.77);p.trackbed.specularColor=new Color3(.07,.07,.06);
  const wornPaint=photo(p.ivory,'painted-wood-wear.jpg');p.green.diffuseTexture=wornPaint;p.red.diffuseTexture=wornPaint;p.wood.diffuseTexture=wornPaint;
  p.ivory.diffuseColor=Color3.FromHexString('#cdb88f');p.ivory.specularColor=new Color3(.055,.055,.04);p.ivory.specularPower=18;
  const wood=new DynamicTexture('painted-clapboards',{width:256,height:512},scene,true),wc=wood.getContext();
  wc.fillStyle='#b7b6a5';wc.fillRect(0,0,256,512);
  for(let y=0;y<512;y+=24){wc.fillStyle='rgba(58,63,51,.25)';wc.fillRect(0,y,256,2);wc.fillStyle='rgba(244,235,205,.28)';wc.fillRect(0,y+3,256,2);for(let i=0;i<90;i++){wc.fillStyle='rgba(69,71,60,.08)';wc.fillRect(rng()*256,y+rng()*23,rng()*30,1);}}
  wood.update();wood.wrapU=wood.wrapV=Texture.WRAP_ADDRESSMODE;p.boards.diffuseTexture=wood;
  p.tramGlass.alpha=.15;p.tramGlass.backFaceCulling=false;
  return p;
}
export type Palette = ReturnType<typeof palette>;
