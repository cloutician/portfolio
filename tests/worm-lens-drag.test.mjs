import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { resistLensDrag, unresistLensDrag, advanceLensReturn } from '../worm-lens-drag.js';

const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const controls = script.slice(script.indexOf('function updateWormLensVerticalOffset('));

function fixture(reducedMotion = false) {
  const handlers = {}, classes = new Set(['is-ready']), scheduled = new Map(), captures = new Set();
  const writes = [], draws = [];
  let clock = 0, nextId = 0, settles = 0;
  const bounds = { left: 0, top: 0, width: 1000, height: 400, bottom: 400 };
  const motion = { offset: 0, velocity: 0, frame: 0, time: 0, height: 0, drag: null };
  const range = {
    value: '58', getBoundingClientRect: () => bounds,
    setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id),
    releasePointerCapture: id => captures.delete(id),
    addEventListener: (type, callback) => { handlers[type] = callback; },
  };
  const context = vm.createContext({
    resistLensDrag, unresistLensDrag, advanceLensReturn,
    wormLensVerticalMotion: motion, wormLensSize: { rest: 48 }, wormComparisonRange: range,
    wormComparisonLens: { getBoundingClientRect: () => ({
      left: Number(range.value) * 10 - 24, top: 176 + motion.offset, width: 48, height: 48,
    }) },
    wormCompare: { hidden: false, addEventListener() {}, classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name), toggle(name, active) { active ? classes.add(name) : classes.delete(name); },
    } },
    wormComparisonControl: { style: { setProperty: (name, value) => writes.push(parseFloat(value)) } },
    wormSliderPointerId: null, wormSliderMotion: { value: 58, time: 0, velocity: 0 },
    reducedMotion, projectIsVisible: true, wormLensScrollSuspended: false, document: { hidden: false },
    wormAnimationFrame: 0, wormLensRenderAnimationFrame: 0, syncWormLensOptics() {}, requestWormLensRender() {},
    captureWormLensFrame: (x, y) => ({ y }), renderWormLensView: frame => draws.push(frame),
    updateWormComparison: value => { range.value = String(value); }, settleWormComparison: () => settles++,
    performance: { now: () => clock },
    requestAnimationFrame: callback => { scheduled.set(++nextId, callback); return nextId; },
    cancelAnimationFrame: id => scheduled.delete(id),
  });
  vm.runInContext(controls, context);
  return { context, motion, range, bounds, scheduled, writes, draws, captures,
    get settles() { return settles; },
    event(type, x, y, extra = {}) {
      clock += 16;
      handlers[type]({ pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1,
        pressure: .5, clientX: x, clientY: y, preventDefault() {}, ...extra });
    },
    tick() {
      clock += 1000 / 120;
      const callbacks = [...scheduled.values()]; scheduled.clear();
      callbacks.forEach(callback => callback(clock));
    },
  };
}

test('vertical resistance is direct in the middle, smooth, symmetric and bounded near either edge', () => {
  assert.equal(resistLensDrag(40, 200), 40);
  const earlierResistance = 90 + 110 * (1 - Math.exp(-60 / 110));
  const tunedResistance = resistLensDrag(150, 200);
  assert.ok(tunedResistance < earlierResistance - 5 && tunedResistance > earlierResistance - 8,
    'The outer part of the drag has slightly more resistance without changing its maximum travel');
  assert.equal(resistLensDrag(10, 0), 0);
  let previous = 0, previousStep = 10;
  for (let position = 10; position <= 1000; position += 10) {
    const current = resistLensDrag(position, 200);
    assert.ok(current > previous && current < 200);
    assert.ok(current - previous <= previousStep + 1e-9);
    assert.equal(resistLensDrag(-position, 200), -current);
    previousStep = current - previous; previous = current;
  }
  for (const position of [-199, -150, -40, 0, 40, 150, 199]) {
    assert.ok(Math.abs(resistLensDrag(unresistLensDrag(position, 200), 200) - position) < 1e-9);
  }
});

test('the return has one restrained opposite-side overshoot, consistently across refresh rates', () => {
  for (const hz of [60, 90, 120]) {
    let state = { offset: 100, velocity: 0 }, minimum = 0, frames = 0;
    while (!state.settled && frames++ < hz * 2) {
      state = advanceLensReturn(state.offset, state.velocity, 1 / hz);
      minimum = Math.min(minimum, state.offset);
    }
    assert.ok(minimum < -6 && minimum > -8, `${hz}Hz has a small, matching overshoot`);
    assert.ok(frames / hz < 1);
    assert.equal(state.offset, 0); assert.equal(state.velocity, 0);
  }
});

test('line-only dragging stays horizontal, without starting a vertical spring', () => {
  const f = fixture();
  f.event('pointerdown', 580, 70); f.event('pointermove', 650, 370); f.event('pointerup', 650, 370);
  assert.equal(Number(f.range.value), 65); assert.equal(f.motion.offset, 0);
  assert.equal(f.writes.length, 0); assert.equal(f.scheduled.size, 0); assert.equal(f.settles, 1);
});

test('circle dragging moves both axes; release preserves horizontal behaviour and returns vertically without an idle loop', () => {
  const f = fixture();
  f.event('pointerdown', 580, 200); f.event('pointermove', 620, 330);
  const released = f.motion.offset;
  assert.ok(released > 0 && released < 130);
  assert.equal(Number(f.range.value), 62);
  f.event('pointerup', 620, 330);
  assert.equal(f.settles, 1); assert.equal(f.captures.size, 0);
  for (let i = 0; f.scheduled.size && i < 150; i++) f.tick();
  assert.ok(Math.min(...f.writes) < -released * .06);
  assert.equal(f.motion.offset, 0); assert.equal(Number(f.range.value), 62);
  assert.equal(f.scheduled.size, 0); assert.equal(f.motion.frame, 0);
  assert.ok(f.draws.length > 0);
  assert.equal(f.draws.at(-1).y, 0, 'The lens samples the same final vertical position as its ring');
});

test('re-grabbing a displaced lens does not jump, and another pointer cannot steal it', () => {
  const f = fixture(); f.motion.offset = 120;
  f.event('pointerdown', 580, 320); f.event('pointermove', 580, 320);
  assert.ok(Math.abs(f.motion.offset - 120) < 1e-9);
  f.event('pointerdown', 200, 50, { pointerId: 2 });
  assert.equal(f.context.wormSliderPointerId, 1);
});

test('pen hovering cannot drag either axis, while real zero-pressure S Pen contact can', () => {
  const f = fixture();
  f.event('pointermove', 580, 280, { pointerType: 'pen', button: -1, pressure: 0, buttons: 0 });
  f.event('pointerdown', 580, 200, { pointerType: 'pen', button: -1, pressure: 0, buttons: 0 });
  assert.equal(f.context.wormSliderPointerId, null); assert.equal(f.motion.offset, 0);
  f.event('pointerdown', 580, 200, { pointerType: 'pen', pressure: 0, buttons: 0 });
  f.event('pointermove', 600, 280, { pointerType: 'pen', pressure: 0, buttons: 0 });
  assert.ok(f.motion.offset > 0); assert.equal(Number(f.range.value), 60);
});

test('pointer cancellation and capture loss return the lens without throwing the horizontal slider', () => {
  for (const type of ['pointercancel', 'lostpointercapture']) {
    const f = fixture(); f.event('pointerdown', 580, 200); f.event('pointermove', 580, 100);
    f.event(type, 580, 100);
    assert.equal(f.motion.drag, null); assert.equal(f.settles, 0);
    for (let i = 0; f.scheduled.size && i < 150; i++) f.tick();
    assert.equal(f.motion.offset, 0);
  }
});

test('reduced motion recentres immediately and hidden previews suspend the spring', () => {
  const reduced = fixture(true);
  reduced.event('pointerdown', 580, 200); reduced.event('pointermove', 580, 330); reduced.event('pointerup', 580, 330);
  assert.equal(reduced.motion.offset, 0); assert.equal(reduced.scheduled.size, 0);
  const f = fixture(); f.event('pointerdown', 580, 200); f.event('pointermove', 580, 330); f.event('pointerup', 580, 330);
  f.context.projectIsVisible = false; f.tick();
  assert.equal(f.draws.length, 0); assert.equal(f.scheduled.size, 0);
  f.context.projectIsVisible = true; f.context.startWormLensVerticalReturn();
  for (let i = 0; f.scheduled.size && i < 150; i++) f.tick();
  assert.equal(f.motion.offset, 0);
});
