import { harborBlocks, harborRoute } from './harbor-layout.ts';
export type StreetPoint={x:number;z:number};
export type Block={x:number;z:number;width:number;depth:number;label?:string};
export const FERRY_BEARING=45;
export const streetBlocks:Block[]=[
  ...harborBlocks,
  ...[320,359,397].map(z=>({x:-31,z,width:26,depth:33})),
  ...[321,360,398,438,474].map(z=>({x:32,z,width:27,depth:30})),
  {x:-37,z:442,width:37,depth:39},{x:-28,z:486,width:19,depth:24},
  {x:-37.3,z:521,width:38,depth:21,label:'COFFEE'},
  {x:31.3,z:518,width:26,depth:29,label:'TICKETS'},
  {x:41,z:490,width:24,depth:31},
  {x:0,z:590,width:201.2,depth:45.7,label:'FERRY BUILDING'},
];
export const destinations=[
  {id:'harbor',name:'East Street wharves',x:194,z:590,detail:'Cargo sheds beside the bay',icon:'⚓'},
  {id:'ship',name:'Lumber schooner',x:217,z:655,detail:'Cross the gangway and explore the deck',icon:'⚓'},
  {id:'cargo-wharf',name:'Parcel delivery',x:194,z:622,detail:'Timber wharf freight landing',icon:'◇'},
  {id:'freight',name:'Freight office',x:155,z:528,detail:'Work along the waterfront',icon:'◇'},
  {id:'chandler',name:'Ship chandler',x:155,z:462,detail:'Rope, canvas and marine stores',icon:'◇'},
  {id:'ferry',name:'Ferry Building',x:0,z:552,detail:'The waterfront clock tower',icon:'◷'},
  {id:'tickets',name:'Ticket office',x:16.5,z:527,detail:'Bays, tickets & painted signs',icon:'◇'},
  {id:'coffee',name:'Coffee house',x:-16.5,z:527,detail:'Coffee before the crossing',icon:'☕'},
  {id:'arcade',name:'Ferry arcade',x:35.6,z:561,detail:'Beneath the sandstone arches',icon:'∩'},
] as const;
export type DestinationId=typeof destinations[number]['id'];
export function bearingFromYaw(yaw:number){return((yaw*180/Math.PI+FERRY_BEARING)%360+360)%360;}
export function cardinalFromYaw(yaw:number){return['N','NE','E','SE','S','SW','W','NW'][Math.round(bearingFromYaw(yaw)/45)%8];}
export function distanceBetween(a:StreetPoint,b:StreetPoint){return Math.hypot(a.x-b.x,a.z-b.z);}
export function worldToRadar(point:StreetPoint,origin:StreetPoint,yaw:number,scale=1,radius=Infinity){
  const dx=point.x-origin.x,dz=point.z-origin.z;
  let x=(Math.cos(yaw)*dx-Math.sin(yaw)*dz)*scale,y=-(Math.sin(yaw)*dx+Math.cos(yaw)*dz)*scale;
  const distance=Math.hypot(x,y),clamped=distance>radius;
  if(clamped){x*=radius/distance;y*=radius/distance;}
  return{x,y,clamped};
}
function marketRoute(from:StreetPoint,to:StreetPoint):StreetPoint[]{
  const route:StreetPoint[]=[{x:from.x,z:from.z}];
  if(from.z>564)route.push({x:from.x,z:561});
  if(from.z>=534&&Math.abs(from.x)>17.4&&to.z<534)route.push({x:Math.sign(to.x||from.x)*15.8,z:538});
  if(from.z<534&&to.z>=534){const side=Math.sign(from.x||to.x||1);route.push({x:side*15.8,z:from.z},{x:side*15.8,z:538});}
  if(from.z<534&&to.z<534&&Math.abs(from.z-to.z)>20)route.push({x:Math.sign(to.x||from.x||1)*15.8,z:from.z});
  route.push({x:to.x,z:to.z});return route;
}
export function routeDistance(route:StreetPoint[]){return route.slice(1).reduce((sum,p,i)=>sum+distanceBetween(route[i],p),0);}
/** Ground-level sight lines use the same facade footprints as the minimap. */
export function segmentHitsBlock(from:StreetPoint,to:StreetPoint,block:Block){
  let low=0,high=1;
  for(const axis of ['x','z'] as const){
    const half=(axis==='x'?block.width:block.depth)/2,delta=to[axis]-from[axis],min=block[axis]-half,max=block[axis]+half;
    if(Math.abs(delta)<1e-8){if(from[axis]<min||from[axis]>max)return false;}
    else{const a=(min-from[axis])/delta,b=(max-from[axis])/delta;low=Math.max(low,Math.min(a,b));high=Math.min(high,Math.max(a,b));if(low>high)return false;}
  }
  return high>.03&&low<.97;
}

export function routeTo(from:StreetPoint,to:StreetPoint):StreetPoint[]{
  if(from.x<95&&to.x<95)return marketRoute(from,to);
  const gateway={x:90,z:550};
  if(from.x<95){const tail=harborRoute(gateway,to);return tail.length?[...marketRoute(from,gateway).slice(0,-1),...tail]:[];}
  if(to.x<95){const head=harborRoute(from,gateway);return head.length?[...head.slice(0,-1),...marketRoute(gateway,to)]:[];}
  return harborRoute(from,to);
}
