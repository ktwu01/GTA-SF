import { createHistoricalScene } from '../src/historical-sf/scene';
import { routeTo,distanceBetween,type StreetPoint } from '../src/historical-sf/navigation';
import { freightPickup,freightDrop,shipHelm } from '../src/historical-sf/harbor-work';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import '../src/historical-sf/hud.css';
const canvas=document.querySelector<HTMLCanvasElement>('#street')!,status=document.querySelector('#qa-status')!,world=createHistoricalScene(canvas,()=>{});
world.setMuted(true);world.setAmbient(false);world.enter();
const visual=new URLSearchParams(location.search).has('visual'),events:unknown[]=[],errors:string[]=[];
window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
let stage='cargo',route:StreetPoint[]=[],index=1,previous={x:155,z:528},stuck=0,sailingStart=0,turnStart=0,finished=false,view='cargo',viewStart=performance.now(),frames:number[]=[],samples:Record<string,unknown>={};
const stats=()=>{const sorted=[...frames].sort((a,b)=>a-b);return{frames:frames.length,p50Ms:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1),viewport:{width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio}};};
function selectView(name:string,position:Vector3,target:Vector3){if(frames.length)samples[view]=stats();view=name;frames=[];viewStart=performance.now();world.setPaused(true);world.camera.position.copyFrom(position);world.camera.setTarget(target);world.setHudVisible(false);}
if(visual){
 const views:[string,Vector3,Vector3][]=[['Roofs east',new Vector3(365,39,505),new Vector3(213,8,490)],['Roofs west',new Vector3(101,37,505),new Vector3(247,8,490)],['Roofs north',new Vector3(222,43,640),new Vector3(222,8,475)],['Roofs south',new Vector3(222,43,365),new Vector3(222,8,505)],['Market',new Vector3(1.4,1.92,350),new Vector3(0,10,530)],['Working quay',new Vector3(194,2.19,590),new Vector3(220,12,656)],['Deck sea',new Vector3(217,4.24,665),new Vector3(220,7,695)],['Deck shore',new Vector3(217,4.24,655),new Vector3(140,8,565)]];
 for(const [name,position,target] of views){const button=document.createElement('button');button.textContent=name;button.onclick=()=>selectView(name,position,target);document.querySelector('#qa-views')!.append(button);}selectView(...views[0]);
}else{world.camera.position.set(155,1.84,528);world.board();route=routeTo(world.camera.position,freightDrop);world.selectDestination('cargo-wharf');}
function beginWalk(target:StreetPoint){route=routeTo(world.camera.position,target);index=1;stuck=0;}
world.scene.onAfterRenderObservable.add(()=>{
 const s=world.snapshot(),p=world.camera.position;
 if(performance.now()-viewStart>3000)frames.push(world.engine.getDeltaTime());
 if(!visual&&!finished){
  if(stage==='cargo'||stage==='helm'||stage==='disembark'){
   if(!route.length){events.push({error:'No route',stage});finished=true;}
   else{
    if(route[index]&&distanceBetween(p,route[index])<.65)index++;
    if(index>=route.length){world.touch(0,0);if(stage==='cargo'){
      const result=world.board();events.push({stage,success:result,cargo:world.snapshot().cargo});
      if(world.snapshot().cargo.delivered===3){stage='helm';beginWalk(shipHelm);}
      else beginWalk(world.snapshot().cargo.carrying?freightDrop:freightPickup);
    }else if(stage==='helm'){events.push({stage,success:world.board(),sailing:world.snapshot().sailing});events.push({stage:'early-return',success:world.board(),sailing:world.snapshot().sailing});stage='depart';sailingStart=s.elapsed;}
    else{events.push({stage,camera:s.camera});finished=true;world.touch(0,0);world.setPaused(true);}}
    else{const target=route[index];p.y=1.84+(p.z>=560?.35:0);world.camera.rotation.y=Math.atan2(target.x-p.x,target.z-p.z);world.camera.rotation.x=.04;world.touch(1,0,true);stuck=distanceBetween(p,previous)<.0001?stuck+1:0;if(stuck>450){events.push({error:'Blocked',stage,camera:s.camera,target});finished=true;world.touch(0,0);}}
   }
  }else if(stage==='depart'){
   world.touch(1,0);if(s.sailing.phase==='sailing'){events.push({stage,sailing:s.sailing});stage='turn';turnStart=s.elapsed;}
  }else if(stage==='turn'){
   world.touch(1,.4);if(s.elapsed-turnStart>12){events.push({stage,sailing:s.sailing});world.board();stage='return';}
  }else if(stage==='return'){
   if(s.sailing.phase==='moored'){events.push({stage,sailing:s.sailing,mode:s.mode});stage='disembark';beginWalk({x:194,z:622});}
  }
  if(s.elapsed-sailingStart>210&&['depart','turn','return'].includes(stage)){events.push({error:'Sailing timeout',stage,sailing:s.sailing});finished=true;world.touch(0,0);}
  previous={x:p.x,z:p.z};
 }
 status.textContent=JSON.stringify({visual,finished,stage,events,errors,cargo:s.cargo,sailing:s.sailing,camera:s.camera,view,performance:{...samples,[view]:stats()},crowd:{count:s.crowd.count,moving:s.crowd.moving},mode:s.mode},null,2);
});
