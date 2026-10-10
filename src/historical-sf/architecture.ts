import { Color3 } from '@babylonjs/core/Maths/math.color';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Masonry } from './geometry';
import type { Palette } from './materials';

function panel(b:Masonry,m:StandardMaterial,x:number,y:number,z:number,w:number,h:number){b.face(m,[[x-w/2,y-h/2,z],[x-w/2,y+h/2,z],[x+w/2,y+h/2,z],[x+w/2,y-h/2,z]]);}
function sash(b:Masonry,p:Palette,x:number,y:number,z:number,w=1.3,h=2.3,wood=false){
  const frame=wood?p.darkTrim:p.trim;
  b.box(p.darkTrim,x,y,z+.09,w+.34,h+.34,.3);panel(b,p.glassLight,x,y,z-.08,w,h);
  for(const side of[-1,1])b.box(frame,x+side*(w/2+.08),y,z-.13,.13,h+.25,.24);
  b.box(frame,x,y-h/2-.13,z-.18,w+.42,.19,.48);b.box(frame,x,y+h/2+.1,z-.15,w+.35,.17,.3);
  b.box(p.wood,x,y,z-.16,.052,h,.08);b.box(p.wood,x,y+.07,z-.16,w,.065,.08);
}
function cornice(b:Masonry,p:Palette,w:number,d:number,y:number,front=0){
  for(const [dy,dh,over] of [[-.42,.16,.18],[-.22,.12,.4],[0,.24,.7],[.22,.14,.95]])b.box(p.trim,0,y+dy,front,w+over,dh,d+over);
  for(let x=-w/2+.3;x<w/2;x+=.56)b.box(p.darkTrim,x,y-.54,front-d/2-.18,.17,.26,.36);
}
function bayFront(b:Masonry,p:Palette,w:number,z:number){
  for(let y=4.4;y<13.5;y+=.29)b.box(p.boards,0,y,z,w,.037,.08);
  const count=Math.floor(w/4.5),step=w/count;
  for(let i=0;i<count;i++){
    const x=-w/2+(i+.5)*step;
    const shape:[number,number][]=[[x-1.62,z+.04],[x-1.62,z-.28],[x-1.18,z-.86],[x+1.18,z-.86],[x+1.62,z-.28],[x+1.62,z+.04]];
    b.prism(p.boards,shape,4.4,8.75);panel(b,p.bayPhoto,x,8.78,z-.89,2.37,8.62);
    for(const y of[4.38,8.62,12.98]){b.prism(p.darkTrim,shape.map(([u,v])=>[x+(u-x)*1.06,v-.04]),y,.12);b.prism(p.trim,shape.map(([u,v])=>[x+(u-x)*1.1,v-.1]),y+.12,.13);}
    for(const side of[-1,1])for(const y of[6.55,10.76]){b.box(p.glassLight,x+side*1.43,y,z-.4,.035,2.65,.54);b.box(p.darkTrim,x+side*1.45,y,z-.65,.075,2.9,.12);}
    for(const y of[6.55,10.76])for(const side of[-1,1])b.box(p.darkTrim,x+side*.54,y,z-.94,.055,2.45,.12);
    for(const y of[4.72,8.93,13.15])b.box(p.trim,x,y,z-.99,2.65,.13,.18);
    b.arch(p.glass,x,.45,z-.17,step-.65,3.65,p.darkTrim,.16);
    panel(b,i%2?p.display:p.shelves,x,1.7,z-.23,step-.91,2.15);
    for(const side of[-1,1]){b.cylinder(p.darkTrim,x+side*(step/2-.18),2.15,z-.32,.13,4.15,.11,10);b.box(p.trim,x+side*(step/2-.18),.38,z-.32,.37,.25,.45);}
    b.box(p.wood,x,1.05,z-.39,step-.7,.08,.16);b.box(p.wood,x,2.75,z-.39,step-.7,.11,.16);
  }
  b.box(p.darkTrim,0,4.17,z-.13,w,.26,.38);b.box(p.trim,0,13.48,z-.3,w+.65,.2,.65);
  for(let x=-w/2+.2;x<w/2;x+=.52)b.box(p.trim,x,13.2,z-.32,.17,.32,.46);
}
export function sign(scene:Scene,text:string,position:Vector3,width:number,height:number,yaw=0,bg='#343c33',fg='#e2d9bd'){
  const tex=new DynamicTexture(`sign-${text}`,{width:1536,height:160},scene,true),c=tex.getContext() as CanvasRenderingContext2D;
  c.fillStyle=bg;c.fillRect(0,0,1536,160);c.strokeStyle=fg;c.lineWidth=2;c.strokeRect(10,10,1516,140);c.font=`${text.length>26?53:70}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=fg;c.fillText(text,768,84,1480);tex.update();
  const mat=new StandardMaterial(`sign-${text}`,scene);mat.diffuseTexture=tex;mat.specularColor=Color3.Black();mat.emissiveColor=new Color3(.055,.055,.045);
  const plane=MeshBuilder.CreatePlane(`sign-${text}`,{width,height,sideOrientation:Mesh.DOUBLESIDE},scene);plane.position=position;plane.rotation.y=yaw;plane.material=mat;plane.isPickable=false;return plane;
}
function oldCommercial(scene:Scene,p:Palette,meshes:Mesh[],side:number,z:number,w:number,h:number,d:number,style:number){
  const b=new Masonry(scene,`market-commercial-${side}-${z}`,[side*(18.288+d/2),.2,z],side>0?Math.PI/2:-Math.PI/2),front=-d/2;
  const body=[p.warm,p.rose,p.grey,p.cream][style%4];b.box(body,0,h/2,0,w,h,d);
  const bays=Math.floor(w/3.2),step=w/bays,stories=Math.floor((h-4)/3.45);
  for(let j=0;j<bays;j++){
    const x=-w/2+(j+.5)*step;b.box(p.darkTrim,x,1.9,front-.1,step-.25,3.7,.25);panel(b,j%3?p.shelves:p.display,x,1.7,front-.26,step-.62,2.7);
    b.box(p.trim,x-step/2+.12,1.9,front-.34,.26,3.8,.42);b.box(p.wood,x,1.7,front-.35,.07,2.8,.12);
    b.box(p.wood,x,.4,front-.36,step-.4,.4,.15);b.box(p.wood,x,3.2,front-.34,step-.4,.18,.14);
    if(j%3!==2){b.face(p.cloth,[[x-step/2+.1,3.8,front-.3],[x-step/2+.1,3.05,front-2.05],[x+step/2-.1,3.05,front-2.05],[x+step/2-.1,3.8,front-.3]]);b.box(p.stripe,x,2.94,front-2.04,step-.2,.24,.055);for(const side of[-1,1])b.beam(p.black,[x+side*(step/2-.2),2.98,front-2],[x+side*(step/2-.2),2.4,front-.4],.014);}
    for(let f=0;f<stories;f++){const y=5.65+f*3.45;sash(b,p,x,y,front-.1,1.35,2.24);if(style%2===0&&f===stories-1)b.arch(null,x,y-1.18,front-.35,1.63,2.82,p.trim,.14);}
  }
  for(let f=0;f<=stories;f++)b.box(p.trim,0,4.06+f*3.45,front-.15,w+.2,.17,.32);
  for(let i=0;i<=bays;i+=3)b.box(p.trim,-w/2+i*step,h/2+1.8,front-.1,.33,h-4,.4);
  cornice(b,p,w,d,h);b.box(p.roof,0,h+.28,0,w-.45,.3,d-.45);
  if(style%3===0){b.box(body,0,h+.95,front+.2,w,1.05,.55);for(let x=-w/2+.6;x<w/2;x+=1.1)b.cylinder(p.trim,x,h+1.1,front+.1,.13,.7,.13,8);b.box(p.trim,0,h+1.52,front+.1,w+.3,.16,.5);}
  for(const end of[-1,1])for(let f=0;f<stories;f++)for(let k=0;k<Math.floor(d/3.6);k++){const zz=front+1.9+k*3.6,yy=5.65+f*3.45;b.box(p.glass,end*(w/2+.02),yy,zz,.045,2.2,1.35);b.box(p.trim,end*(w/2+.13),yy-1.2,zz,.26,.18,1.62);}
  for(let i=0;i<3;i++)b.box(p.brick,-w*.32+i*w*.32,h+1.1,d*.16,1,1.7,.9);
  meshes.push(...b.finish());
}
export function buildStreetArchitecture(scene:Scene,p:Palette){
  const meshes:Mesh[]=[];
  for(const [side,z,w,h,d,style] of [[-1,320,35,19,26,1],[-1,359,32,20,25,2],[-1,397,31,17,27,0],[1,321,34,17,27,3],[1,360,32,22,27,1],[1,398,32,20,27,0],[1,438,29,17,26,2],[1,474,26,15,30,3]])oldCommercial(scene,p,meshes,side,z,w,h,d,style);
  const south=new Masonry(scene,'south-ticket-office',[31.3,.2,518],Math.PI/2);south.box(p.boards,0,6.9,0,29,13.8,26);bayFront(south,p,29,-13);cornice(south,p,29,26,13.9);south.box(p.roof,0,14.05,0,28.5,.35,25.5);meshes.push(...south.finish());
  const end=new Masonry(scene,'south-ticket-office-front',[31.3,.2,532.5],Math.PI);bayFront(end,p,26,0);meshes.push(...end.finish());
  meshes.push(sign(scene,'TICKET OFFICE',new Vector3(31.3,4.25,532.89),17,.65,Math.PI));
  const ad=new Masonry(scene,'south-painted-advert-wall',[41,.2,490],Math.PI);ad.box(p.brick,0,12.5,0,31,25,24);panel(ad,p.adverts,0,19.5,-12.06,30,10.1);cornice(ad,p,31,24,25);meshes.push(...ad.finish());
  const warehouse=new Masonry(scene,'north-brick-warehouse',[-37,.2,442],-Math.PI/2);warehouse.box(p.brick,0,13,0,39,26,37);panel(warehouse,p.warehousePhoto,0,14,-18.57,38.7,23.4);cornice(warehouse,p,39,37,26);
  for(let f=0;f<5;f++)for(let j=0;j<7;j++){const x=-16.6+j*5.52,y=5.1+f*4.38;warehouse.box(p.darkTrim,x,y-1.25,-18.67,1.65,.14,.23);}
  for(const side of[-1,1])for(let y=5;y<25;y+=4.3)for(let zz=-15;zz<16;zz+=4.6){warehouse.box(p.glass,side*19.55,y,zz,.05,2.3,1.3);warehouse.box(p.trim,side*19.64,y-1.23,zz,.17,.13,1.55);}
  meshes.push(...warehouse.finish());
  const coffee=new Masonry(scene,'north-coffee-house',[-37.3,.2,521],Math.PI);coffee.box(p.boards,0,4.25,0,38,8.5,21);panel(coffee,p.coffeeUpper,0,6.55,-10.58,37.7,3.02);panel(coffee,p.coffeeShops,0,2.25,-10.6,37.7,4.35);
  for(let x=-18.4;x<19;x+=4.17){coffee.box(p.darkTrim,x,4.36,-10.69,.16,8.0,.27);coffee.box(p.trim,x,4.63,-10.78,.3,.18,.37);}
  for(const y of[.32,4.52,8.36])coffee.box(p.trim,0,y,-10.68,38.5,.16,.4);
  cornice(coffee,p,38,21,8.55);
  const roof:[number,number,number][]=[[-19,8.9,-10.5],[-15.5,11,-7], [15.5,11,-7],[19,8.9,-10.5]];coffee.face(p.roof,roof);coffee.face(p.roof,[[-19,8.9,10.5],[19,8.9,10.5],[15.5,11,7],[-15.5,11,7]]);coffee.box(p.roof,0,11,0,31,.1,14);
  coffee.face(p.roof,[[-19,8.9,-10.5],[-19,8.9,10.5],[-15.5,11,7],[-15.5,11,-7]]);coffee.face(p.roof,[[19,8.9,10.5],[19,8.9,-10.5],[15.5,11,-7],[15.5,11,7]]);
  for(let x=-13;x<17;x+=7){coffee.box(p.darkTrim,x,11.2,0,2,.17,2.4);coffee.box(p.glassLight,x,11.3,0,1.75,.08,2.1);}meshes.push(...coffee.finish());
  const coffeeSide=new Masonry(scene,'coffee-side',[-18.25,.2,521],-Math.PI/2);for(let x=-8;x<10;x+=3.8){sash(coffeeSide,p,x,6.5,0,1.65,2.3,true);panel(coffeeSide,p.shelves,x,2,0,3.2,3.5);coffeeSide.box(p.darkTrim,x-1.75,2,.0,.2,4.1,.3);}meshes.push(...coffeeSide.finish());
  oldCommercial(scene,p,meshes,-1,486,24,9.6,19,3);
  meshes.push(sign(scene,'PACIFIC COAST STEAMSHIP CO.',new Vector3(-18.12,9.38,486),23,.75,-Math.PI/2,'#ddd5bb','#384036'));
  const tank=new Masonry(scene,'roof-water-tank',[-25,.2,486]);for(const x of[-1.7,1.7])for(const z of[-1.7,1.7]){tank.beam(p.rust,[x,9.7,z],[x,12,z],.08);tank.beam(p.rust,[x,9.8,-1.7],[-x,12,1.7],.04);}tank.cylinder(p.wood,0,13.35,0,2.3,3.2,2.3,24);tank.cylinder(p.roof,0,15.15,0,2.65,.45,0,24);for(const y of[12.2,13.3,14.4])for(let a=0;a<24;a++){const s=a/24*Math.PI*2,t=(a+1)/24*Math.PI*2;tank.beam(p.black,[Math.cos(s)*2.31,y,Math.sin(s)*2.31],[Math.cos(t)*2.31,y,Math.sin(t)*2.31],.035);}meshes.push(...tank.finish());
  buildFerry(scene,p,meshes);
  return meshes;
}
function clockTexture(scene:Scene){
  const texture=new DynamicTexture('ferry-clock-face',{width:768,height:768},scene,true),c=texture.getContext() as CanvasRenderingContext2D;
  c.clearRect(0,0,768,768);c.fillStyle='#e5dfc6';c.beginPath();c.arc(384,384,360,0,Math.PI*2);c.fill();c.strokeStyle='#38403b';c.lineWidth=16;c.stroke();c.lineWidth=3;c.beginPath();c.arc(384,384,326,0,Math.PI*2);c.stroke();c.fillStyle='#343c36';c.font='63px Georgia';c.textAlign='center';c.textBaseline='middle';
  const roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];for(let i=0;i<60;i++){const a=i/60*Math.PI*2;c.lineWidth=i%5===0?6:2;c.beginPath();c.moveTo(384+Math.sin(a)*315,384-Math.cos(a)*315);c.lineTo(384+Math.sin(a)*(i%5===0?297:307),384-Math.cos(a)*(i%5===0?297:307));c.stroke();if(i%5===0)c.fillText(roman[i/5],384+Math.sin(a)*266,389-Math.cos(a)*266);}
  const hour=(3+17/60)/12*Math.PI*2,minute=17/60*Math.PI*2;c.lineCap='round';c.lineWidth=15;c.beginPath();c.moveTo(384,384);c.lineTo(384+Math.sin(hour)*165,384-Math.cos(hour)*165);c.stroke();c.lineWidth=9;c.beginPath();c.moveTo(384,384);c.lineTo(384+Math.sin(minute)*249,384-Math.cos(minute)*249);c.stroke();c.beginPath();c.arc(384,384,15,0,Math.PI*2);c.fill();texture.update();return texture;
}
function buildFerry(scene:Scene,p:Palette,meshes:Mesh[]){
  const z=590,d=45.7,w=201.2,front=-d/2;const b=new Masonry(scene,'ferry-building',[0,.2,z]);
  b.box(p.grey,0,12.55,0,w,14.2,d);b.box(p.grey,0,2.7,4,w,5.4,d-8);b.box(p.roof,0,19.9,0,w-.5,.5,d-.5);
  for(const side of[-1,1])for(let i=0;i<18;i++){
    const x=side*(22.25+i*4.47);
    for(const dx of[-2.23,2.23])b.box(p.grey,x+dx,2.75,front+2,.95,5.5,4.5);
    b.arch(null,x,.3,front-.16,3.15,5.1,p.trim,.27);b.arch(p.glass,x,.4,front+4,3.15,4.95,p.darkTrim,.14);
    b.arch(p.glass,x,7.25,front-.15,3.2,10.25,p.trim,.2);
    for(const yy of[8.0,11.3,14.65])b.box(p.trim,x,yy,front-.23,3.13,.16,.17);
    for(const yy of[9.65,12.95]){panel(b,p.glassLight,x,yy,front-.2,2.88,2.8);for(const dx of[-.9,0,.9])b.box(p.darkTrim,x+dx,yy,front-.28,.055,2.78,.13);b.box(p.darkTrim,x,yy,front-.28,2.92,.06,.13);}
    for(const dx of[-1.6,1.6])b.box(p.trim,x+dx,11.7,front-.25,.17,8.85,.22);
    const spring=15.9;for(const a of[Math.PI/4,Math.PI/2,Math.PI*3/4])b.beam(p.darkTrim,[x,spring,front-.25],[x+Math.cos(a)*1.48,spring+Math.sin(a)*1.48,front-.25],.035);
  }
  for(const yy of[5.65,6.17,18.12])b.box(p.trim,0,yy,front-.3,w+.4,.2,.6);cornice(b,p,w,d,19.55);
  const cf=front-1.9;b.box(p.grey,0,18.0,front+1.1,39.5,3.2,6);b.box(p.grey,0,8.0,front+4.7,39.5,16,2);
  for(const x of[-11,0,11]){
    b.arch(p.glass,x,.42,cf+.2,7.55,16.6,p.trim,.33);
    for(const yy of[5.3,6.35,12.4])b.box(p.trim,x,yy,cf-.02,7.6,.42,.5);
    panel(b,p.glassLight,x,9.37,cf+.12,7.15,5.55);
    for(let dx=-3;dx<=3;dx+=.6){b.box(p.darkTrim,x+dx,9.3,cf-.04,.07,5.6,.15);b.box(p.darkTrim,x+dx,14.0,cf-.04,.065,2.65,.14);}
    for(const yy of[7.15,8.25,9.35,10.45,11.55,13.2,14.2])b.box(p.darkTrim,x,yy,cf-.04,7.2,.065,.16);
    const spring=.42+16.6-7.55/2;for(let a=Math.PI/8;a<Math.PI;a+=Math.PI/8)b.beam(p.darkTrim,[x,spring,cf-.04],[x+Math.cos(a)*3.52,spring+Math.sin(a)*3.52,cf-.04],.043);
    for(const dx of[-2.5,0,2.5]){b.box(p.wood,x+dx,2.4,cf-.07,.17,4.2,.24);panel(b,p.glassLight,x+dx,2.45,cf+.06,2.23,4.02);b.box(p.wood,x+dx,1.0,cf-.12,2.2,.16,.18);b.box(p.brass,x+dx+.72,2.0,cf-.22,.04,.42,.09);}
  }
  for(const x of[-18.3,-15.3,-7.1,-4.0,4.0,7.1,15.3,18.3]){
    b.box(p.trim,x,.5,cf-.1,1.05,.65,1.25);b.cylinder(p.trim,x,8.5,cf-.05,.37,15.2,.3,16);
    for(let a=0;a<10;a++){const angle=a/10*Math.PI*2;b.beam(p.grey,[x+Math.cos(angle)*.36,1.2,cf-.05+Math.sin(angle)*.36],[x+Math.cos(angle)*.30,15.5,cf-.05+Math.sin(angle)*.30],.022,4);}
    b.box(p.trim,x,16.3,cf-.03,1.0,.36,1.1);for(const dx of[-.38,.38])b.ellipsoid(p.trim,x+dx,16.08,cf-.42,.2,.22,.15,false,10);
  }
  for(const x of[-20,20]){b.box(p.grey,x,8.9,front-.7,3.8,17.8,3);for(let k=-1;k<=1;k++)sash(b,p,x+k*.87,15.1,front-2.26,.52,2.1);b.arch(p.glass,x,.4,front-2.23,2.75,6.6,p.trim,.24);}
  const tw=9.75;b.box(p.grey,0,34.1,-.4,tw,28.2,tw);cornice(b,p,tw,tw,20.7);
  for(const side of[-1,1])for(let k=-1;k<=1;k++){b.box(p.darkTrim,k*2.02,31.7,side*(tw/2+.03)-.4,.5,19.6,.06);b.box(p.trim,k*2.02+.35,31.7,side*(tw/2+.06)-.4,.12,19.6,.12);b.box(p.darkTrim,side*(tw/2+.03),31.7,k*2.02-.4,.06,19.6,.5);}
  b.box(p.grey,0,47.1,-.4,tw,10.4,tw);cornice(b,p,tw,tw,52.45);
  b.box(p.trim,0,53.5,-.4,10.35,1.8,10.35);for(let x=-4.1;x<4.2;x+=1.02)b.box(p.darkTrim,x,53.48,-5.65,.51,.68,.12);
  b.box(p.grey,0,58.0,-.4,9.6,7.1,9.6);
  for(let x=-3.55;x<=3.6;x+=1.78){b.arch(p.glass,x,55.05,-5.24,1.06,5.3,p.trim,.17);b.cylinder(p.trim,x-.75,57.7,-5.34,.16,5.45,.13,10);}
  for(const side of[-1,1])for(let zz=-3.55;zz<=3.6;zz+=1.78)b.box(p.glass,side*4.86,57.8,zz-.4,.08,4.9,1.06);
  cornice(b,p,9.6,9.6,61.62);b.box(p.grey,0,64.25,-.4,6.8,4.4,6.8);
  for(let x=-2.3;x<2.4;x+=2.3)b.arch(p.glass,x,62.4,-3.84,1.24,3.65,p.trim,.15);cornice(b,p,6.8,6.8,66.55);
  b.cylinder(p.roof,0,67.25,-.4,4.0,1.1,2.55,4);b.cylinder(p.darkTrim,0,69.05,-.4,1.15,2.3,1.15,12);
  for(let a=0;a<8;a++){const t=a/8*Math.PI*2;b.cylinder(p.trim,Math.cos(t)*1.18,69.0,Math.sin(t)*1.18-.4,.12,2.3,.10,8);}b.ellipsoid(p.roof,0,70.25,-.4,1.6,.85,1.6,true,20);b.cylinder(p.brass,0,71.35,-.4,.12,.55,.025,10);
  meshes.push(...b.finish());
  const clock=new StandardMaterial('ferry-clock',scene);clock.diffuseTexture=clockTexture(scene);clock.diffuseTexture.hasAlpha=true;clock.specularColor=Color3.Black();
  for(let side=0;side<4;side++){const a=side*Math.PI/2,face=MeshBuilder.CreatePlane('clock',{width:6.71,height:6.71},scene);face.position.set(Math.sin(a)*4.9,47.1,z-.4-Math.cos(a)*4.9);face.rotation.y=-a;face.material=clock;face.isPickable=false;meshes.push(face);}
  meshes.push(sign(scene,'SAN FRANCISCO',new Vector3(0,18.4,z+cf-.06),23,.68,0,'#96998a','#e9e3ce'));
}
