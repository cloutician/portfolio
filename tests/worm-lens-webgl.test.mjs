import assert from 'node:assert/strict';
import test from 'node:test';
import { createWormLensWebGLRenderer } from '../worm-lens-webgl.js';

function fixture(t) {
  const previous = new Map(['HTMLCanvasElement', 'HTMLImageElement', 'Image', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => previous.forEach((descriptor, key) => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]));
  class ImageStub {
    complete = true; naturalWidth = 8; naturalHeight = 8;
    set src(value) { this.currentSrc = value; queueMicrotask(() => this.onload?.()); }
    get src() { return this.currentSrc; }
  }
  const calls = [];
  let error = 0;
  const gl = new Proxy({ NO_ERROR: 0, FRAMEBUFFER_COMPLETE: 1 }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'isContextLost') return () => false;
      if (key === 'getError') return () => error;
      if (key === 'checkFramebufferStatus') return () => 1;
      if (key === 'getShaderParameter' || key === 'getProgramParameter') return () => true;
      if (String(key).startsWith('create') || key === 'getUniformLocation') return () => ({});
      if (/^[A-Z_0-9]+$/.test(String(key))) return 1;
      return (...args) => { calls.push([key, ...args]); };
    },
  });
  class CanvasStub {
    width = 0; height = 0; listeners = new Map();
    getContext() { return gl; }
    addEventListener(type, callback) { this.listeners.set(type, callback); }
  }
  Object.assign(globalThis, { HTMLCanvasElement: CanvasStub, HTMLImageElement: ImageStub, Image: ImageStub, window: { devicePixelRatio: 1, matchMedia: () => ({ matches: false }) } });
  const canvas = new CanvasStub(), availability = [];
  const renderer = createWormLensWebGLRenderer(canvas, value => availability.push(value));
  const rect = { left: 0, top: 0, width: 48, height: 48 };
  const image = name => { const img = new ImageStub(); img.src = name; return { image: img, rect, opacity: 1 }; };
  return { renderer, canvas, calls, availability, rect, image, failUpload: () => { error = 1281; } };
}

test('a missing texture keeps the completed frame and backing store intact until preparation finishes', async t => {
  const f = fixture(t), first = f.image('first'), incoming = f.image('incoming');
  assert.equal(await f.renderer.prepare([first]), true);
  assert.equal(f.renderer.hasFrame, false);
  assert.equal(f.renderer.render([first], f.rect), true);
  const dimensions = [f.canvas.width, f.canvas.height], operations = f.calls.length;
  assert.equal(f.renderer.render([incoming], { ...f.rect, width: 52, height: 52 }), false);
  assert.equal(f.renderer.hasFrame, true);
  assert.equal(f.renderer.ready, true);
  assert.deepEqual([f.canvas.width, f.canvas.height], dimensions);
  assert.equal(f.calls.length, operations, 'A miss must not clear, resize or partially draw the visible canvas');
  assert.equal(await f.renderer.prepare([incoming]), true);
  assert.equal(f.renderer.render([incoming], f.rect), true);
  assert.deepEqual(f.availability, [false, true]);
});

test('black space at image edges is a valid glass frame, not a fallback condition', async t => {
  const f = fixture(t);
  await f.renderer.prepare([f.image('first')]);
  assert.equal(f.renderer.render([], f.rect), true);
  assert.equal(f.renderer.hasFrame, true);
  assert.ok(f.calls.some(([name]) => name === 'drawArrays'), 'The glass optics still render over empty camera space');
});

test('genuine context loss invalidates the retained frame and reports fallback availability', async t => {
  const f = fixture(t), first = f.image('first');
  await f.renderer.prepare([first]); f.renderer.render([first], f.rect);
  let prevented = false;
  f.canvas.listeners.get('webglcontextlost')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.renderer.hasFrame, false);
  assert.equal(f.renderer.ready, false);
  assert.deepEqual(f.availability, [false, true, false]);
});
