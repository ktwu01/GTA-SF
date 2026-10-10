import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Masonry } from './geometry';
import type { Palette } from './materials';
import type { TrafficMarker } from './crowd';
import { exteriorSeats } from './street-activity';

export function createExteriorRiders(scene:Scene,p:Palette){
  const roots=[0,1,2,3,4].map(i=>new TransformNode(`platform-passengers-${i}`,scene));
  const meshes=roots.flatMap((root,i)=>{
    const b=new Masonry(scene,`platform-riders-${i}`);
    for(const [j,seat] of exteriorSeats.entries()){
      const {x,y,z,grip}=seat,coat=[p.coat,p.navy,p.green][(i+j)%3];
      b.ellipsoid(coat,x,y+1.05,z,.21,.34,.14,false,12);
      b.ellipsoid(p.skin,x,y+1.55,z,.115,.16,.105,false,12);
      const facing=z>0?1:-1;
      b.ellipsoid(p.mane,x,y+1.64,z-facing*.035,.115,.09,.105,false,12);
      b.ellipsoid(p.skin,x,y+1.53,z+facing*.11,.025,.037,.03,false,8);
      for(const eye of[-1,1])b.ellipsoid(p.black,x+eye*.04,y+1.58,z+facing*.10,.009,.009,.008,false,6);
      b.face(p.ivory,[[x-.09,y+1.31,z+.145],[x,y+1.03,z+.16],[x+.09,y+1.31,z+.145]]);
      b.cylinder(p.black,x,y+1.71,z,.19,.035,.19,16);b.ellipsoid(p.black,x,y+1.74,z,.13,.10,.12,true,12);
      for(const side of[-1,1]){
        b.beam(coat,[x+side*.11,y+.86,z],[x+side*.13,y+.48,z+.06],.08,8);
        b.beam(coat,[x+side*.13,y+.48,z+.06],[x+side*.12,y+.08,z],.065,8);
        b.ellipsoid(p.black,x+side*.12,y+.055,z+.07,.08,.06,.14,false,10);
        const holding=side===grip,handX=holding?Math.sign(x)*1.16:x+side*.24,handY=holding?1.85:y+.65,handZ=holding?Math.sign(z)*3.61:z+.13;
        const elbow:[number,number,number]=[x+side*.28,y+.96,z+.18];
        b.beam(coat,[x+side*.21,y+1.22,z],elbow,.065,8);
        b.beam(coat,elbow,[handX,handY,handZ],.055,8);
        b.ellipsoid(p.skin,handX,handY,handZ,.045,.055,.04,false,8);
      }
    }
    for(const side of[-1,1])b.box(p.wood,side*1.29,.43,side*3.38,.45,.09,.65);
    return b.finish(root);
  });
  return{meshes,update(vehicles:TrafficMarker[]){vehicles.filter(v=>v.kind==='tram').slice(0,5).forEach((v,i)=>{roots[i].position.set(v.x,.03,v.z);roots[i].rotation.y=v.direction<0?Math.PI:0;});},snapshot(){return{count:30,placement:'platforms and steps',source:'SFMTA U00541, 1905-08-22'};}};
}
