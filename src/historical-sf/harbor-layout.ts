import type { Block, StreetPoint } from './navigation.ts';

export const harborZones:Block[]=[
  {x:222.5,z:465,width:256,depth:190,label:'EAST STREET'},
  {x:227.5,z:585,width:245,depth:51,label:'QUAY'},
  {x:194,z:652,width:16,depth:84,label:'TIMBER WHARF'},
  {x:208,z:646,width:16,depth:2.8,label:'GANGWAY'},
];
export const harborCargo:Block[]=Array.from({length:26},(_,i)=>({x:140+(i%7)*28,z:i<14?538:574,width:1.4,depth:1.4,label:'CARGO'})).filter(b=>!(b.x>238&&b.x<307&&b.z>570));
export const harborBlocks:Block[]=[
  {x:155,z:427,width:46,depth:62,label:'CHANDLER'},
  {x:235,z:427,width:48,depth:62,label:'STORES'},
  {x:316,z:427,width:44,depth:62,label:'WAREHOUSE'},
  {x:155,z:505,width:46,depth:38,label:'FREIGHT OFFICE'},
  {x:235,z:505,width:48,depth:38,label:'LUMBER YARD'},
  {x:316,z:505,width:44,depth:38,label:'WAREHOUSE'},
  {x:273,z:588,width:62,depth:28,label:'WHARF SHED'},
  {x:188,z:614,width:6,depth:.3,label:'WHARF SIGN'},
  {x:194,z:677,width:6,depth:8,label:'LUMBER'},
  {x:220,z:651,width:4,depth:5,label:'HATCH'},
  {x:220,z:636,width:5.4,depth:6,label:'DECKHOUSE'},
  ...harborCargo,
  ...[644,656,670].map(z=>({x:220,z,width:1.2,depth:1.2,label:'MAST'})),
];
const inBox=(p:StreetPoint,b:Block,margin=0)=>Math.abs(p.x-b.x)<=b.width/2-margin&&Math.abs(p.z-b.z)<=b.depth/2-margin;
export function onShip(p:StreetPoint){
  const z=p.z-656;
  const halfWidth=Math.abs(z)<16?5.0:5.0*(1-(Math.abs(z)-16)/8.5);
  return Math.abs(z)<=23&&Math.abs(p.x-220)<=halfWidth;
}
export function harborWalkable(p:StreetPoint){
  return (harborZones.some((b,i)=>inBox(p,b,i<2?0:.32))||onShip(p))&&!harborBlocks.some(b=>inBox(p,{...b,width:b.width+.64,depth:b.depth+.64}));
}
export function harborHeight(p:StreetPoint){
  if(onShip(p))return 2.4;
  if(p.x>=200&&p.x<=216&&Math.abs(p.z-646)<=1.4)return .35+(p.x-200)/16*2.05;
  return p.z>=560?.35:0;
}
export function supportedPoint(p:StreetPoint){
  if(p.x>=95)return harborWalkable(p);
  return p.z>=336&&p.z<=564&&Math.abs(p.x)<=95&&(p.z>=534||Math.abs(p.x)<=17.4);
}
export function constrainHarbor(previous:StreetPoint,desired:StreetPoint){
  let p={...previous};const steps=Math.max(1,Math.ceil(Math.hypot(desired.x-p.x,desired.z-p.z)/.12));
  const dx=(desired.x-p.x)/steps,dz=(desired.z-p.z)/steps;
  for(let i=0;i<steps;i++){
    const next={x:p.x+dx,z:p.z+dz};
    if(supportedPoint(next))p=next;
    else{const sideways={x:p.x+dx,z:p.z};if(supportedPoint(sideways))p=sideways;const forward={x:p.x,z:p.z+dz};if(supportedPoint(forward))p=forward;}
  }
  return p;
}
export const harborRouteNodes:StreetPoint[]=[
  {x:90,z:550},{x:119,z:550},{x:119,z:475},{x:119,z:380},
  {x:194,z:380},{x:276,z:380},{x:345,z:380},
  {x:194,z:475},{x:276,z:475},{x:345,z:475},
  {x:194,z:550},{x:276,z:550},{x:345,z:550},
  {x:119,z:590},{x:194,z:590},{x:232,z:590},{x:315,z:590},{x:345,z:590},
  {x:232,z:606},{x:315,z:606},
  {x:194,z:620},{x:194,z:646},{x:200,z:646},{x:215.5,z:646},{x:217,z:646},
  {x:217,z:655},{x:224,z:655},{x:217,z:663},{x:224,z:663},{x:217,z:631},
];
export function clearHarborSegment(a:StreetPoint,b:StreetPoint){
  const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.4));
  for(let i=0;i<=steps;i++){const t=i/steps;if(!supportedPoint({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}))return false;}
  return true;
}
const edgeCache=new Map<string,boolean>();
export function harborRoute(from:StreetPoint,to:StreetPoint):StreetPoint[]{
  const nodes=[{x:from.x,z:from.z},...harborRouteNodes,{x:to.x,z:to.z}],last=nodes.length-1;
  const distances=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Set<number>();distances[0]=0;
  while(visited.size<nodes.length){
    let current=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(current<0||distances[i]<distances[current]))current=i;
    if(current<0||!Number.isFinite(distances[current]))break;if(current===last)break;visited.add(current);
    for(let i=0;i<nodes.length;i++)if(!visited.has(i)){
      const key=`${Math.min(current,i)}:${Math.max(current,i)}`;
      let clear=current>0&&current<last&&i>0&&i<last?edgeCache.get(key):undefined;
      if(clear===undefined){clear=clearHarborSegment(nodes[current],nodes[i]);if(current>0&&current<last&&i>0&&i<last)edgeCache.set(key,clear);}
      if(!clear)continue;
      const distance=distances[current]+Math.hypot(nodes[current].x-nodes[i].x,nodes[current].z-nodes[i].z);
      if(distance<distances[i]){distances[i]=distance;previous[i]=current;}
    }
  }
  if(!Number.isFinite(distances[last]))return [];
  const route:StreetPoint[]=[];for(let i=last;i>=0;i=previous[i]){route.unshift(nodes[i]);if(i===0)break;}return route;
}
