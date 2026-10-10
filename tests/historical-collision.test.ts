import assert from 'node:assert/strict';
import test from 'node:test';
import { moveStreetWalker, separateTraffic, vehicleBounds } from '../src/historical-sf/collision.ts';
import type { TrafficMarker } from '../src/historical-sf/crowd.ts';
const tram:TrafficMarker={x:0,z:0,kind:'tram',speed:0,direction:1};
const outside=(p:{x:number;z:number},v=tram)=>{const b=vehicleBounds(v);return p.x<=b.left||p.x>=b.right||p.z<=b.back||p.z>=b.front;};

test('walking and sprinting cannot cross any tram side; diagonal motion slides',()=>{
  for(const [from,to] of [[{x:-5,z:0},{x:5,z:0}],[{x:5,z:0},{x:-5,z:0}],[{x:0,z:-8},{x:0,z:8}],[{x:0,z:8},{x:0,z:-8}]] as const){
    const result=moveStreetWalker(from,to,[tram],[]);assert.ok(outside(result));
    assert.ok(Math.hypot(result.x-from.x,result.z-from.z)<6);
  }
  const slide=moveStreetWalker({x:-2,z:0},{x:0,z:2},[tram],[]);
  assert.ok(outside(slide));assert.ok(slide.z>1.9);
});
test('moving traffic separates an idle walker at different frame rates without longitudinal teleporting',()=>{
  for(const fps of [20,60,144]){
    let p={x:0,z:5};
    for(let i=0;i<fps*3;i++){
      const vehicle={...tram,z:i/fps*2,speed:2};
      p=separateTraffic(p,p,[vehicle]);assert.ok(outside(p,vehicle));assert.ok(Math.abs(p.z-5)<1e-9);assert.ok(Math.abs(p.x)<2);
    }
  }
});
test('wagon horse end follows travel direction and does not sweep across a wrapped route',()=>{
  for(const direction of [-1,1]){
    const wagon={...tram,kind:'wagon',direction};
    const p=separateTraffic({x:0,z:direction*4},{x:0,z:direction*4},[wagon]);assert.ok(outside(p,wagon));
  }
  const p={x:0,z:450};assert.deepEqual(separateTraffic(p,p,[{...tram,z:340}]),p);
});
test('pedestrian separation is finite at coincident centers and stays outside a neighboring tram',()=>{
  const p=moveStreetWalker({x:2,z:0},{x:2,z:0},[tram],[{x:2,z:0}]);
  assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));assert.ok(outside(p));
  assert.ok(Math.hypot(p.x-2,p.z)>=.599);
  assert.deepEqual(moveStreetWalker(p,p,[tram],[{x:2,z:0}]),p);
});

test('a pedestrian pinned against a tram resolves jointly without persistent overlap',()=>{
  const people=[{x:1.9,z:0}];let p={x:1.64,z:0};
  for(let i=0;i<10;i++){
    p=moveStreetWalker(p,p,[tram],people);assert.ok(outside(p));
    assert.ok(Math.hypot(p.x-1.9,p.z)>=.5999);assert.ok(Math.hypot(p.x-1.64,p.z)<1);
  }
});
