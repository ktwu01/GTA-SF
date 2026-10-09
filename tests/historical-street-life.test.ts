import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bearingFromYaw, cardinalFromYaw, destinations, distanceBetween,
  routeDistance, routeTo, segmentHitsBlock, worldToRadar,
} from '../src/historical-sf/navigation.ts';
import { createDialogue, hasStreetSight } from '../src/historical-sf/dialogue.ts';
import type { Crowd } from '../src/historical-sf/crowd.ts';

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('route distances accept camera coordinates exposed through prototype accessors', () => {
  class CameraPoint {
    constructor(private coordinates: [number, number]) {}
    get x() { return this.coordinates[0]; }
    get z() { return this.coordinates[1]; }
  }
  const route = routeTo(new CameraPoint([1.4, 350]), new CameraPoint([0, 552]));
  assert.deepEqual(route, [{ x: 1.4, z: 350 }, { x: 0, z: 552 }]);
  close(routeDistance(route), Math.hypot(1.4, 202));
});

test('compass follows the northeast Ferry axis through full rotations', () => {
  for (const turn of [-4, -1, 0, 1, 4]) {
    const full = turn * Math.PI * 2;
    close(bearingFromYaw(full), 45);
    assert.equal(cardinalFromYaw(full), 'NE');
    assert.equal(cardinalFromYaw(full - Math.PI / 4), 'N');
    assert.equal(cardinalFromYaw(full + Math.PI), 'SW');
    assert.equal(cardinalFromYaw(full + Math.PI / 2), 'SE');
  }
});

test('rotating radar keeps forward up and right to the right', () => {
  const origin = { x: 7, z: 420 };
  for (const yaw of [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const forward = worldToRadar({ x: origin.x + 10 * Math.sin(yaw), z: origin.z + 10 * Math.cos(yaw) }, origin, yaw, 2);
    close(forward.x, 0);
    close(forward.y, -20);
    const right = worldToRadar({ x: origin.x + 10 * Math.cos(yaw), z: origin.z - 10 * Math.sin(yaw) }, origin, yaw, 2);
    close(right.x, 20);
    close(right.y, 0);
  }
});

test('off-map destination clamps to the edge without changing its direction', () => {
  const point = { x: 30, z: 40 }, origin = { x: 0, z: 0 };
  const edge = worldToRadar(point, origin, 0, 2, 25);
  assert.equal(edge.clamped, true);
  close(edge.x, 15);
  close(edge.y, -20);
  const self = worldToRadar(origin, origin, 2, 1, 25);
  close(self.x, 0);
  close(self.y, 0);
  assert.equal(self.clamped, false);
});

test('all destination routes keep players outside the side-building boundary', () => {
  const starts = [{ x: 1.4, z: 350 }, { x: 16, z: 480 }, { x: -16, z: 500 }, { x: 90, z: 550 }, { x: -80, z: 545 }];
  for (const start of starts) for (const destination of destinations) {
    const end = { x: destination.x, z: destination.z };
    const route = routeTo(start, end);
    assert.deepEqual(route[0], start);
    assert.deepEqual(route.at(-1), end);
    assert.ok(routeDistance(route) >= distanceBetween(start, end) - 1e-8);
    for (let i = 1; i < route.length; i++) for (let step = 0; step <= 100; step++) {
      const t = step / 100, a = route[i - 1], b = route[i];
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      assert.ok(z >= 534 || Math.abs(x) <= 17.4, `Route enters a building approach at ${x}, ${z}`);
    }
  }
});

test('speech sight lines reject intervening buildings, including parallel rays', () => {
  const block = { x: 0, z: 0, width: 10, depth: 10 };
  assert.equal(segmentHitsBlock({ x: -10, z: 0 }, { x: 10, z: 0 }, block), true);
  assert.equal(segmentHitsBlock({ x: 0, z: -10 }, { x: 0, z: 10 }, block), true);
  assert.equal(segmentHitsBlock({ x: -10, z: 6 }, { x: 10, z: 6 }, block), false);
  assert.equal(segmentHitsBlock({ x: 6, z: -10 }, { x: 6, z: 10 }, block), false);
  assert.equal(segmentHitsBlock({ x: 20, z: 0 }, { x: 30, z: 0 }, block), false);
});

const dialogueFixture = () => {
  const people = [{ id: 0, x: 0, z: 353, role: 'news', distance: 3, group: 0 }];
  const holds: Array<{ id: number; until: number }> = [];
  const crowd = { people, hold(id: number, until: number) { holds.push({ id, until }); } } as unknown as Crowd;
  return { dialogue: createDialogue(crowd), holds };
};

test('nearby conversation gives directions and can end outside the prompt radius', () => {
  const { dialogue } = dialogueFixture();
  dialogue.update(1, { x: 0, z: 350 }, [], true, true);
  assert.equal(dialogue.begin(), true);
  assert.equal(dialogue.state().activeId, 0);
  assert.equal(dialogue.state().choices.length, 2);
  assert.equal(dialogue.choose(0), 'ferry');
  assert.equal(dialogue.state().stage, 'reply');
  dialogue.update(2, { x: 0, z: 346 }, [], true, true);
  assert.equal(dialogue.state().nearby, null);
  assert.equal(dialogue.state().activeId, 0);
  assert.equal(dialogue.begin(), true);
  assert.equal(dialogue.state().activeId, null);
});

test('a paused conversation rejects replies and resumes at the same choice', () => {
  const { dialogue } = dialogueFixture();
  dialogue.update(1, { x: 0, z: 350 }, [], true, true);
  assert.equal(dialogue.begin(), true);
  dialogue.update(1, { x: 0, z: 350 }, [], true, false);
  assert.equal(dialogue.choose(0), null);
  assert.equal(dialogue.state().stage, 'greeting');
  dialogue.update(2, { x: 0, z: 350 }, [], true, true);
  assert.equal(dialogue.choose(0), 'ferry');
  assert.equal(dialogue.state().stage, 'reply');
});

test('boarding or walking away releases a conversation; replay clears speech', () => {
  const { dialogue } = dialogueFixture();
  dialogue.update(1, { x: 0, z: 350 }, [], true, true);
  dialogue.begin();
  dialogue.update(2, { x: 0, z: 350 }, [], false, true);
  assert.equal(dialogue.state().activeId, null);
  assert.equal(dialogue.begin(), false);
  dialogue.update(3, { x: 0, z: 350 }, [], true, true);
  dialogue.begin();
  dialogue.update(4, { x: 0, z: 340 }, [], true, true);
  assert.equal(dialogue.state().activeId, null);
  dialogue.reset();
  assert.deepEqual(dialogue.state().speech, []);
  assert.equal(dialogue.state().nearby, null);
});

test('hidden experience cannot start speech, and a streetcar blocks nearby talk', () => {
  const { dialogue } = dialogueFixture();
  dialogue.update(1, { x: 0, z: 350 }, [], true, false);
  assert.equal(dialogue.begin(), false);
  assert.deepEqual(dialogue.state().speech, []);
  assert.equal(hasStreetSight({ x: 0, z: 350 }, { x: 0, z: 362 }, [{ x: 0, z: 356, kind: 'tram', speed: 0, direction: 1 }]), false);
  assert.equal(hasStreetSight({ x: 0, z: 350 }, { x: 0, z: 362 }, [{ x: 10, z: 356, kind: 'tram', speed: 0, direction: 1 }]), true);
});
