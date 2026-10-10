import type { TrafficMarker } from './crowd.ts';
import type { StreetPoint } from './navigation.ts';

type Bounds={left:number;right:number;back:number;front:number};
export function vehicleBounds(vehicle:TrafficMarker,radius=.3):Bounds {
  const wagon=vehicle.kind==='wagon',center=vehicle.z+(wagon?1.1*vehicle.direction:0);
  const width=(wagon?1.12:1.34)+radius,depth=(wagon?3.25:4.18)+radius;
  return{left:vehicle.x-width,right:vehicle.x+width,back:center-depth,front:center+depth};
}
const inside=(point:StreetPoint,b:Bounds)=>point.x>b.left&&point.x<b.right&&point.z>b.back&&point.z<b.front;
export function separateTraffic(point:StreetPoint,previous:StreetPoint,vehicles:TrafficMarker[],radius=.3):StreetPoint {
  const result={x:point.x,z:point.z};
  for(let pass=0;pass<4;pass++){
    let changed=false;
    for(const vehicle of vehicles){
      const b=vehicleBounds(vehicle,radius);if(!inside(result,b))continue;
      if(previous.x<=b.left)result.x=b.left;
      else if(previous.x>=b.right)result.x=b.right;
      else if(previous.z<=b.back)result.z=b.back;
      else if(previous.z>=b.front)result.z=b.front;
      else {
        // Moving traffic can envelop a stationary walker; clear its lane sideways.
        result.x=result.x<vehicle.x?b.left:b.right;
      }
      changed=true;
    }
    if(!changed)break;
  }
  return result;
}
export function moveStreetWalker(previous:StreetPoint,desired:StreetPoint,vehicles:TrafficMarker[],people:StreetPoint[]):StreetPoint {
  const dx=desired.x-previous.x,dz=desired.z-previous.z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));
  let position={x:previous.x,z:previous.z};
  for(let step=0;step<steps;step++){
    const last=position;position=separateTraffic({x:last.x+dx/steps,z:last.z+dz/steps},last,vehicles);
    for(const person of people){
      const x=position.x-person.x,z=position.z-person.z,distance=Math.hypot(x,z);
      if(distance>=.6)continue;
      const px=last.x-person.x,pz=last.z-person.z,prior=Math.hypot(px,pz);
      const nx=distance>.0001?x/distance:prior>.0001?px/prior:1,nz=distance>.0001?z/distance:prior>.0001?pz/prior:0;
      position={x:person.x+nx*.6,z:person.z+nz*.6};
    }
    position=separateTraffic(position,last,vehicles);
  }
  const clear=(p:StreetPoint)=>vehicles.every(v=>!inside(p,vehicleBounds(v)))&&people.every(n=>Math.hypot(p.x-n.x,p.z-n.z)>=.59999);
  if(!clear(position)){
    const candidates:StreetPoint[]=[];
    for(const person of people.filter(n=>Math.hypot(position.x-n.x,position.z-n.z)<1.3)){
      for(let i=0;i<32;i++){const angle=i*Math.PI/16;candidates.push({x:person.x+Math.cos(angle)*.601,z:person.z+Math.sin(angle)*.601});}
    }
    if(clear(previous))candidates.push(previous);
    const safe=candidates.filter(clear).sort((a,b)=>Math.hypot(a.x-position.x,a.z-position.z)-Math.hypot(b.x-position.x,b.z-position.z));
    if(safe.length)position=safe[0];
  }
  return position;
}
