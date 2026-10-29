import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Exercise the actual page functions with a small DOM/scheduler stand-in.
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const functions = script.slice(script.indexOf('function updateWormComparison('), script.indexOf('function settleWormComparison('));

function fixture(overrides = {}) {
  const events = [], scheduled = new Map();
  let frameId = 100;
  const style = name => ({ setProperty(key, value) { events.push([name, key, value]); } });
  const revealStyle = { set clipPath(value) { events.push(['image', 'clip-path', value]); } };
  const controlStyle = { set transform(value) { events.push(['control', 'transform', value]); } };
  const context = vm.createContext({
    wormComparisonGeometry: { stageWidth: 1000, cropLeft: 250, cropWidth: 500 },
    wormStage: { clientWidth: 1000, style: style('image'), classList: { toggle() {} } },
    wormCompare: { style: style('control') },
    wormRevealViewport: { style: revealStyle }, wormComparisonControl: { style: controlStyle }, wormComparisonLineX: 0,
    wormComparisonRange: { value: '0' }, wormKey: { hidden: true },
    wormAnimationFrame: 0, wormLensRenderAnimationFrame: 17,
    wormLensScrollSuspended: false, projectIsVisible: true, document: { hidden: false },
    performance: { now: () => 0 },
    cancelAnimationFrame(id) { scheduled.delete(id); events.push(['cancel', id]); },
    requestAnimationFrame(callback) { const id = ++frameId; scheduled.set(id, callback); return id; },
    requestWormLensRender() { events.push(['queue-lens']); },
    captureWormLensFrame(x) { events.push(['measure-lens', x]); return { x }; },
    renderWormLensView() { events.push(['draw-lens', Number(context.wormComparisonRange.value)]); },
    ...overrides,
  });
  vm.runInContext(functions, context);
  return { context, events, tick(time) {
    const [id, callback] = scheduled.entries().next().value;
    scheduled.delete(id); callback(time);
  }, scheduled };
}

test('automatic reveal paints the lens after the current position writes in the same frame', () => {
  const f = fixture();
  f.context.animateWormComparison(58);
  f.tick(675);
  assert.equal(f.events.findIndex(([name]) => name === 'measure-lens') < f.events.findIndex(([name]) => name === 'image'), true, 'Geometry must be measured before CSS writes');
  assert.equal(Number(f.context.wormComparisonRange.value), 50.75, 'Keep the original 1350ms cubic-out motion');
  const positionWrite = f.events.at(-3);
  assert.deepEqual(positionWrite.slice(0, 2), ['control', 'transform']);
  assert.ok(Math.abs(parseFloat(positionWrite[2].replace('translate3d(', '')) - 507.5) < 1e-9);
  assert.deepEqual(f.events.slice(-2), [['cancel', 17], ['draw-lens', 50.75]]);
  assert.equal(f.events.some(([name]) => name === 'queue-lens'), false, 'No second-frame lens handoff');
  assert.equal(f.context.wormLensRenderAnimationFrame, 0);
  f.tick(1350);
  assert.equal(Number(f.context.wormComparisonRange.value), 58);
  assert.equal(f.scheduled.size, 0, 'The reveal must not leave a continuous drawing loop');
});

test('manual dragging keeps its existing coalesced lens scheduling', () => {
  const f = fixture();
  f.context.updateWormComparison(43.25);
  assert.equal(Number(f.context.wormComparisonRange.value), 43.25);
  assert.deepEqual(f.events.at(-1), ['queue-lens']);
  assert.equal(f.events.some(([name]) => name === 'draw-lens'), false);
});

test('automatic motion does not bypass scroll, offscreen or hidden-tab GPU suspension', () => {
  for (const overrides of [{ wormLensScrollSuspended: true }, { projectIsVisible: false }, { document: { hidden: true } }]) {
    const f = fixture(overrides);
    f.context.updateWormComparison(58, { renderLensNow: true });
    assert.equal(Number(f.context.wormComparisonRange.value), 58);
    assert.equal(f.events.some(([name]) => name === 'draw-lens' || name === 'queue-lens'), false);
  }
});

test('lens snapshots project the exact fractional next position before any style writes', () => {
  const capture = script.slice(script.indexOf('function captureWormLensFrame('), script.indexOf('function renderWormLensView('));
  const bounds = { left: 100, right: 148, top: 200, bottom: 248, width: 48, height: 48 };
  const context = vm.createContext({
    wormComparisonLens: { getBoundingClientRect: () => bounds },
    wormCompare: { hidden: false, classList: { contains: () => true } },
    wormComparisonLineX: 250.25, wormStage: {},
    projectStage: { querySelectorAll: () => [] },
    collectWormLensLayers: (stages, rect) => [{ rect }],
  });
  vm.runInContext(capture, context);
  const frame = context.captureWormLensFrame(500.75);
  assert.equal(frame.sampleRect.left, 350.5);
  assert.equal(frame.sampleRect.right, 398.5);
  assert.equal(frame.sampleRect.top, 200);
  assert.equal(frame.layers[0].rect, frame.sampleRect);
  assert.equal(context.captureWormLensFrame().sampleRect.left, 100, 'Manual drawing measures its current position normally');
  assert.equal(bounds.left, 100, 'Do not mutate the measured DOM geometry');
});
