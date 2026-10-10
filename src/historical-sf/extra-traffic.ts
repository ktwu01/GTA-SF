import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { TrafficMarker } from './crowd';

export function addTerminalTraffic(scene:Scene,template:Mesh[]){
  const roots=[55,160].map(offset=>new TransformNode(`additional-terminal-car-${offset}`,scene));
  const meshes=roots.flatMap(root=>template.map(mesh=>mesh.clone(`${root.name}-${mesh.name}`,root)!));
  roots.forEach(root=>root.rotation.y=Math.PI);
  const markers:TrafficMarker[]=roots.map(()=>({x:-3.15,z:340,kind:'tram',speed:1.75,direction:-1}));
  return{meshes,update(base:TrafficMarker){roots.forEach((root,i)=>{const z=340+((base.z-340+[55,160][i])%220);root.position.set(-3.15,.03,z);markers[i].z=z;markers[i].speed=base.speed;});},traffic(){return markers;}};
}
