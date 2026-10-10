import { distanceBetween,type StreetPoint } from './navigation.ts';
export const freightPickup={x:155,z:528},freightDrop={x:194,z:622},shipHelm={x:217,z:665};
export function createCargoJob(){
  let carrying=false,delivered=0,completed=0;
  return{action(point:StreetPoint){
    if(distanceBetween(point,carrying?freightDrop:freightPickup)>3)return null;
    if(carrying){carrying=false;delivered++;if(delivered===3)completed++;return delivered===3?'complete':'delivered';}
    if(delivered===3)delivered=0;carrying=true;return'picked-up';
  },prompt(point:StreetPoint){if(distanceBetween(point,carrying?freightDrop:freightPickup)>3)return null;return carrying?'Deliver parcel':delivered===3?'Start another cargo job':delivered===0?'Take cargo job':'Collect next parcel';},
  snapshot(){return{carrying,delivered,total:3,completed,goal:carrying?'cargo-wharf':'freight',label:delivered===3?'Cargo job complete':carrying?'Carry parcel to timber wharf':delivered===0?'Freight office: three parcels':'Collect next parcel'};},reset(){carrying=false;delivered=completed=0;}};
}
export type SailingState={phase:'moored'|'departing'|'sailing'|'returning'|'aligning'|'docking';x:number;z:number;yaw:number;speed:number;distance:number};
export function mooredSchooner():SailingState{return{phase:'moored',x:220,z:656,yaw:0,speed:0,distance:0};}
const angleDelta=(target:number,yaw:number)=>Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));
export function advanceSchooner(state:SailingState,dt:number,throttle:number,steering:number):SailingState{
  const s={...state};dt=Math.max(0,Math.min(dt,.05));if(s.phase==='moored')return s;
  if(s.phase==='departing'){s.yaw=0;s.speed=Math.min(4,s.speed+dt*.8);if(s.z>=745)s.phase='sailing';}
  else if(s.phase==='sailing'){s.speed=Math.max(0,Math.min(4.5,s.speed+dt*(throttle>0?.7:throttle<0?-1.7:-.12)));s.yaw+=steering*dt*.45*Math.min(1,s.speed/2);}
  else if(s.phase==='returning'){
    const dx=220-s.x,dz=745-s.z;if(Math.hypot(dx,dz)<2){s.phase='aligning';s.speed=0;}
    else{s.yaw+=Math.max(-dt*.65,Math.min(dt*.65,angleDelta(Math.atan2(dx,dz),s.yaw)));s.speed=Math.abs(angleDelta(Math.atan2(dx,dz),s.yaw))<.45?Math.min(4,Math.hypot(dx,dz)*.8):0;}
  }else if(s.phase==='aligning'){s.speed=0;s.yaw+=Math.max(-dt*.65,Math.min(dt*.65,angleDelta(0,s.yaw)));if(Math.abs(angleDelta(0,s.yaw))<.02){s.x=220;s.z=745;s.yaw=0;s.phase='docking';}}
  else if(s.phase==='docking'){s.speed=-3;s.yaw=0;if(s.z<=656.1)return{...mooredSchooner(),distance:s.distance};}
  const old={x:s.x,z:s.z};s.x+=Math.sin(s.yaw)*s.speed*dt;s.z+=Math.cos(s.yaw)*s.speed*dt;
  if(s.phase==='sailing'||s.phase==='returning'){s.x=Math.max(160,Math.min(500,s.x));s.z=Math.max(735,Math.min(1025,s.z));}
  s.distance+=Math.hypot(s.x-old.x,s.z-old.z);return s;
}
