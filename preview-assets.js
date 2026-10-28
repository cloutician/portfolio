// A small, shared network budget. Compressed bytes are retained, not 150 decoded
// images. Real interactions jump the queue and get one reserved request slot.
const ranks = { user: 0, near: 1, background: 2 };

export class PreviewAssetQueue {
  constructor() {
    this.jobs = new Map();
    this.running = 0;
    this.backgroundStarted = false;
    const connection = navigator.connection;
    this.conserveData = !!connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || "");
    this.concurrency = this.conserveData ? 1 : 2;
    document.addEventListener("visibilitychange", () => this.pump());
  }

  startBackground() { this.backgroundStarted = true; this.pump(); }

  promote(key, priority = "user") {
    const job = this.jobs.get(key);
    if (job) job.rank = Math.min(job.rank, ranks[priority]);
    this.pump();
  }

  run(key, task, { priority = "user" } = {}) {
    const existing = this.jobs.get(key);
    if (existing) { this.promote(key, priority); return existing.promise; }
    const job = { key, task, rank: ranks[priority], state: "queued" };
    job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
    this.jobs.set(key, job);
    this.pump();
    return job.promise;
  }

  blob(url, options) {
    return this.run(url, async priority => {
      const response = await fetch(url, { priority: priority === "user" ? "high" : "low" });
      if (!response.ok) throw new Error(`Could not prepare preview asset ${url} (${response.status}).`);
      return response.blob();
    }, options);
  }

  pump() {
    while (true) {
      const candidates = [...this.jobs.values()].filter(job => job.state === "queued"
        && (job.rank === 0 || !document.hidden && (job.rank === 1 || this.backgroundStarted)));
      candidates.sort((a, b) => a.rank - b.rank);
      const job = candidates[0];
      if (!job || this.running >= this.concurrency + (job.rank === 0 ? 1 : 0)) return;
      // Do not start more bulk traffic while an interactive request is pending.
      if (job.rank === 2 && [...this.jobs.values()].some(entry => entry.state === "running" && entry.rank === 0)) return;
      job.state = "running";
      this.running++;
      Promise.resolve().then(() => job.task(Object.keys(ranks).find(key => ranks[key] === job.rank))).then(value => {
        job.state = "ready";
        job.resolve(value);
      }, error => {
        job.state = "failed";
        this.jobs.delete(job.key); // A failed warm-up must not poison later clicks.
        job.reject(error);
      }).finally(() => { this.running--; this.pump(); });
    }
  }
}

let inputQuietAfter = 0;
for (const type of ["scroll", "pointerdown", "pointermove"]) {
  window.addEventListener(type, event => {
    if (type !== "pointermove" || event.buttons) inputQuietAfter = performance.now() + 120;
  }, { passive: true });
}

export function yieldPreviewWork(background = true) {
  return new Promise(resolve => {
    const schedule = () => {
      if (background && document.hidden) {
        document.addEventListener("visibilitychange", schedule, { once: true });
        return;
      }
      const wait = background ? inputQuietAfter - performance.now() : 0;
      if (wait > 0) { window.setTimeout(schedule, wait); return; }
      const finish = () => {
        if (background && (document.hidden || performance.now() < inputQuietAfter)) schedule();
        else resolve();
      };
      if (background && "requestIdleCallback" in window) window.requestIdleCallback(finish, { timeout: 750 });
      else window.setTimeout(finish, background ? 24 : 0);
    };
    schedule();
  });
}

let preparationTail = Promise.resolve();
export function enqueuePreviewPreparation(task) {
  const pending = preparationTail.then(() => yieldPreviewWork()).then(task);
  preparationTail = pending.catch(() => {});
  return pending;
}

// Timeline-only thumbnails, generated from the unchanged full-resolution frame.
// Only these small derivatives remain decoded in the twelve thumbnail elements.
export async function createPreviewThumbnail(blob) {
  let source, temporaryUrl;
  try {
    if ("createImageBitmap" in window) source = await createImageBitmap(blob);
    else {
      temporaryUrl = URL.createObjectURL(blob);
      source = new Image();
      source.src = temporaryUrl;
      await source.decode();
    }
    const canvas = document.createElement("canvas");
    canvas.width = 160; canvas.height = 90;
    canvas.getContext("2d").drawImage(source, 0, 0, 160, 90);
    const thumbnail = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!thumbnail) throw new Error("Could not prepare timeline thumbnail.");
    return URL.createObjectURL(thumbnail);
  } finally {
    source?.close?.();
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
  }
}
