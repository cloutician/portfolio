import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = { addEventListener() {}, setTimeout };
const { PreviewAssetQueue } = await import("../preview-assets.js");
const turn = () => new Promise(resolve => setTimeout(resolve, 0));
const gate = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function environment(connection = {}) {
  globalThis.document = new EventTarget();
  document.hidden = false;
  Object.defineProperty(globalThis, "navigator", { value: { connection }, configurable: true });
}

test("background is gated; real interactions have a reserved slot and promote queued work", async () => {
  environment();
  const queue = new PreviewAssetQueue(), started = [], gates = [gate(), gate(), gate()];
  const tasks = gates.map((g, index) => queue.run(String(index), priority => {
    started.push([index, priority]); return g.promise;
  }, { priority: "background" }));
  await turn(); assert.equal(started.length, 0);
  queue.startBackground(); await turn(); assert.equal(started.length, 2);
  queue.promote("2"); await turn();
  assert.deepEqual(started, [[0, "background"], [1, "background"], [2, "user"]]);
  gates.forEach(g => g.resolve()); await Promise.all(tasks);
});

test("one request is shared by preloading and clicks; failed downloads remain retryable", async () => {
  environment();
  const queue = new PreviewAssetQueue(), hold = gate(); let calls = 0;
  globalThis.fetch = async () => { calls++; await hold.promise; return new Response("frame"); };
  const warm = queue.blob("/frame", { priority: "background" });
  const clicked = queue.blob("/frame");
  assert.equal(warm, clicked); hold.resolve(); assert.equal((await clicked).size, 5); assert.equal(calls, 1);
  let attempts = 0;
  globalThis.fetch = async () => ++attempts === 1 ? new Response("", { status: 503 }) : new Response("retry");
  await assert.rejects(queue.blob("/retry"));
  assert.equal((await queue.blob("/retry")).size, 5); assert.equal(attempts, 2);
});

test("hidden pages pause background/near requests; explicit interactive requests still finish", async () => {
  environment(); document.hidden = true;
  const queue = new PreviewAssetQueue(), started = [];
  queue.startBackground();
  const bulk = queue.run("bulk", () => started.push("bulk"), { priority: "background" });
  const near = queue.run("near", () => started.push("near"), { priority: "near" });
  await queue.run("click", () => started.push("click"));
  assert.deepEqual(started, ["click"]);
  document.hidden = false; document.dispatchEvent(new Event("visibilitychange"));
  await Promise.all([bulk, near]); assert.deepEqual(started, ["click", "near", "bulk"]);
});

test("Data Saver and 2G use one background network slot", async () => {
  for (const connection of [{ saveData: true }, { effectiveType: "2g" }, { effectiveType: "slow-2g" }]) {
    environment(connection);
    const queue = new PreviewAssetQueue(), hold = gate(); let started = 0;
    assert.equal(queue.conserveData, true); queue.startBackground();
    const first = queue.run("first", () => { started++; return hold.promise; }, { priority: "background" });
    const second = queue.run("second", () => started++, { priority: "background" });
    await turn(); assert.equal(started, 1); hold.resolve(); await Promise.all([first, second]); assert.equal(started, 2);
  }
});
