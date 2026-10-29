import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const functions = script.slice(script.indexOf('function touchlineFrameUrl('), script.indexOf('function formatTouchlineClock('));
const gate = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function fixture() {
  const idle = gate(), revoked = [], calls = { downloads: 0, decodes: 0, idle: 0 };
  let nextUrl = 0;
  const frames = Array.from({ length: 150 }, (_, index) => ({ image: `frame-${index}.webp` }));
  const context = vm.createContext({
    touchlinePreview: { frames }, touchlineRequestedFrameIndex: 75, touchlineSeekDirection: 1,
    touchlinePlaybackRunning: false, touchlinePlaybackPending: false,
    touchlineFrameImageCache: new Map(), touchlineFrameLayers: [],
    previewAssets: { promote() {}, blob() { calls.downloads++; return Promise.resolve({}); } },
    yieldPreviewWork() { calls.idle++; return idle.promise; },
    URL: { createObjectURL() { return `blob:${++nextUrl}`; }, revokeObjectURL(url) { revoked.push(url); } },
    Image: class { async decode() { calls.decodes++; } },
  });
  vm.runInContext(functions, context);
  return { context, frames, calls, revoked, idle };
}

test('scrubbing prepares an equally sized window in both directions, within the 17-entry budget', async () => {
  for (const direction of [-1, 1]) {
    const f = fixture(); f.context.touchlineSeekDirection = direction;
    const bounds = f.context.touchlineCacheBounds(75);
    assert.equal(bounds.first, 67); assert.equal(bounds.last, 83);
    const indexes = [...f.context.touchlinePrefetchIndexes(75, 17)];
    assert.deepEqual(indexes.slice(0, 3), [75, 75 + direction, 75 - direction]);
    assert.equal(new Set(indexes).size, 17);
    await f.context.preloadTouchlineFrames(75);
    assert.equal(f.context.touchlineFrameImageCache.size, 17);
    assert.equal(f.calls.decodes, 17);
    assert.equal(f.calls.idle, 0, 'Seek neighbours must not wait for the drag to stop');
  }
});

test('playback retains the forward 4-before/12-after window, regardless of the last seek direction', () => {
  const f = fixture(); f.context.touchlineSeekDirection = -1;
  for (const state of ['touchlinePlaybackPending', 'touchlinePlaybackRunning']) {
    f.context[state] = true;
    const bounds = f.context.touchlineCacheBounds(75);
    assert.equal(bounds.first, 71); assert.equal(bounds.last, 87);
    assert.deepEqual([...f.context.touchlinePrefetchIndexes(75, 3)], [75, 76, 74]);
    f.context[state] = false;
  }
});

test('prefetching clamps to sequence edges and never warms an obsolete seek window', () => {
  const f = fixture();
  for (const centre of [0, 149]) {
    f.context.touchlineRequestedFrameIndex = centre;
    const indexes = [...f.context.touchlinePrefetchIndexes(centre, 17)];
    assert.ok(indexes.length <= 17);
    assert.ok(indexes.every(index => index >= 0 && index < 150 && Math.abs(index - centre) <= 8));
  }
  const stale = [...f.context.touchlinePrefetchIndexes(0, 17)];
  assert.ok(stale.every(index => index >= 141), 'A late opening warm-up stays inside the latest window');
});

test('requesting a background frame immediately promotes its waiting decoder without a duplicate download', async () => {
  for (const priority of ['near', 'user']) {
    const f = fixture(), sample = f.frames[75];
    const warm = f.context.loadTouchlineFrameImage(sample, { priority: 'background' });
    await Promise.resolve(); await Promise.resolve();
    assert.equal(f.calls.idle, 1); assert.equal(f.calls.decodes, 0);
    const requested = f.context.loadTouchlineFrameImage(sample, { priority });
    assert.equal(requested, warm);
    const image = await requested;
    assert.ok(image.src.startsWith('blob:'));
    assert.equal(f.calls.downloads, 1); assert.equal(f.calls.decodes, 1);
  }
});

test('pruning wakes obsolete background decoders and protects the two displayed images', async () => {
  const f = fixture();
  const displayed = await Promise.all([0, 149].map(index => f.context.loadTouchlineFrameImage(f.frames[index])));
  f.context.touchlineFrameLayers = displayed.map(image => ({ querySelector: () => image }));
  const obsolete = f.context.loadTouchlineFrameImage(f.frames[10], { priority: 'background' });
  await Promise.resolve(); await Promise.resolve();
  await f.context.preloadTouchlineFrames(75);
  f.context.pruneTouchlineFrameCache(75);
  assert.equal(await obsolete, null, 'A released idle decoder should finish without allocating an image');
  assert.ok(f.context.touchlineFrameImageCache.size <= 19);
  assert.ok(displayed.every(image => !f.revoked.includes(image.src)));
  assert.equal(f.context.touchlineFrameImageCache.has(f.frames[10].image), false);
});
