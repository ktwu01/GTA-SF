import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Scene } from '@babylonjs/core/scene';
import { Masonry } from './geometry';
import { harborCargo } from './harbor-layout';
import { random, type Palette } from './materials';

export function addStreetWear(scene:Scene,p:Palette){
  const b=new Masonry(scene,'street-wear-and-commerce'),rng=random(190608);
  const dirt=new StandardMaterial('road-dust-and-track-grime',scene);dirt.diffuseColor=Color3.FromHexString('#625c48');dirt.specularColor=Color3.Black();dirt.alpha=.28;
  const wet=dirt.clone('damp-road-patches');wet.diffuseColor=Color3.FromHexString('#4d5148');wet.alpha=.22;wet.specularColor=new Color3(.12,.12,.1);
  for(let i=0;i<340;i++){
    const harbor=i>=200,x=harbor?100+rng()*247:(rng()-.5)*28,z=harbor?375+rng()*180:339+rng()*222;
    const rx=.2+rng()*1.5,rz=.4+rng()*2.3,points:[number,number,number][]=[];
    for(let j=0;j<9;j++){const a=-j/9*Math.PI*2,r=.65+rng()*.35;points.push([x+Math.cos(a)*rx*r,.014,z+Math.sin(a)*rz*r]);}
    b.face(i%4===0?wet:dirt,points);
  }
  for(const side of[-1,1])for(let z=340;z<532;z+=3.7){
    b.box(dirt,side*(13.85+rng()*.16),.016,z,.18,.008,2.8+rng());
    for(const x of[side*9.6,side*10.35])if(rng()>.3)b.box(dirt,x,.019,z,.075,.006,2.1+rng()*1.7);
  }
  for(const [side,z] of [[-1,355],[1,378],[-1,412],[1,448],[-1,484],[1,515]]){
    const x=side*18.35;
    b.box(p.wood,x,.72,z,.9,.16,1.7);
    for(const dz of[-.6,.6])for(const dx of[-.43,.43]){
      b.cylinder(p.black,x+dx,.39,z+dz,.05,.08,.05,8);
      b.ellipsoid(p.black,x+dx,.39,z+dz,.055,.34,.34,false,12);
      b.ellipsoid(p.wood,x+dx+side*.01,.39,z+dz,.06,.27,.27,false,12);
    }
    for(let k=0;k<4;k++)b.ellipsoid(p.cloth,x+(k%2-.5)*.37,.96+Math.floor(k/2)*.18,z+(k%2-.5)*.4,.23,.19,.32,false,10);
    b.beam(p.wood,[x,.74,z+.7],[x,.95,z+1.6],.035);
  }
  for(const [i,cargo] of harborCargo.entries())if(i%3===0){
    const {x,z}=cargo;b.ellipsoid(p.cloth,x,.9,z,.48,.6,.48,false,12);
    for(const y of[.45,1.25])b.box(p.black,x,y,z-.71,1.4,.045,.02);
  }
  return b.finish();
}
