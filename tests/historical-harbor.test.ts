import assert from 'node:assert/strict';
import test from 'node:test';
import { destinations, routeTo, segmentHitsBlock } from '../src/historical-sf/navigation.ts';
import { clearHarborSegment, constrainHarbor, harborBlocks, harborHeight, harborWalkable, onShip } from '../src/historical-sf/harbor-layout.ts';

test('all harbor destinations route both ways through supported surfaces without crossing cargo or buildings',()=>{
  const starts=[{x:90,z:550},{x:119,z:427},{x:194,z:590},{x:217,z:655},{x:345,z:475}];
  for(const start of starts)for(const end of destinations.filter(d=>d.x>=95)){
    const route=routeTo(start,end);assert.ok(route.length>=2,`${JSON.stringify(start)} -> ${end.id}`);
    assert.deepEqual(route[0],start);assert.deepEqual(route.at(-1),{x:end.x,z:end.z});
    for(let i=1;i<route.length;i++)assert.ok(clearHarborSegment(route[i-1],route[i]),`Unsupported segment to ${end.id}`);
  }
});
test('Market to ship and back follows the same continuous walking controller',()=>{
  let p={x:90,z:550};
  for(const goal of [{x:217,z:655},{x:119,z:427},{x:90,z:550}]){
    const route=routeTo(p,goal);assert.ok(route.length>1);
    for(const waypoint of route.slice(1)){
      let iterations=0;
      while(Math.hypot(p.x-waypoint.x,p.z-waypoint.z)>.05&&iterations++<2000){
        const distance=Math.hypot(p.x-waypoint.x,p.z-waypoint.z),t=Math.min(1,.095/distance);
        const next=constrainHarbor(p,{x:p.x+(waypoint.x-p.x)*t,z:p.z+(waypoint.z-p.z)*t});
        assert.ok(Math.hypot(next.x-p.x,next.z-p.z)>.001,'Walking route is blocked');p=next;
      }
      assert.ok(iterations<2000);
    }
    assert.ok(Math.hypot(p.x-goal.x,p.z-goal.z)<.06);
  }
});
test('gangway rises continuously to deck and hull/water/cargo remain blocked',()=>{
  assert.equal(harborHeight({x:200,z:646}),.35);assert.equal(harborHeight({x:216,z:646}),2.4);
  assert.equal(harborHeight({x:217,z:655}),2.4);assert.equal(onShip({x:220,z:656}),true);
  for(const p of[{x:208,z:650},{x:220,z:710},{x:210,z:655},{x:194,z:677},{x:220,z:651},{x:273,z:588}])assert.equal(harborWalkable(p),false);
  const start={x:194,z:660},safe=constrainHarbor(start,{x:180,z:660});assert.ok(safe.x>=186.32);
  const onDeck={x:217,z:655},deckSafe=constrainHarbor(onDeck,{x:208,z:655});assert.ok(deckSafe.x>=215);
});
test('new routes respect existing Ferry footprint and preserve original destination coordinates',()=>{
  assert.deepEqual(destinations.filter(d=>d.x<95).map(({id,x,z})=>({id,x,z})),[{id:'ferry',x:0,z:552},{id:'tickets',x:16.5,z:527},{id:'coffee',x:-16.5,z:527},{id:'arcade',x:35.6,z:561}]);
  for(const target of destinations.filter(d=>d.x<95)){
    const route=routeTo({x:217,z:655},target);assert.ok(route.length>1);
    for(let i=1;i<route.length;i++)assert.equal(segmentHitsBlock(route[i-1],route[i],{x:0,z:590,width:201.2,depth:45.7}),false);
  }
});

import { createDialogue } from '../src/historical-sf/dialogue.ts';
import type { Crowd } from '../src/historical-sf/crowd.ts';
test('a porter reply selects the ship without moving the player or requiring ambient speech',()=>{
  const viewer={x:119,z:548},people=[{id:0,x:119,z:550,role:'porter',distance:2,group:0}];
  const dialogue=createDialogue({people,hold(){}} as unknown as Crowd);
  dialogue.update(1,viewer,[],true,true);assert.equal(dialogue.begin(),true);
  assert.equal(dialogue.choose(0),'ship');assert.deepEqual(viewer,{x:119,z:548});
  assert.equal(dialogue.state().ambientEnabled,true);
});

test('outbound ground route clears the parked streetcar before following the sidewalk',()=>{
  const route=routeTo({x:1.4,z:350},destinations.find(d=>d.id==='ship')!);
  const car={x:3.15,z:358,width:3.28,depth:8.96};
  for(let i=1;i<route.length;i++)assert.equal(segmentHitsBlock(route[i-1],route[i],car),false);
});

test('a route exits a recessed Ferry arcade before moving laterally',()=>{
  const route=routeTo({x:35.6,z:570.4},destinations.find(d=>d.id==='ship')!);
  assert.deepEqual(route.slice(0,2),[{x:35.6,z:570.4},{x:35.6,z:561}]);
});
