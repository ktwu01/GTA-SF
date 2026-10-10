import test from 'node:test';
import assert from 'node:assert/strict';
import { pedestrianPace,advanceRailHop,groundedRailHop,exteriorSeats } from '../src/historical-sf/street-activity.ts';
import { readFileSync } from 'node:fs';

test('rail hops land after crossing or stopping and never hover along a track',()=>{
  let hop=groundedRailHop(),peak=0;
  for(let i=0;i<100;i++){hop=advanceRailHop(hop,.02,{x:2.6+Math.min(i,20)*.052,z:400},i<20?2.6:0,i<20,'run');peak=Math.max(peak,hop.height);}
  assert.ok(peak>.2&&peak<.3);assert.equal(hop.height,0);assert.equal(hop.velocity,0);
  for(let i=0;i<100;i++)assert.equal(advanceRailHop(groundedRailHop(),.02,{x:3.15,z:400+i*.05},0,true,'run').height,0);
  for(const [moving,pace,z] of [[false,'run',400],[true,'walk',400],[true,'run',550]] as const)assert.equal(advanceRailHop(groundedRailHop(),.02,{x:3.15,z},2.6,moving,pace).height,0);
  for(let id=0;id<100;id++){assert.notEqual(pedestrianPace(id,2),'run');assert.notEqual(pedestrianPace(id,5),'run');}
});
test('external passenger placements occupy platforms or added steps, never roof or saloon',()=>{
  for(const seat of exteriorSeats){assert.ok(Math.abs(seat.z)>=3.1&&Math.abs(seat.z)<=3.6);assert.ok(seat.y>=.46&&seat.y<=.8);assert.ok(Math.abs(seat.x)<1.5);}
});
test('every modeled building records fact-level provenance and unknown historical dimensions',()=>{
  const ledger=JSON.parse(readFileSync('data/historical-sf/buildings.json','utf8'));
  assert.equal(ledger.buildings.length,22);assert.equal(new Set(ledger.buildings.map((b:any)=>b.id)).size,22);
  for(const b of ledger.buildings)for(const field of['footprint','height','facadeMaterial','occupant']){
    const fact=b.facts[field];assert.ok(fact.rendered.source);assert.ok(fact.historical.confidence);assert.ok('value' in fact.historical);
    if(fact.historical.value===null)assert.equal(fact.historical.confidence,'unknown');
    else assert.ok(fact.historical.source&&fact.historical.locator);
  }
});
