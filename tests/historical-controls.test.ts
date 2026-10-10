import assert from 'node:assert/strict';
import test from 'node:test';
import { standingJump, startJump, advanceJump, lookPitch, relativeMovement } from '../src/historical-sf/controls.ts';

test('jump returns to ground at different frame rates without a midair second jump', () => {
  for (const fps of [20, 30, 60, 144]) {
    let state = startJump(standingJump());
    let highest = 0;
    for (let frame = 0; frame < fps; frame++) {
      if (frame === Math.floor(fps / 4)) assert.deepEqual(startJump(state), state);
      state = advanceJump(state, 1 / fps);
      highest = Math.max(highest, state.height);
      assert.ok(state.height >= 0);
    }
    assert.deepEqual(state, standingJump());
    assert.ok(highest > 0.65 && highest < 0.8);
    assert.equal(startJump(state).grounded, false);
  }
});

test('jump ignores invalid elapsed time and caps a resumed frame', () => {
  const airborne = startJump(standingJump());
  for (const dt of [NaN, Infinity, -1, 0]) assert.deepEqual(advanceJump(airborne, dt), airborne);
  assert.deepEqual(advanceJump(airborne, 5), advanceJump(airborne, 0.05));
});

test('free movement follows view direction without diagonal speed boost', () => {
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    for (const [forward, side] of [[1, 0], [0, 1], [1, 1], [-1, -1]]) {
      const step = relativeMovement(forward, side, yaw);
      assert.ok(Math.abs(Math.hypot(step.x, step.z) - 1) < 1e-10);
    }
  }
  assert.deepEqual(relativeMovement(0, 0, 0), { x: 0, z: 0 });
  const east = relativeMovement(1, 0, Math.PI / 2);
  assert.ok(Math.abs(east.x - 1) < 1e-10 && Math.abs(east.z) < 1e-10);
  assert.equal(relativeMovement(0.5, 0, 0).z, 0.5);
});

test('mouse pitch stays within playable look limits', () => {
  assert.equal(lookPitch(0.2), 0.2);
  assert.equal(lookPitch(-100), -1.35);
  assert.equal(lookPitch(100), 1.25);
});
