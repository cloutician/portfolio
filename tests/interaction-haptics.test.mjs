import test from "node:test";
import assert from "node:assert/strict";
import { InteractionHaptics } from "../interaction-haptics.js";

function setup(options = {}) {
  let time = 0;
  const calls = [], page = { hidden: false };
  const device = { vibrate: duration => { calls.push(duration); return true; }, userActivation: { hasBeenActive: true } };
  const haptics = new InteractionHaptics({ device, page, now: () => time, ...options });
  return { haptics, calls, page, device, advance: milliseconds => { time += milliseconds; } };
}
const contact = { pointerType: "touch", isTrusted: true };

test("scrub detents follow frame changes, are short and rate limited, and never queue skipped frames", () => {
  const { haptics, calls, advance } = setup();
  haptics.beginScrub(79, contact);
  haptics.scrub(79); assert.deepEqual(calls, []);
  haptics.scrub(80); assert.deepEqual(calls, [4]);
  for (let i = 81; i < 100; i++) { advance(1); haptics.scrub(i); }
  assert.deepEqual(calls, [4]);
  advance(50); haptics.scrub(100); assert.deepEqual(calls, [4, 4]);
  advance(80); haptics.scrub(100); assert.deepEqual(calls, [4, 4]);
  haptics.endScrub(); advance(100); haptics.scrub(101); assert.deepEqual(calls, [4, 4]);
});

test("real finger/pen arrow taps pulse once; mouse, keyboard and synthetic events do not", () => {
  const { haptics, calls, advance } = setup();
  haptics.tap(contact); advance(100);
  haptics.tap({ pointerType: "pen", isTrusted: true }); advance(100);
  for (const event of [{ pointerType: "mouse", isTrusted: true }, { isTrusted: true }, { pointerType: "touch", isTrusted: false }]) haptics.tap(event);
  assert.deepEqual(calls, [12, 12]);
});

test("release/cancel stops an in-flight pulse; hidden pages and reduced motion are silent", () => {
  const { haptics, calls, page, advance } = setup();
  haptics.beginScrub(0, contact); haptics.scrub(1); haptics.endScrub();
  assert.deepEqual(calls, [4, 0]);
  advance(100); page.hidden = true; haptics.tap(contact); assert.deepEqual(calls, [4, 0]);
  const reduced = setup({ enabled: false }); reduced.haptics.tap(contact); reduced.haptics.beginScrub(0, contact); reduced.haptics.scrub(1);
  assert.deepEqual(reduced.calls, []);
});

test("unsupported, denied or throwing browser APIs never break controls", () => {
  for (const device of [{}, { vibrate: () => false }, { vibrate: () => { throw new Error("denied"); } }, { vibrate: () => { throw new Error("should not be called"); }, userActivation: { hasBeenActive: false } }]) {
    const { haptics } = setup({ device });
    assert.doesNotThrow(() => { haptics.tap(contact); haptics.beginScrub(0, contact); haptics.scrub(1); haptics.endScrub(); });
    assert.equal(haptics.tap(contact), false);
  }
});
