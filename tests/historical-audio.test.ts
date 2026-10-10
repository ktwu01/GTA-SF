import assert from 'node:assert/strict';
import test from 'node:test';
import { createStreetAudio, soundPosition } from '../src/historical-sf/audio.ts';
import type { Pedestrian } from '../src/historical-sf/crowd.ts';

test('street sound attenuates with distance and pans relative to the listener', () => {
  const listener = { x: 0, z: 0, yaw: 0 };
  assert.deepEqual(soundPosition(listener, listener), { distance: 0, gain: 1, pan: 0 });
  assert.equal(soundPosition({ x: 38, z: 0 }, listener).gain, 0);
  assert.equal(soundPosition({ x: 100, z: 0 }, listener).gain, 0);
  assert.equal(soundPosition({ x: 10, z: 0 }, listener).pan, 1);
  assert.equal(soundPosition({ x: -10, z: 0 }, listener).pan, -1);
  assert.ok(Math.abs(soundPosition({ x: 0, z: 10 }, { ...listener, yaw: Math.PI / 2 }).pan + 1) < 1e-10);
});

test('speech retries delayed local voices, does not repeat, and cancels on pause, mute, exit and reset', async () => {
  const saved = ['AudioContext', 'speechSynthesis', 'SpeechSynthesisUtterance', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  let voices: Array<{ localService: boolean; lang: string; name: string }> = [];
  const spoken: Array<{ onend?: () => void }> = [];
  let canceled = 0;
  let finishFetch: ((response: unknown) => void) | undefined;
  const parameter = () => ({ value: 0, setTargetAtTime() {}, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ gain: parameter(), pan: parameter(), frequency: parameter(), connect() {}, disconnect() {}, start() {}, stop() {} });
  class FakeAudioContext {
    sampleRate = 100; currentTime = 0; state = 'running'; destination = {};
    createGain = node; createBiquadFilter = node; createBufferSource = node; createStereoPanner = node; createOscillator = node;
    createBuffer() { return { getChannelData: () => new Float32Array(200) }; }
    async resume() {}
    async decodeAudioData() { return { duration: 3.2 }; }
  }
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: FakeAudioContext });
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { configurable: true, value: class { constructor(public text: string) {} } });
  Object.defineProperty(globalThis, 'speechSynthesis', { configurable: true, value: {
    getVoices: () => voices, addEventListener() {}, cancel() { canceled++; }, speak(line: object) { spoken.push(line); },
  } });
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: () => new Promise(resolve => { finishFetch = resolve; }) });
  try {
    const audio = createStreetAudio(), listener = { x: 0, z: 0, yaw: 0 };
    const people = [{ id: 0, x: 0, z: 2 }] as Pedestrian[];
    const speech = [{ id: 0, text: 'Good afternoon.', active: true, until: Infinity }];
    const update = (lines = speech) => audio.update(1, listener, [], people, lines, 0, true);
    audio.setPaused(false); audio.unlock(); await Promise.resolve();
    update();
    assert.equal(spoken.length, 0);
    voices = [{ localService: false, lang: 'en-US', name: 'Remote' }];
    update(); assert.equal(spoken.length, 0);
    voices = [{ localService: true, lang: 'en-US', name: 'Local' }];
    update(); assert.equal(spoken.length, 1); assert.equal(audio.speaking(), true);
    update(); assert.equal(spoken.length, 1);
    spoken[0].onend!(); update(); assert.equal(spoken.length, 1); assert.equal(audio.speaking(), false);
    audio.setPaused(true); update(); assert.equal(spoken.length, 1);
    audio.setPaused(false); update(); assert.equal(spoken.length, 2);
    audio.setMuted(true); assert.equal(audio.speaking(), false); update(); assert.equal(spoken.length, 2);
    audio.setMuted(false); update(); assert.equal(spoken.length, 3);
    update([]); assert.equal(audio.speaking(), false);
    update(); assert.equal(spoken.length, 4);
    audio.setVoices(false); update(); assert.equal(audio.speaking(), false); assert.equal(spoken.length, 4);
    audio.setVoices(true); update(); assert.equal(spoken.length, 5);
    audio.setVolume(0); update(); assert.equal(audio.speaking(), false); assert.equal(spoken.length, 5);
    audio.setVolume(0.7);
    const clipLine = [{ ...speech[0], text: 'A paper for the crossing? The Call, if you please.' }];
    update(clipLine); assert.equal(audio.snapshot().clipLoading, true);
    audio.setPaused(true);
    finishFetch!({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
    for (let i = 0; i < 8; i++) await Promise.resolve();
    assert.equal(audio.snapshot().clipPlaying, false, 'late clip must not play after pause');
    audio.setPaused(false); update(clipLine);
    for (let i = 0; i < 8; i++) await Promise.resolve();
    assert.equal(audio.snapshot().clipPlaying, true);
    assert.equal(audio.snapshot().clipDuration, 3.2);
    assert.equal(audio.snapshot().started, 1);
    update([]); assert.equal(audio.snapshot().clipPlaying, false);
    audio.reset(); assert.equal(audio.snapshot().paused, true); assert.equal(audio.snapshot().spoken, 0);
    assert.ok(canceled >= 7);
  } finally {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
