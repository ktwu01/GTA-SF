import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Scene } from '@babylonjs/core/scene';
import { Masonry } from './geometry';
import type { Palette } from './materials';
import { harborBlocks, harborCargo,quayLoads,pierBarrels } from './harbor-layout';

export function buildHarbor(scene:Scene,p:Palette){
  const b=new Masonry(scene,'east-street-extension');
  b.box(p.road,222.5,-.12,465,255,.24,190);
  const quayMaterial=p.pavement.clone('quay-paving');
  const quayTexture=new DynamicTexture('quay-stone-flags',{width:256,height:256},scene,true),qc=quayTexture.getContext();qc.fillStyle='#94978c';qc.fillRect(0,0,256,256);
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){qc.fillStyle=(x+y)%3===0?'#c9c2ad':'#bdb8a7';qc.fillRect(x*64+1,y*64+1,62,62);}
  quayTexture.update();quayTexture.wrapU=quayTexture.wrapV=Texture.WRAP_ADDRESSMODE;quayTexture.uScale=50;quayTexture.vScale=10;quayMaterial.diffuseTexture=quayTexture;
  b.box(quayMaterial,227.5,.14,585,245,.42,50);
  const bay=MeshBuilder.CreateGround('harbor-bay',{width:680,height:500},scene);bay.position.set(225,-.8,860);const sea=new StandardMaterial('harbor-seawater',scene);sea.diffuseColor=Color3.FromHexString('#4c7775');sea.specularColor=new Color3(.35,.4,.37);sea.specularPower=96;
  const ripples=new DynamicTexture('harbor-ripples',{width:128,height:128},scene,false),ctx=ripples.getContext();
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const wave=Math.sin(y/128*Math.PI*12+Math.sin(x/128*Math.PI*4))*Math.cos(x/128*Math.PI*8);ctx.fillStyle=`rgb(128,${Math.round(128+wave*23)},248)`;ctx.fillRect(x,y,1,1);}
  ripples.update();ripples.wrapU=ripples.wrapV=Texture.WRAP_ADDRESSMODE;ripples.uScale=45;ripples.vScale=36;ripples.level=.24;sea.bumpTexture=ripples;bay.material=sea;
  scene.registerBeforeRender(()=>{ripples.uOffset+=scene.getEngine().getDeltaTime()*.000004;ripples.vOffset+=scene.getEngine().getDeltaTime()*.000006;});
  for(const [index,block] of harborBlocks.slice(0,7).entries()){
    const {x,z,width:w,depth:d}=block,h=[8.8,10.2,12.4,7.4,8.6,11.6,8][index],wall=[p.brick,p.boards,p.brick,p.boards,p.boards,p.brick,p.boards][index];
    b.box(wall,x,h/2,z,w,h,d);
    if(index===0||index===2||index===5){b.box(p.roof,x,h+.08,z,w,.16,d);for(const side of[-1,1])b.box(wall,x,h+.6,z+side*(d/2-.25),w,1.2,.5);}
    else for(const side of[-1,1]){const face: [number,number,number][]=[[x-w/2-1,h,z+side*(d/2+1)],[x-w/2-1,h+2.4,z],[x+w/2+1,h+2.4,z],[x+w/2+1,h,z+side*(d/2+1)]];if(side===1)face.reverse();b.face(p.roof,face);b.face(p.roof,face.map(([xx,yy,zz])=>[xx,yy-.18,zz] as [number,number,number]).reverse());for(let i=0;i<face.length;i++){const a=face[i],c=face[(i+1)%face.length];b.face(p.roof,[a,[a[0],a[1]-.18,a[2]],[c[0],c[1]-.18,c[2]],c]);}}
    if(index!==0&&index!==2&&index!==5)for(const side of[-1,1]){const face: [number,number,number][]=[[x+side*w/2,h,z-d/2],[x+side*w/2,h+2.4,z],[x+side*w/2,h,z+d/2]];b.face(wall,side===-1?face.reverse():face);}
    for(const side of[-1,1]){
      for(let xx=x-w/2+3;xx<x+w/2;xx+=4.5){
        b.box(p.glass,xx,Math.min(6,h-2),z+side*(d/2+.02),2,2.6,.08);
        b.box(p.trim,xx,Math.min(6,h-2)-1.4,z+side*(d/2+.08),2.3,.16,.2);
        for(const dx of[-1.08,0,1.08])b.box(p.trim,xx+dx,Math.min(6,h-2),z+side*(d/2+.07),.12,2.9,.12);
      }
      b.box(p.wood,x,2,z+side*(d/2+.05),5,4,.18);
      b.box(p.trim,x,4.2,z+side*(d/2+.2),5.8,.4,1.5);
    }
    for(let zz=z-d/2+3;zz<z+d/2;zz+=4)b.box(p.glass,x-w/2-.04,Math.min(6,h-2),zz,.08,2.5,1.8);
  }
  b.box(p.wood,194,.1,652,16,.5,84);
  for(let zz=611;zz<694;zz+=1.2)b.box(p.warm,194,.366,zz,16,.025,.055);
  for(const x of[186.5,201.5])for(let z=614;z<694;z+=6){b.cylinder(p.wood,x,-.7,z,.27,3,.27,10);b.cylinder(p.black,x,.63,z,.17,.55,.2,10);}
  for(let x=110;x<350;x+=9)b.box(p.warm,x,.45,609,8.7,.24,.5);
  for(const [i,{x,z}] of harborCargo.entries()){
    const yy=.7+(i%3)*.26;b.box(p.wood,x,yy,z,1.4,1.3,1.4);
    for(const offset of[-.5,.5])b.box(p.black,x+offset,yy,z-.71,.06,1.3,.05);
  }
  for(const {x,z} of quayLoads){b.box(p.wood,x,.7,z,1.5,.7,1.5);b.cylinder(p.black,x+1.2,.62,z,.35,.6,.35,8);}
  for(const {x,z} of pierBarrels){b.cylinder(p.wood,x,.85,z,.48,1,.48,10);for(const y of[.55,1.15])b.cylinder(p.black,x,y,z,.5,.06,.5,10);}
  for(let j=0;j<8;j++)b.box(p.warm,194,.6+j*.16,677,6,.14,8);
  for(const x of[119,194,276,345])for(const z of[475,550]){b.cylinder(p.black,x,2.9,z,.065,5.8,.045,10);b.ellipsoid(p.ivory,x,5.9,z,.2,.3,.2,false,12);}
  const deckMaterial=new StandardMaterial('weathered-timber-deck',scene);deckMaterial.diffuseColor=Color3.FromHexString('#9b8765');deckMaterial.specularColor=Color3.Black();
  const shipRoot=new TransformNode('schooner-root',scene);shipRoot.position.set(220,0,656);
  const s=new Masonry(scene,'lumber-schooner'),mooring=new Masonry(scene,'mooring'),gangway=new Masonry(scene,'gangway'),canvas=new Masonry(scene,'schooner-canvas');
  const sailMaterial=p.cloth.clone('weathered-sailcloth');sailMaterial.backFaceCulling=false;
  for(const z of[-12,0,14])canvas.face(sailMaterial,[[.12,6,z],[.12,25,z],[.12,23,z+8],[.12,6,z+10]]);
  canvas.face(sailMaterial,[[.12,7,15],[.12,25,14],[.12,6.5,33]]);
  const outline:[number,number][]=[[-2.8,-23.77],[-4.9,-17],[-5.49,-8],[-5.49,12],[-4.4,19],[-1,23.77],[1,23.77],[4.4,19],[5.49,12],[5.49,-8],[4.9,-17],[2.8,-23.77]];
  const keel=outline.map(([x,z])=>[x*.65,z*.95] as [number,number]);
  s.prism(p.red,keel,-1.9,1.5);
  for(let i=0;i<outline.length;i++){const a=outline[i],c=outline[(i+1)%outline.length],ka=keel[i],kc=keel[(i+1)%outline.length];s.face(p.wood,[[ka[0],-.4,ka[1]],[a[0],2.4,a[1]],[c[0],2.4,c[1]],[kc[0],-.4,kc[1]]]);}
  s.prism(p.warm,outline,2.25,.15);
  s.face(deckMaterial,outline.map(([x,z])=>[x,2.4,z]));
  for(let z=-22;z<23;z+=.38){const half=Math.abs(z)<16?5.3:Math.max(.4,5.3*(1-(Math.abs(z)-16)/8));s.box(p.wood,0,2.405,z,half*2,.012,.012);}
  for(let i=0;i<outline.length;i++){
    const a=outline[i],c=outline[(i+1)%outline.length];
    for(const y of[2.8,3.35]){
      const steps=Math.ceil(Math.hypot(a[0]-c[0],a[1]-c[1])*2);
      for(let j=0;j<steps;j++){
        const t=j/steps,u=(j+1)/steps,zz=a[1]+(c[1]-a[1])*(t+u)/2;
        if(a[0]<0&&c[0]<0&&zz>-11.6&&zz<-8.4)continue;
        s.beam(p.ivory,[a[0]+(c[0]-a[0])*t,y,a[1]+(c[1]-a[1])*t],[a[0]+(c[0]-a[0])*u,y,a[1]+(c[1]-a[1])*u],.06,6);
      }
    }
    s.beam(p.ivory,[a[0],2.4,a[1]],[a[0],3.4,a[1]],.065,6);
  }
  for(const z of[-12,0,14]){
    const height=z===-12?25:29;s.cylinder(p.warm,0,2.4+height/2,z,.28,height,.12,14);
    s.beam(p.wood,[0,6,z],[0,6,z+10],.15,8);
    for(const side of[-1,1])for(const dz of[-2,0,2])s.beam(p.black,[side*5,2.8,z+dz],[0,height-3,z],.023,4);
    s.beam(p.cloth,[0,8,z],[0,height,z],.18,6);
    if(z!==14)s.beam(p.black,[0,height+2.4,z],[0,height-2,z+16],.026,4);
  }
  s.beam(p.wood,[0,3.1,21],[0,6.5,33],.19,10);s.beam(p.black,[0,6.5,33],[0,28,12],.027,4);
  s.box(p.ivory,0,3.45,-20,5.4,2.1,6);s.box(p.roof,0,4.6,-20,5.8,.2,6.4);
  for(const x of[-1.6,1.6])s.box(p.glass,x,3.7,-16.95,1.2,.9,.08);
  s.box(p.wood,0,2.85,-5,4,.9,5);s.box(p.black,0,3.34,-5,4.2,.08,5.2);
  for(const side of[-1,1])for(const z of[-20,20]){mooring.beam(p.black,[220+side*5,2.8,656+z],[194,.5,656+z],.05,5);}
  // The port rail opening and ramp occupy the same supported walking corridor.
  gangway.face(p.warm,[[200,.35,644.6],[216,2.4,644.6],[216,2.4,647.4],[200,.35,647.4]]);
  for(const z of[644.6,647.4]){gangway.beam(p.ivory,[200,1.35,z],[216,3.4,z],.055,6);for(const x of[200,204,208,212,216]){const y=.35+(x-200)/16*2.05;gangway.beam(p.ivory,[x,y,z],[x,y+1,z],.05,6);}}
  for(let x=201;x<216;x++)gangway.box(p.wood,x,.36+(x-200)/16*2.05,646,.08,.045,2.8);
  for(const x of[185.3,190.7])b.box(p.wood,x,1.4,614,.13,2.1,.13);
  const signs=[];
  for(const [label,x,y,z] of [['MARINE STORES',155,4.6,459],['FREIGHT OFFICE',155,4.6,525],['LUMBER WHARF',188,2,614]] as const){
    const texture=new DynamicTexture(`harbor-sign-${label}`,{width:512,height:128},scene,false),context=texture.getContext() as CanvasRenderingContext2D;
    context.fillStyle='#dfd1ae';context.fillRect(0,0,512,128);context.strokeStyle='#574937';context.lineWidth=8;context.strokeRect(8,8,496,112);context.fillStyle='#473e30';context.font='bold 45px Georgia';context.textAlign='center';context.fillText(label,256,81);texture.update();
    const material=new StandardMaterial(`painted-${label}`,scene);material.diffuseTexture=texture;material.specularColor=Color3.Black();material.backFaceCulling=true;
    const sign=MeshBuilder.CreatePlane(`harbor-signboard-${label}`,{width:6,height:1.5},scene);sign.position.set(x,y,z);sign.rotation.y=0;sign.material=material;sign.isPickable=false;signs.push(sign);
  }
  const shipMeshes=s.finish(shipRoot),sails=canvas.finish(shipRoot),berthMeshes=[...mooring.finish(),...gangway.finish()];
  const distant=[];for(const [i,x,z,yaw] of [[0,430,655,.3],[1,530,655,-.4],[2,-40,760,.2]] as const){const root=new TransformNode(`anchored-schooner-${i}`,scene);root.position.set(x,0,z);root.rotation.y=yaw;root.scaling.setAll(.65+i*.08);for(const mesh of shipMeshes){const clone=mesh.clone(`anchored-${i}-${mesh.name}`,root);if(clone){clone.isPickable=false;distant.push(clone);}}}
  for(const mesh of sails)mesh.setEnabled(false);
  const meshes=[...signs,...b.finish(),...shipMeshes,...sails,...berthMeshes,...distant,bay];for(const mesh of meshes)mesh.receiveShadows=true;
  return{meshes,update(x:number,z:number,yaw:number,docked:boolean){shipRoot.position.set(x,0,z);shipRoot.rotation.y=yaw;for(const mesh of berthMeshes)mesh.setEnabled(docked);for(const mesh of sails)mesh.setEnabled(!docked);}};
}
