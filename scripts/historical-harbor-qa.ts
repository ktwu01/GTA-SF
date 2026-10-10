import { createHistoricalScene } from '../src/historical-sf/scene';
import { destinations, routeTo, distanceBetween, type StreetPoint } from '../src/historical-sf/navigation';
import '../src/historical-sf/hud.css';

const canvas=document.querySelector<HTMLCanvasElement>('#street')!,status=document.querySelector('#qa-status')!;
const world=createHistoricalScene(canvas,()=>{});world.setMuted(true);world.enter();
const goals=['ship','freight','chandler','ferry'] as const;
let goalIndex=0,waypointIndex=1,route=routeTo(world.camera.position,destinations.find(d=>d.id===goals[0])!),stuck=0,last:StreetPoint={x:world.camera.position.x,z:world.camera.position.z};
const activity:Record<string,number>={maxMoving:0,maxRunning:0,maxHopping:0,maxYielding:0};
const events:unknown[]=[],frames:Record<string,number[]>={},start=performance.now();
let finished=false;
world.selectDestination(goals[0]);
world.scene.onAfterRenderObservable.add(()=>{
  const snapshot=world.snapshot();
  activity.maxMoving=Math.max(activity.maxMoving,snapshot.crowd.moving);activity.maxRunning=Math.max(activity.maxRunning,snapshot.crowd.running);activity.maxHopping=Math.max(activity.maxHopping,snapshot.crowd.hopping);activity.maxYielding=Math.max(activity.maxYielding,snapshot.crowd.yielding);
  const position=world.camera.position,goal=goals[goalIndex];
  if(!finished){
    const sample=world.engine.getDeltaTime();if(performance.now()-start>3000)(frames[snapshot.place]??=[]).push(sample);
    if(route[waypointIndex]&&distanceBetween(position,route[waypointIndex])<(waypointIndex===route.length-1?.4:.85))waypointIndex++;
    if(route.length&&waypointIndex>=route.length&&snapshot.hud.route.arrived){
      world.touch(0,0);events.push({goal,camera:snapshot.camera,arrived:snapshot.hud.route.arrived,elapsed:performance.now()-start});
      if(++goalIndex===goals.length){finished=true;world.touch(0,0);world.setPaused(true);}
      else{const destination=destinations.find(d=>d.id===goals[goalIndex])!;world.selectDestination(destination.id);route=routeTo(position,destination);waypointIndex=1;}
    }
    if(!finished){
      if(!route.length){events.push({error:'No route',goal});finished=true;world.touch(0,0);}
      else{
        const target=route[Math.min(waypointIndex,route.length-1)];world.camera.rotation.y=Math.atan2(target.x-position.x,target.z-position.z);world.camera.rotation.x=.02;world.touch(1,0,true);
        stuck=distanceBetween(position,last)<.0001?stuck+1:0;
        if(stuck>300){events.push({error:'Blocked walk',goal,camera:snapshot.camera,target});finished=true;world.touch(0,0);world.setPaused(true);}
      }
    }
    last={x:position.x,z:position.z};
  }
  const performanceSummary=Object.fromEntries(Object.entries(frames).map(([place,values])=>{const sorted=[...values].sort((a,b)=>a-b);return[place,{frames:values.length,meanMs:values.reduce((a,b)=>a+b,0)/values.length,p95Ms:sorted[Math.floor(sorted.length*.95)]}];}));
  status.textContent=JSON.stringify({finished,goal:goals[goalIndex]??'complete',elapsedSeconds:Math.round((performance.now()-start)/1000),camera:snapshot.camera,events,activity,crowdCount:snapshot.crowd.count,riders:snapshot.exteriorRiders,performance:performanceSummary},null,2);
});
