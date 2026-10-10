import test from 'node:test';
import assert from 'node:assert/strict';
import { createCargoJob, freightPickup,freightDrop,mooredSchooner,advanceSchooner } from '../src/historical-sf/harbor-work.ts';
import { harborRoute,onShip,setHarborDocked } from '../src/historical-sf/harbor-layout.ts';

test('cargo requires three actual pickup/delivery cycles and rejects duplicate and remote actions',()=>{
 const job=createCargoJob();assert.equal(job.action(freightDrop),null);
 for(let i=0;i<3;i++){
  assert.equal(job.action(freightPickup),'picked-up');assert.equal(job.snapshot().carrying,true);
  assert.equal(job.action(freightPickup),null);assert.equal(job.action({x:0,z:0}),null);
  assert.equal(job.action(freightDrop),i===2?'complete':'delivered');assert.equal(job.action(freightDrop),null);
 }
 assert.equal(job.snapshot().completed,1);assert.equal(job.snapshot().delivered,3);
 assert.equal(job.action(freightPickup),'picked-up');assert.equal(job.snapshot().delivered,0);
 job.reset();assert.equal(job.snapshot().completed,0);assert.equal(job.snapshot().carrying,false);
});
test('departure clears pier before steering, pause does not move, return aligns and docks',()=>{
 let s={...mooredSchooner(),phase:'departing' as const};let state:ReturnType<typeof mooredSchooner>=s;
 for(let i=0;i<2000&&state.phase==='departing';i++){state=advanceSchooner(state,.05,1,1);assert.equal(state.yaw,0);}
 assert.equal(state.phase,'sailing');assert.ok(state.z>=745);
 const paused=advanceSchooner(state,0,1,1);assert.deepEqual(paused,state);
 for(let i=0;i<400;i++)state=advanceSchooner(state,.05,1,.4);
 state={...state,phase:'returning'};
 for(let i=0;i<6000&&state.phase!=='moored';i++)state=advanceSchooner(state,.05,0,0);
 assert.equal(state.phase,'moored');assert.equal(state.x,220);assert.equal(state.z,656);assert.equal(state.yaw,0);assert.equal(state.speed,0);
 assert.ok(state.distance>180);
});
test('sailing envelope leaves room for the entire hull and bowsprit',()=>{
 let state={...mooredSchooner(),phase:'sailing' as const,x:499,z:1024,yaw:.7,speed:4.5};
 for(let i=0;i<1000;i++)state=advanceSchooner(state,.05,1,0) as typeof state;
 assert.ok(state.x+34<=565);assert.ok(state.z+34<=1110);assert.ok(state.z-34>694);
});
test('underway berth has no phantom deck, gangway, or cached walking route',()=>{
 const start={x:194,z:622},deck={x:217,z:655};
 assert.ok(harborRoute(start,deck).length);setHarborDocked(false);
 assert.equal(onShip(deck),false);assert.equal(harborRoute(start,deck).length,0);
 setHarborDocked(true);assert.ok(harborRoute(start,deck).length);
 assert.ok(harborRoute(freightPickup,freightDrop).length);
});
