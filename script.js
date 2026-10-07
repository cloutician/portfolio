import { createWormLensWebGLRenderer } from "./worm-lens-webgl.js";

const projects = [
  {
    slug: "worm-profiler",
    title: "Worm Profiler",
    type: "ilastik",
    year: "2026",
    demo: "",
    scene: 0,
    interactive: "worm",
    desc: "Tracks donor tissue through chimeric planarians, turning longitudinal images into reproducible segmentation and morphometric measurements.",
    tags: ["Bioimaging", "Segmentation", "Image analysis"],
    evidence: {
      eyebrow: "01 / Chimeric planarian analysis / ilastik",
      title: "Following donor tissue through a living planarian chimera.",
      summary: "Worm Profiler is an end-to-end imaging pipeline for cross-strain Schmidtea polychroa transplantation experiments. It crops each 26 MP capture to the worm region so Ilastik can process it efficiently, uses pigmentation contrast to separate donor tissue, host tissue, eyes, and background, validates donor masks against hand-drawn ground truth, then measures graft area, position, shape, confidence, and change over time.",
      metrics: [
        ["266", "Source images"],
        ["26 MP", "Per image"],
        [
          "4",
          "Segmentation classes",
          "Four active classes. Pharynx was originally the fifth, but it was difficult to annotate consistently and was removed from the current model. It may return in a future iteration.",
        ],
        ["20", "Evaluation images"],
      ],
      pipeline: [
        ["Crop", "Worm ROI from 6240 × 4160 captures"],
        ["Classify", "Donor / host / eyes / background"],
        ["Validate", "Dice / IoU / precision / recall"],
        ["Measure", "Area / centroid / morphology / time"],
      ],
      status: [
        ["Research question", "How donor stem-cell populations expand, regress, or move along the anterior-posterior axis after cross-strain transplantation."],
        ["Project output", "Two trained Ilastik models, donor ground-truth masks, probability and uncertainty analysis, threshold sweeps, morphometrics, and a reproducible evaluation notebook."],
      ],
    },
  },
  {
    slug: "touchline",
    title: "Touchline",
    previewTitle: "Touchline (Demo)",
    type: "Vision system",
    year: "2026",
    demo: "",
    scene: 1,
    interactive: "touchline",
    desc: "Moves broadcast football through detection, tracking, camera calibration, and metric pitch projection.",
    tags: ["Computer vision", "Tracking", "Homography"],
    evidence: {
      eyebrow: "02 / Football vision / Active development",
      title: "From broadcast footage to frame-linked football tracks.",
      summary: "Touchline moves a broadcast sequence through detection, tracking, camera calibration, and pitch projection. The retained demo uses a 30-second SoccerNet sequence and keeps every displayed observation tied to its source frame.",
      metrics: [
        ["750", "Labelled frames"],
        ["25", "Track IDs"],
        ["12,678", "Labelled observations"],
        ["150", "Interactive frames"],
      ],
      pipeline: [
        ["Detect", "YOLO11m"],
        ["Track", "OC-SORT"],
        ["Calibrate", "SoccerNet NBJW"],
        ["Project", "105 × 68 m"],
      ],
      status: [
        ["Current", "Automatic pitch calibration, persistent player tracks, camera parameters, and pitch coordinates."],
        ["Next", "Football-specific ball tracking, event inference, and 3D reconstruction."],
      ],
    },
  },
  {
    slug: "placeholder-03",
    title: "More projects soon",
    previewTitle: "More projects soon",
    type: "Upload queue",
    year: "Soon",
    demo: "",
    scene: 2,
    interactive: "placeholder",
    placeholder: true,
    desc: "A new case study is being prepared. The cat is holding this slot for now.",
    tags: ["3D model", "In progress"],
  },
  {
    slug: "placeholder-04",
    title: "More projects soon",
    previewTitle: "More projects soon",
    type: "Upload queue",
    year: "Soon",
    demo: "",
    scene: 3,
    interactive: "placeholder",
    placeholder: true,
    desc: "A new case study is being prepared. The cat is holding this slot for now.",
    tags: ["3D model", "In progress"],
  },
];

const header = document.querySelector("[data-header]");
const projectIndex = document.querySelector("#project-index");
const stageNumber = document.querySelector("#stage-number");
const stageTitle = document.querySelector("#stage-title");
const stageType = document.querySelector("#stage-type");
const stageVideo = document.querySelector("#project-video");
const projectEvidence = document.querySelector("#project-evidence");
const evidenceEyebrow = document.querySelector("#evidence-eyebrow");
const evidenceTitle = document.querySelector("#evidence-title");
const evidenceSummary = document.querySelector("#evidence-summary");
const evidenceMetrics = document.querySelector("#evidence-metrics");
const evidencePipeline = document.querySelector("#evidence-pipeline");
const evidenceStatus = document.querySelector("#evidence-status");
let wormStage = document.querySelector("#worm-stage");
let wormMedia = document.querySelector("#worm-media");
let wormZoomTrigger = document.querySelector("#worm-zoom-trigger");
const wormCompare = document.querySelector("#worm-compare");
const wormComparisonRange = document.querySelector("#worm-comparison-range");
const wormComparisonLens = document.querySelector("#worm-comparison-lens");
const wormComparisonLensWebGL = document.querySelector("#worm-comparison-lens-webgl");
const wormReset = document.querySelector("#worm-reset");
let wormSource = document.querySelector(".worm-source");
let wormSegmentation = document.querySelector(".worm-segmentation");
let wormLoading = document.querySelector(".worm-loading");
const wormPrevious = document.querySelector("#worm-previous");
const wormNext = document.querySelector("#worm-next");
const wormSequenceCount = document.querySelector("#worm-sequence-count");
const wormSequenceNav = document.querySelector(".worm-sequence-nav");
let roiDimensions = document.querySelector("#roi-dimensions");
let wormKey = document.querySelector(".worm-key");
const hero = document.querySelector(".hero");
const heroCanvas = document.querySelector("#hero-canvas");
const projectStage = document.querySelector(".project-stage");
const projectCanvas = document.querySelector("#project-canvas");
const projectPlaceholder = document.querySelector("#project-placeholder");
const placeholderSlotNumber = document.querySelector(".placeholder-slot-number");
const oiiaCatCanvas = document.querySelector("#oiia-cat-canvas");
const oiiaCatLoading = document.querySelector("#oiia-cat-loading");
const oiiaCatReset = document.querySelector("#oiia-cat-reset");
const touchlineStage = document.querySelector("#touchline-stage-lite");
const touchlineViewport = document.querySelector(".tl-lite-viewport");
const touchlineMedia = document.querySelector(".tl-lite-media");
const touchlineFrameLayers = [...document.querySelectorAll("[data-touchline-frame-layer]")];
const touchlineFrameLabel = document.querySelector("#touchline-frame-label");
const touchlineClock = document.querySelector("#touchline-clock");
const touchlineTimeline = document.querySelector(".tl-lite-timeline");
const touchlineSequence = document.querySelector("#touchline-sequence");
const touchlineFilmstrip = document.querySelector("#touchline-filmstrip");
const touchlineSampleLabel = document.querySelector("#touchline-sample-label");
const touchlinePlayhead = document.querySelector("#touchline-playhead");
const touchlinePlay = document.querySelector("#touchline-play");
const touchlinePrevious = document.querySelector("#touchline-previous");
const touchlineNext = document.querySelector("#touchline-next");
const replayStage = document.querySelector("#replay-stage");
const replayCanvas = document.querySelector("#replay-canvas");
const replayModeButtons = [...document.querySelectorAll("[data-replay-mode]")];
const replayRange = document.querySelector("#replay-range");
const replayTime = document.querySelector("#replay-time");
const replayEvent = document.querySelector("#replay-event");
const replayFrame = document.querySelector("#replay-frame");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wormLensFilters = [...document.querySelectorAll("[data-worm-lens-filter]")]
  .map((filter) => ({
    mode: filter.dataset.wormLensFilter,
    magnificationNode: filter.querySelector("[data-worm-lens-magnification]"),
    refractionNode: filter.querySelector("[data-worm-lens-refraction]"),
    magnification: {
      value: Number(filter.querySelector("[data-worm-lens-magnification]")?.getAttribute("scale")) || 0,
      velocity: 0,
      target: 0,
    },
    refraction: {
      value: Number(filter.querySelector("[data-worm-lens-refraction]")?.getAttribute("scale")) || 0,
      velocity: 0,
      target: 0,
    },
  }));
const wormLensOpticalTargets = {
  desktop: {
    rest: { magnification: 7.68, refraction: 31.44 },
    active: { magnification: 16.5888, refraction: 42.4524 },
    pressed: { magnification: 16.128, refraction: 41.264 },
  },
  handset: {
    rest: { magnification: 3.84, refraction: 15.72 },
    active: { magnification: 8.2944, refraction: 21.2262 },
    pressed: { magnification: 8.064, refraction: 20.632 },
  },
};
// Use display-sized overview rasters on every device. The original 26 MP
// captures remain offline source material, while a dedicated high-quality
// crop supplies the pixel-level detail once the worm is zoomed.
const wormLargeOverview = window.matchMedia("(min-width: 600px)").matches;
const suspendWormLensDuringScroll = document.documentElement.classList.contains("is-handset")
  || window.matchMedia("(hover: none) and (pointer: coarse)").matches;

let activeProject = -1;
let heroPointer = { x: 0.74, y: 0.38 };
let heroPointerSmooth = { x: 0.74, y: 0.38 };
let heroPointerInside = false;
let heroPointerPresence = 0.16;
let heroPrecisionPointer = false;
let heroIsVisible = true;
let stagePointer = { x: 0.5, y: 0.5 };
let wormReadyTimer = 0;
let wormRasterTimer = 0;
let wormResetTimer = 0;
let wormFadeTimer = 0;
let wormAnimationFrame = 0;
let wormLensOpticsAnimationFrame = 0;
let wormLensOpticsPreviousTime = 0;
let wormLensRenderAnimationFrame = 0;
let wormLensRenderUntil = 0;
let wormLensScrollTimer = 0;
let wormLensScrollSuspended = false;
let wormLensWebGLRenderer = null;
let wormLensWebGLAttempted = false;
let wormLensWebGLPreparePromise = null;
let wormLensTexturePrewarm = { index: -1, promise: null };
let wormComparisonGeometry = { cropLeft: 0, cropWidth: 1, stageWidth: 0 };
let wormSliderMotion = {
  value: 0,
  time: 0,
  velocity: 0,
  startValue: 0,
  startTime: 0,
};
let activeWormImage = 0;
let isWormSwitching = false;
let wormSliderPointerId = null;
let replayMode = "camera";
let replayProgress = 0.525;
let touchlinePreview = null;
let touchlineRequestedFrameIndex = 79;
let touchlineActiveLayerIndex = 0;
let touchlineRenderRequest = 0;
let touchlinePlaybackFrame = 0;
let touchlinePlaybackPending = false;
let touchlinePlaybackStartedAt = 0;
let touchlinePlaybackStartedOnFrame = 1;
let touchlineScrubPointerId = null;
let touchlineScrubFrame = 0;
let touchlineScrubClientX = 0;
let touchlineDataPromise = null;
let oiiaCatViewerPromise = null;
let oiiaCatRuntimePromise = null;
let oiiaCatViewer = null;
let oiiaCatAnimationFrame = 0;
let oiiaCatPreviousTime = 0;
let oiiaCatAnimationHoldUntil = 0;
let oiiaCatResizeFrame = 0;
const OIIA_CAT_ENTRY_HOLD_MS = 1000;
const touchlineFrameImageCache = new Map();
const wormAssetCache = new Map();
const wormSourceCache = new Map();
const wormZoomSourceCache = new Map();
const wormFrameCache = new Map();
const wormDecodedFrames = new Set();
const wormZoomOpacityCache = new WeakMap();
let wormInteractionWarm = Promise.resolve();
let wormReadyPromise = null;
let wormPreparedZoom = { index: -1, promise: null };

const heroContourFoci = [
  { x: 0.77, y: 0.34, rx: 0.18, ry: 0.13, phase: 0.25 },
  { x: 0.91, y: 0.66, rx: 0.105, ry: 0.16, phase: 2.1 },
  { x: 0.57, y: 0.08, rx: 0.12, ry: 0.095, phase: 4.35 },
];

const heroTrackSeeds = [
  { id: "07", start: [0.53, 0.72], control: [0.68, 0.54], end: [0.88, 0.58], phase: 0.08, speed: 0.021, color: "200,255,55" },
  { id: "12", start: [0.62, 0.18], control: [0.79, 0.27], end: [0.94, 0.46], phase: 0.42, speed: 0.017, color: "78,126,255" },
  { id: "19", start: [0.48, 0.48], control: [0.69, 0.39], end: [1.02, 0.28], phase: 0.7, speed: 0.014, color: "244,243,238" },
  { id: "24", start: [0.69, 0.87], control: [0.76, 0.64], end: [0.98, 0.72], phase: 0.23, speed: 0.019, color: "200,255,55" },
  { id: "31", start: [0.43, 0.28], control: [0.65, 0.18], end: [0.86, 0.12], phase: 0.56, speed: 0.016, color: "78,126,255" },
  { id: "42", start: [0.58, 0.91], control: [0.76, 0.82], end: [1.01, 0.88], phase: 0.84, speed: 0.013, color: "244,243,238" },
];

// Downsampled metric coordinates from Touchline's verified 50-frame SNGS-021
// calibration run. Values are metres from pitch centre; no team labels are inferred.
const touchlineTracks = [
  { id: 1, points: [[0.49, 19.18], [0.49, 19.31], [0.48, 19.41], [0.49, 19.48], [0.47, 19.43], [0.46, 19.39], [0.45, 19.50]] },
  { id: 2, points: [[-9.90, 18.98], [-9.84, 19.12], [-9.82, 18.97], [-9.76, 19.15], [-9.79, 19.14], [-9.74, 19.22], [-10.01, 19.38]] },
  { id: 3, points: [[0.11, 25.83], [0.12, 25.95], [0.11, 26.19], [0.14, 26.31], [0.16, 26.24], [0.17, 26.17], [0.19, 26.42]] },
  { id: 4, points: [[-3.06, 9.19], [-2.96, 9.22], [-2.91, 9.18], [-2.78, 9.15], [-2.81, 9.16], [-2.86, 9.20], [-2.98, 9.22]] },
  { id: 5, points: [[-8.38, -2.22], [-8.39, -2.19], [-8.37, -2.33], [-8.33, -2.20], [-8.32, -2.20], [-8.29, -2.24], [-8.31, -2.28]] },
  { id: 6, points: [[9.83, -4.48], [9.79, -4.42], [9.82, -4.56], [9.78, -4.74], [9.79, -4.62], [9.81, -4.76], [9.76, -4.74]] },
  { id: 7, points: [[9.85, 2.17], [9.55, 2.55], [9.38, 2.80], [9.17, 2.69], [9.05, 2.74], [8.89, 3.05], [8.92, 2.85]] },
  { id: 8, points: [[-11.46, 5.43], [-11.29, 5.59], [-11.12, 5.75], [-10.99, 5.90], [-10.83, 5.89], [-10.64, 5.89], [-10.46, 5.97]] },
];

const wormImages = [
  { id: "3746", overviewSource: "/assets/demos/worm-profiler-stage.webp", overviewSourceLarge: "/assets/demos/worm-profiler-stage-3200.webp", zoomSource: "/assets/demos/worm-3746-zoom.webp", segmentation: "/assets/demos/worm-profiler-segmentation-tiff.webp", crop: [3396, 1341, 837, 942], zoomCrop: [2747, 1012, 2135, 1601] },
  { id: "9539", overviewSource: "/assets/demos/worm-9539-stage.webp", overviewSourceLarge: "/assets/demos/worm-9539-stage-3200.webp", zoomSource: "/assets/demos/worm-9539-zoom.webp", segmentation: "/assets/demos/worm-9539-segmentation.webp", crop: [1726, 1112, 1044, 1122], zoomCrop: [977, 720, 2543, 1907] },
  { id: "0175", overviewSource: "/assets/demos/worm-0175-stage.webp", overviewSourceLarge: "/assets/demos/worm-0175-stage-3200.webp", zoomSource: "/assets/demos/worm-0175-zoom.webp", segmentation: "/assets/demos/worm-0175-segmentation.webp", crop: [1227, 918, 1153, 1040], zoomCrop: [625, 554, 2357, 1768] },
  { id: "0191", overviewSource: "/assets/demos/worm-0191-stage.webp", overviewSourceLarge: "/assets/demos/worm-0191-stage-3200.webp", zoomSource: "/assets/demos/worm-0191-zoom.webp", segmentation: "/assets/demos/worm-0191-segmentation.webp", crop: [3457, 2068, 978, 1092], zoomCrop: [2709, 1686, 2475, 1856] },
  { id: "2852", overviewSource: "/assets/demos/worm-2852-stage.webp", overviewSourceLarge: "/assets/demos/worm-2852-stage-3200.webp", zoomSource: "/assets/demos/worm-2852-zoom.webp", segmentation: "/assets/demos/worm-2852-segmentation.webp", crop: [3126, 1618, 1302, 1201], zoomCrop: [2416, 1198, 2723, 2042] },
  { id: "1201", overviewSource: "/assets/demos/worm-1201-stage.webp", overviewSourceLarge: "/assets/demos/worm-1201-stage-3200.webp", zoomSource: "/assets/demos/worm-1201-zoom.webp", segmentation: "/assets/demos/worm-1201-segmentation.webp", crop: [3835, 935, 447, 1153], zoomCrop: [2752, 532, 2613, 1960] },
].map((image) => ({
  ...image,
  dimensions: [image.crop[2], image.crop[3]],
  crop: {
    x: image.crop[0] / 6240,
    y: image.crop[1] / 4160,
    width: image.crop[2] / 6240,
    height: image.crop[3] / 4160,
  },
  zoomCrop: {
    x: image.zoomCrop[0] / 6240,
    y: image.zoomCrop[1] / 4160,
    width: image.zoomCrop[2] / 6240,
    height: image.zoomCrop[3] / 4160,
  },
}));

const wormCueAssets = [
  "/assets/demos/region-of-interest.svg",
  "/assets/demos/key-donor.svg",
  "/assets/demos/key-background.svg",
  "/assets/demos/key-host.svg",
  "/assets/demos/key-eyes.svg",
  "/assets/demos/worm-slider-lens-magnify.png?v=20260930-01",
  "/assets/demos/worm-slider-lens-bezel.png?v=20260930-01",
  "/assets/demos/worm-slider-lens-specular.png?v=20260930-01",
];

const STREAMLINE_CACHE_PREFIX = "george-portfolio-streamline-";

function settleWithin(promise, timeout) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((resolve) => window.setTimeout(resolve, timeout)),
  ]);
}

async function registerStreamlineWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalDevelopment = location.hostname === "localhost"
    || location.hostname === "127.0.0.1";

  if (isLocalDevelopment) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations
      .filter((registration) => new URL(registration.scope).origin === location.origin)
      .map((registration) => registration.unregister()));

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys
        .filter((key) => key.startsWith(STREAMLINE_CACHE_PREFIX))
        .map((key) => caches.delete(key)));
    }
    return;
  }

  const registration = await navigator.serviceWorker.register(
    "/streamline-sw.js?v=20260925-02",
    { scope: "/", updateViaCache: "none" },
  );
  await settleWithin(navigator.serviceWorker.ready, 4000);
  if (navigator.serviceWorker.controller || !registration.active) return;

  await settleWithin(new Promise((resolve) => {
    navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
  }), 2500);
}

function loadDecodedWormAsset(url) {
  const cached = wormAssetCache.get(url);
  if (cached) return cached;

  const pendingImage = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "high";
    image.onload = async () => {
      try {
        await image.decode();
      } catch {
        // A completed image can still be retained when explicit decoding is unavailable.
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Could not load Worm Profiler asset ${url}.`));
    image.src = url;
  });

  wormAssetCache.set(url, pendingImage);
  pendingImage.catch(() => wormAssetCache.delete(url));
  return pendingImage;
}

function wormSourceUrl(index) {
  const image = wormImages[index];
  return wormLargeOverview ? image.overviewSourceLarge : image.overviewSource;
}

function wormZoomSourceUrl(index) {
  return wormImages[index].zoomSource;
}

function cacheWormSource(index) {
  const cached = wormSourceCache.get(index);
  if (cached) return cached;

  const url = wormSourceUrl(index);
  const pendingSource = fetch(url, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Could not cache Worm Profiler source ${url}.`);
      await response.blob();
      return url;
    });

  wormSourceCache.set(index, pendingSource);
  pendingSource.catch(() => wormSourceCache.delete(index));
  return pendingSource;
}

function cacheWormZoomSource(index) {
  const cached = wormZoomSourceCache.get(index);
  if (cached) return cached;

  const url = wormZoomSourceUrl(index);
  const pendingSource = fetch(url, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Could not cache Worm Profiler zoom source ${url}.`);
      await response.blob();
      return url;
    });

  wormZoomSourceCache.set(index, pendingSource);
  pendingSource.catch(() => wormZoomSourceCache.delete(index));
  return pendingSource;
}

async function loadWormZoomImage(index) {
  const image = wormImages[index];
  const sourceUrl = await cacheWormZoomSource(index);
  const source = new Image();
  source.className = "worm-zoom-source";
  source.alt = "";
  source.decoding = "sync";
  source.fetchPriority = "high";
  source.loading = "eager";
  source.setAttribute("aria-hidden", "true");

  await new Promise((resolve, reject) => {
    source.onload = async () => {
      try {
        await source.decode();
      } catch {
        // A completed crop is still safe to display when explicit decoding is unavailable.
      }
      resolve();
    };
    source.onerror = reject;
    source.src = sourceUrl;
  });

  source.dataset.wormId = image.id;
  return source;
}

function prepareWormZoomImage(index) {
  if (wormPreparedZoom.index === index && wormPreparedZoom.promise) {
    return wormPreparedZoom.promise;
  }

  const promise = loadWormZoomImage(index);
  wormPreparedZoom = { index, promise };
  promise.catch(() => {
    if (wormPreparedZoom.promise === promise) {
      wormPreparedZoom = { index: -1, promise: null };
    }
  });
  return promise;
}

function loadWormImage(index) {
  const cached = wormFrameCache.get(index);
  if (cached) return cached;

  const image = wormImages[index];
  const pendingFrame = Promise.all([
    cacheWormSource(index),
    loadDecodedWormAsset(image.segmentation),
  ]).then(async ([sourceUrl, segmentation]) => {
    const source = new Image();
    source.decoding = "sync";
    source.fetchPriority = "high";
    source.loading = "eager";
    await new Promise((resolve, reject) => {
      source.onload = async () => {
        try {
          await source.decode();
        } catch {
          // The load event still guarantees a complete source when decode is unavailable.
        }
        resolve();
      };
      source.onerror = reject;
      source.src = sourceUrl;
    });
    source.className = "worm-source";
    source.alt = `Camera image ${image.id} containing a planarian worm`;
    segmentation.className = "worm-segmentation";
    segmentation.alt = "";
    wormDecodedFrames.add(index);
    wormLoading.textContent = `Preparing camera-image set · ${wormDecodedFrames.size} / ${wormImages.length}`;
    return { source, segmentation };
  });

  wormFrameCache.set(index, pendingFrame);
  pendingFrame.catch(() => wormFrameCache.delete(index));
  return pendingFrame;
}

function prewarmWormNeighbors(index) {
  const keep = new Set([
    index,
    (index - 1 + wormImages.length) % wormImages.length,
    (index + 1) % wormImages.length,
  ]);

  // Keep lightweight overviews ready in both navigation directions. The
  // current lossless zoom crop is decoded separately; neighbouring crops are
  // fetched only after the user enters the zoomed view.
  const pendingSources = Promise.allSettled([...keep].map(cacheWormSource));
  wormFrameCache.forEach((_, cachedIndex) => {
    if (cachedIndex !== index) wormFrameCache.delete(cachedIndex);
  });
  return pendingSources;
}

function prewarmWormZoomNeighbors(index) {
  return Promise.allSettled([
    cacheWormZoomSource((index - 1 + wormImages.length) % wormImages.length),
    cacheWormZoomSource((index + 1) % wormImages.length),
  ]);
}

function prepareWormTransitionLayers(...layers) {
  const imageDecodes = layers.flatMap((layer) =>
    [...layer.querySelectorAll("img")].map((image) => {
      if (typeof image.decode !== "function") return Promise.resolve();
      return image.decode().catch(() => {});
    }),
  );

  return Promise.all(imageDecodes).then(
    () => new Promise((resolve) => {
      layers.forEach((layer) => layer.getBoundingClientRect());
      requestAnimationFrame(() => {
        layers.forEach((layer) => getComputedStyle(layer).transform);
        requestAnimationFrame(resolve);
      });
    }),
  );
}

function createWormRoiAnimation(corner, currentTime = 0) {
  if (!corner.animate || reducedMotion) return null;

  const style = getComputedStyle(corner);
  const lockX = style.getPropertyValue("--lock-x").trim() || "0px";
  const lockY = style.getPropertyValue("--lock-y").trim() || "0px";
  const animation = corner.animate(
    [
      { transform: "translate(0, 0)", opacity: 0.72 },
      { transform: `translate(${lockX}, ${lockY})`, opacity: 1, offset: 0.5 },
      { transform: "translate(0, 0)", opacity: 0.72 },
    ],
    {
      duration: 1500,
      easing: "cubic-bezier(0.45, 0, 0.55, 1)",
      iterations: Infinity,
    },
  );

  animation.id = "worm-roi-motion";
  animation.currentTime = currentTime;
  animation.play();
  return animation;
}

function startWormRoiMotion(stage, currentTimes = []) {
  return [...stage.querySelectorAll(".roi-target > i")].map((corner, index) => {
    const existing = corner.getAnimations?.().find((animation) => animation.id === "worm-roi-motion");
    if (existing) {
      existing.play();
      return existing;
    }
    return createWormRoiAnimation(corner, currentTimes[index] ?? 0);
  });
}

function synchronizeWormRoiMotion(sourceStage, clonedStage) {
  const sourceAnimations = startWormRoiMotion(sourceStage);
  const currentTimes = sourceAnimations.map((animation) => animation?.currentTime ?? 0);
  startWormRoiMotion(clonedStage, currentTimes);
}

function waitForWormTrack(track) {
  if (reducedMotion) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      track.removeEventListener("animationend", handleAnimationEnd);
      window.clearTimeout(fallback);
      resolve();
    };
    const handleAnimationEnd = (event) => {
      if (event.target.classList?.contains("is-swipe-incoming")) finish();
    };
    const fallback = window.setTimeout(finish, 840);

    track.addEventListener("animationend", handleAnimationEnd);
  });
}

function applyWormFrameToStage(stage, index, assets) {
  const image = wormImages[index];
  const { crop, zoomCrop } = image;
  const media = stage.querySelector(".worm-media");
  const currentSegmentation = stage.querySelector(".worm-segmentation");

  media.replaceChildren(assets.source);
  if (assets.zoomSource) media.append(assets.zoomSource);
  stage.classList.toggle("is-zoom-raster-ready", Boolean(assets.zoomSource));
  if (assets.zoomSource) wormZoomOpacityCache.set(stage, 1);
  else wormZoomOpacityCache.delete(stage);
  currentSegmentation.replaceWith(assets.segmentation);
  stage.dataset.wormId = image.id;
  stage.style.setProperty("--crop-left", `${crop.x * 100}%`);
  stage.style.setProperty("--crop-top", `${crop.y * 100}%`);
  stage.style.setProperty("--crop-width", `${crop.width * 100}%`);
  stage.style.setProperty("--crop-height", `${crop.height * 100}%`);
  stage.style.setProperty("--roi-left", `${(-0.0625 + 1.125 * crop.x) * 100}%`);
  stage.style.setProperty("--roi-top", `${crop.y * 100}%`);
  stage.style.setProperty("--roi-width", `${1.125 * crop.width * 100}%`);
  stage.style.setProperty("--roi-height", `${crop.height * 100}%`);
  stage.style.setProperty("--zoom-source-left", `${zoomCrop.x * 100}%`);
  stage.style.setProperty("--zoom-source-top", `${zoomCrop.y * 100}%`);
  stage.style.setProperty("--zoom-source-width", `${zoomCrop.width * 100}%`);
  stage.style.setProperty("--zoom-source-height", `${zoomCrop.height * 100}%`);
  stage.querySelector(".roi-dimensions").textContent = `${image.dimensions[0]} × ${image.dimensions[1]} px`;
}

function commitWormZoomSource(source, stage, media, index) {
  if (!source
    || wormStage !== stage
    || wormMedia !== media
    || activeWormImage !== index
    || stage.dataset.wormId !== wormImages[index].id
    || !stage.classList.contains("is-zoomed")) return;

  const existing = media.querySelector(".worm-zoom-source");
  if (existing !== source) {
    if (existing) existing.replaceWith(source);
    else media.append(source);
  }
  wormZoomOpacityCache.delete(stage);
  stage.classList.add("is-zoom-raster-ready");
  void prepareWormLensStagesForWebGL([stage], { allowHidden: true });
  requestWormLensRender(180);
}

function prepareIncomingWormStage(stage, index) {
  if (!stage.classList.contains("is-zoomed")) return;

  const crop = wormImages[index].crop;
  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;
  const usableHeight = Math.max(1, stageHeight - 52);
  const planeWidth = stageWidth * 1.125;
  const planeHeight = stageHeight;
  const planeLeft = stageWidth * -0.0625;
  const targetHeight = usableHeight * 0.88;
  const scale = targetHeight / (planeHeight * crop.height);
  const cropCentreX = planeWidth * (crop.x + crop.width / 2);
  const cropCentreY = planeHeight * (crop.y + crop.height / 2);
  const targetCentreX = stageWidth / 2;
  const targetCentreY = usableHeight / 2;
  const translateX = targetCentreX - planeLeft - scale * cropCentreX;
  const translateY = targetCentreY - scale * cropCentreY;
  const cropWidth = planeWidth * crop.width * scale;
  const cropLeft = targetCentreX - cropWidth / 2;
  const comparisonValue = Number(wormComparisonRange.value);
  const lineX = stageWidth * (comparisonValue / 100);
  const cropReveal = Math.max(0, Math.min(100, ((lineX - cropLeft) / cropWidth) * 100));

  stage.style.setProperty(
    "--zoom-transform",
    `translate(${translateX}px, ${translateY}px) scale(${scale})`,
  );
  stage.style.setProperty("--reveal", `${cropReveal}%`);
  stage.style.setProperty("--line-x", `${lineX}px`);
}

function adoptWormStage(stage) {
  wormStage = stage;
  wormStage.id = "worm-stage";
  wormMedia = stage.querySelector(".worm-media");
  wormMedia.id = "worm-media";
  wormZoomTrigger = stage.querySelector(".worm-zoom-trigger");
  wormZoomTrigger.id = "worm-zoom-trigger";
  wormSource = stage.querySelector(".worm-source");
  wormSegmentation = stage.querySelector(".worm-segmentation");
  wormLoading = stage.querySelector(".worm-loading");
  roiDimensions = stage.querySelector(".roi-dimensions");
  roiDimensions.id = "roi-dimensions";
  wormKey = stage.querySelector(".worm-key");
  wormZoomTrigger.addEventListener("click", zoomWormView);
}

function setWormNavigationBusy(isBusy) {
  wormSequenceNav.classList.toggle("is-loading", isBusy);
  wormSequenceNav.setAttribute("aria-busy", String(isBusy));
  wormPrevious.disabled = isBusy;
  wormNext.disabled = isBusy;
}

function commitWormImage(index, assets) {
  activeWormImage = index;
  applyWormFrameToStage(wormStage, index, assets);
  wormSource = assets.source;
  wormSegmentation = assets.segmentation;
  wormSequenceCount.textContent = `${String(index + 1).padStart(2, "0")} / ${String(wormImages.length).padStart(2, "0")}`;

  if (wormStage.classList.contains("is-zoomed")) computeWormGeometry();
  else updateWormComparison(Number(wormComparisonRange.value));
}

async function prepareWormImageSet(initialIndexes = [0]) {
  setWormNavigationBusy(true);
  wormStage.setAttribute("aria-busy", "true");

  try {
    const primaryIndex = initialIndexes[0] ?? 0;
    const primaryFrame = await loadWormImage(primaryIndex);
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        commitWormImage(primaryIndex, primaryFrame);
        wormStage.classList.add("is-assets-ready");
        wormStage.setAttribute("aria-busy", "false");
        resolve();
      });
    });
    wormInteractionWarm = Promise.allSettled([
      prewarmWormNeighbors(primaryIndex),
      prepareWormZoomImage(primaryIndex),
      Promise.allSettled(wormCueAssets.map(loadDecodedWormAsset)),
    ]);
    wormLoading.textContent = "Camera-image set ready";
  } catch (error) {
    console.warn(error);
    wormStage.classList.add("is-assets-ready");
    wormStage.setAttribute("aria-busy", "false");
  } finally {
    setWormNavigationBusy(false);
  }
}

function ensureWormReady() {
  if (!wormReadyPromise) {
    wormReadyPromise = prepareWormImageSet([activeWormImage]).catch((error) => {
      wormReadyPromise = null;
      throw error;
    });
  }
  return wormReadyPromise;
}

async function applyWormImage(index, direction) {
  if (isWormSwitching) return;

  const nextIndex = (index + wormImages.length) % wormImages.length;
  if (nextIndex === activeWormImage) return;

  isWormSwitching = true;
  setWormNavigationBusy(true);
  const outgoingStage = wormStage;
  let incomingStage = null;
  let track = null;
  let adopted = false;

  try {
    const isZoomed = outgoingStage.classList.contains("is-zoomed");
    const [frameAssets, zoomSource] = await Promise.all([
      loadWormImage(nextIndex),
      isZoomed ? prepareWormZoomImage(nextIndex) : Promise.resolve(null),
    ]);
    const assets = zoomSource ? { ...frameAssets, zoomSource } : frameAssets;
    cancelAnimationFrame(wormAnimationFrame);

    incomingStage = outgoingStage.cloneNode(true);
    incomingStage.removeAttribute("id");
    incomingStage.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    incomingStage.setAttribute("aria-hidden", "true");
    incomingStage.classList.add("is-preparing-switch", "is-swipe-incoming");
    outgoingStage.classList.add("is-swipe-outgoing");
    applyWormFrameToStage(incomingStage, nextIndex, assets);

    track = document.createElement("div");
    const preparationClass = direction > 0 ? "is-preparing-next" : "is-preparing-previous";
    const switchingClass = direction > 0 ? "is-switching-next" : "is-switching-previous";
    track.className = `worm-swipe-track ${preparationClass}`;
    outgoingStage.parentElement.insertBefore(track, outgoingStage);
    track.append(outgoingStage, incomingStage);

    prepareIncomingWormStage(incomingStage, nextIndex);
    synchronizeWormRoiMotion(outgoingStage, incomingStage);
    const lensPreparation = prepareWormLensStagesForWebGL([outgoingStage, incomingStage]);
    await Promise.all([
      prepareWormTransitionLayers(outgoingStage, incomingStage),
      settleWithin(lensPreparation, 180),
    ]);
    void track.offsetWidth;
    track.classList.remove(preparationClass);
    track.classList.add(switchingClass);
    requestWormLensRender(520);
    await waitForWormTrack(track);

    incomingStage.removeAttribute("aria-hidden");
    incomingStage.classList.remove("is-preparing-switch", "is-swipe-incoming");
    outgoingStage.classList.remove("is-swipe-outgoing");
    outgoingStage.removeAttribute("id");
    track.replaceWith(incomingStage);
    adoptWormStage(incomingStage);
    adopted = true;
    activeWormImage = nextIndex;
    void prewarmWormLensFrame(nextIndex);
    wormSequenceCount.textContent = `${String(nextIndex + 1).padStart(2, "0")} / ${String(wormImages.length).padStart(2, "0")}`;
    if (wormStage.classList.contains("is-zoomed")) computeWormGeometry();
    else updateWormComparison(Number(wormComparisonRange.value));
    requestWormLensRender(180);

    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    prewarmWormNeighbors(nextIndex);
    if (wormStage.classList.contains("is-zoomed")) {
      prewarmWormZoomNeighbors(nextIndex);
    } else {
      prepareWormZoomImage(nextIndex).catch(() => {});
    }
  } catch (error) {
    console.warn(error);
  } finally {
    if (!adopted && track?.isConnected) {
      outgoingStage.classList.remove("is-swipe-outgoing");
      track.replaceWith(outgoingStage);
    }
    isWormSwitching = false;
    setWormNavigationBusy(false);
  }
}

function padNumber(value) {
  return String(value + 1).padStart(2, "0");
}

function touchlineSubjectLabel(player) {
  if (player.role === "referee") return "REF";
  if (player.role === "ball") return "BALL";
  return player.jersey || player.label || "?";
}

function fitTouchlineMedia() {
  const width = touchlineViewport.clientWidth;
  const height = touchlineViewport.clientHeight;
  if (!width || !height) return;
  const mediaRatio = 16 / 9;
  if (width / height > mediaRatio) {
    touchlineMedia.style.width = `${height * mediaRatio}px`;
    touchlineMedia.style.height = `${height}px`;
  } else {
    touchlineMedia.style.width = `${width}px`;
    touchlineMedia.style.height = `${width / mediaRatio}px`;
  }
}

new ResizeObserver(fitTouchlineMedia).observe(touchlineViewport);

function updateTouchlineTimeline(index) {
  const sample = touchlinePreview.frames[index];
  const previewNumber = String(index + 1).padStart(3, "0");
  const previewProgress = index / Math.max(1, touchlinePreview.frames.length - 1);
  touchlineSampleLabel.textContent = `${previewNumber} / ${touchlinePreview.frames.length}`;
  touchlineClock.textContent = formatTouchlineClock(sample.frame / touchlinePreview.media.frame_rate);
  touchlinePlayhead.style.left = `${previewProgress * 100}%`;
  touchlineSequence.setAttribute("aria-valuenow", String(index + 1));
  touchlineSequence.setAttribute("aria-valuetext", `Preview ${index + 1} of ${touchlinePreview.frames.length}`);
  const filmstripFrames = touchlineFilmstrip.querySelectorAll("span");
  const activeThumbnail = Math.min(filmstripFrames.length - 1, Math.floor(previewProgress * filmstripFrames.length));
  filmstripFrames.forEach((frame, frameIndex) => frame.classList.toggle("is-current", frameIndex === activeThumbnail));
}

function buildTouchlineMarkers(sample) {
  const { width, height } = touchlinePreview.media;
  return sample.players.map((player) => {
    const marker = document.createElement("span");
    marker.className = "tl-lite-player";
    if (player.team === "right") marker.classList.add("is-away");
    if (player.role === "referee") marker.classList.add("is-official");
    if (player.role === "ball") marker.classList.add("is-ball");
    marker.style.left = `${player.image.x / width * 100}%`;
    marker.style.top = `${player.image.y / height * 100}%`;
    marker.style.width = `${player.image.w / width * 100}%`;
    marker.style.height = `${player.image.h / height * 100}%`;
    const label = document.createElement("b");
    label.textContent = touchlineSubjectLabel(player);
    marker.append(label);
    return marker;
  });
}

function loadTouchlineFrameImage(sample) {
  const cached = touchlineFrameImageCache.get(sample.image);
  if (cached) return cached;
  const pendingImage = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try {
        await image.decode();
      } catch {
        // A completed image is still safe to display when explicit decoding is unavailable.
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Could not load Touchline ${sample.image}.`));
    image.src = `/assets/demos/touchline/${sample.image}`;
  });
  touchlineFrameImageCache.set(sample.image, pendingImage);
  pendingImage.catch(() => touchlineFrameImageCache.delete(sample.image));
  return pendingImage;
}

function pruneTouchlineFrameCache(centreIndex, radiusBefore = 4, radiusAfter = 12) {
  if (!touchlinePreview?.frames?.length) return;
  const first = Math.max(0, centreIndex - radiusBefore);
  const last = Math.min(touchlinePreview.frames.length - 1, centreIndex + radiusAfter);
  const keep = new Set(
    touchlinePreview.frames.slice(first, last + 1).map((sample) => sample.image),
  );
  touchlineFrameImageCache.forEach((_, key) => {
    if (!keep.has(key)) touchlineFrameImageCache.delete(key);
  });
}

async function renderTouchlineFrame(index) {
  if (!touchlinePreview?.frames?.length) return false;
  const targetIndex = Math.max(0, Math.min(touchlinePreview.frames.length - 1, index));
  const request = ++touchlineRenderRequest;
  const sample = touchlinePreview.frames[targetIndex];
  touchlineRequestedFrameIndex = targetIndex;
  updateTouchlineTimeline(targetIndex);

  try {
    const decodedImage = await loadTouchlineFrameImage(sample);
    if (request !== touchlineRenderRequest) return false;

    const nextLayerIndex = touchlineFrameLayers.length > 1 ? 1 - touchlineActiveLayerIndex : 0;
    const nextLayer = touchlineFrameLayers[nextLayerIndex];
    const nextImage = nextLayer.querySelector("img");
    const nextOverlay = nextLayer.querySelector(".tl-lite-tracks");
    nextImage.src = decodedImage.src;
    nextImage.alt = `SoccerNet SNGS-021 frame ${sample.frame} with Touchline player tracking overlay`;
    try {
      await nextImage.decode();
    } catch {
      // The cached image has already loaded; continue with an atomic layer swap.
    }
    if (request !== touchlineRenderRequest) return false;

    nextOverlay.replaceChildren(...buildTouchlineMarkers(sample));
    const currentLayer = touchlineFrameLayers[touchlineActiveLayerIndex];
    currentLayer.classList.remove("is-current");
    currentLayer.setAttribute("aria-hidden", "true");
    nextLayer.classList.add("is-current");
    nextLayer.removeAttribute("aria-hidden");
    touchlineActiveLayerIndex = nextLayerIndex;
    const previewNumber = String(targetIndex + 1).padStart(3, "0");
    touchlineFrameLabel.textContent = `Preview ${previewNumber} / ${touchlinePreview.frames.length}`;
    preloadTouchlineFrames(targetIndex + 1, 8);
    pruneTouchlineFrameCache(targetIndex);
    return true;
  } catch (error) {
    if (request === touchlineRenderRequest) console.error(error);
    return false;
  }
}

function preloadTouchlineFrames(startIndex, count = 10) {
  if (!touchlinePreview?.frames) return Promise.resolve([]);
  const pendingFrames = touchlinePreview.frames
    .slice(startIndex, startIndex + count)
    .map((sample) => loadTouchlineFrameImage(sample));
  return Promise.allSettled(pendingFrames);
}

function formatTouchlineClock(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = (safeSeconds % 60).toFixed(2).padStart(5, "0");
  return `${String(minutes).padStart(2, "0")}:${remaining}`;
}

function buildTouchlineFilmstrip() {
  if (!touchlinePreview?.frames?.length || touchlineFilmstrip.childElementCount) return;
  const thumbnailCount = 12;
  const thumbnails = Array.from({ length: thumbnailCount }, (_, thumbnailIndex) => {
    const sampleIndex = Math.round((thumbnailIndex / (thumbnailCount - 1)) * (touchlinePreview.frames.length - 1));
    const sample = touchlinePreview.frames[sampleIndex];
    const frame = document.createElement("span");
    const image = document.createElement("img");
    const time = document.createElement("small");
    image.src = `/assets/demos/touchline/${sample.image}`;
    image.alt = "";
    image.loading = "lazy";
    time.textContent = formatTouchlineClock(sample.frame / touchlinePreview.media.frame_rate).slice(0, 5);
    frame.append(image, time);
    return frame;
  });
  touchlineFilmstrip.replaceChildren(...thumbnails);
}

function ensureTouchlineData() {
  if (window.TOUCHLINE_PREVIEW) return Promise.resolve(window.TOUCHLINE_PREVIEW);
  if (touchlineDataPromise) return touchlineDataPromise;

  touchlineDataPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/assets/demos/touchline/preview-data.js?v=20260819-1";
    script.async = true;
    script.onload = () => {
      if (window.TOUCHLINE_PREVIEW) resolve(window.TOUCHLINE_PREVIEW);
      else reject(new Error("Touchline preview data loaded without a preview payload."));
    };
    script.onerror = () => reject(new Error("Touchline preview data is unavailable."));
    document.head.append(script);
  }).catch((error) => {
    touchlineDataPromise = null;
    throw error;
  });

  return touchlineDataPromise;
}

async function loadTouchlineDemo() {
  if (touchlinePreview) {
    buildTouchlineFilmstrip();
    return touchlinePreview;
  }

  touchlinePreview = await ensureTouchlineData();
  buildTouchlineFilmstrip();
  preloadTouchlineFrames(touchlineRequestedFrameIndex, 10);
  await renderTouchlineFrame(touchlineRequestedFrameIndex);
  return touchlinePreview;
}

function stopTouchlinePlayback() {
  cancelAnimationFrame(touchlinePlaybackFrame);
  touchlinePlaybackFrame = 0;
  touchlinePlaybackPending = false;
  touchlinePlay.dataset.state = "play";
  touchlinePlay.setAttribute("aria-label", "Play Touchline demo");
}

function scrubTouchlineFromPointer(clientX) {
  if (!touchlinePreview?.frames?.length) return;
  const bounds = touchlineSequence.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
  renderTouchlineFrame(Math.round(progress * (touchlinePreview.frames.length - 1)));
}

function queueTouchlineScrub(clientX) {
  touchlineScrubClientX = clientX;
  if (touchlineScrubFrame) return;
  touchlineScrubFrame = requestAnimationFrame(() => {
    touchlineScrubFrame = 0;
    scrubTouchlineFromPointer(touchlineScrubClientX);
  });
}

function toggleTouchlinePlayback() {
  if (touchlinePlaybackFrame || touchlinePlaybackPending) {
    stopTouchlinePlayback();
    return;
  }
  touchlinePlaybackPending = true;
  touchlinePlay.dataset.state = "loading";
  touchlinePlay.setAttribute("aria-label", "Buffering Touchline demo");
  loadTouchlineDemo().then(async () => {
    if (touchlineRequestedFrameIndex >= touchlinePreview.frames.length - 1) await renderTouchlineFrame(0);
    await preloadTouchlineFrames(touchlineRequestedFrameIndex, 10);
    if (!touchlinePlaybackPending) return;
    touchlinePlaybackPending = false;
    touchlinePlaybackStartedAt = performance.now();
    touchlinePlaybackStartedOnFrame = touchlinePreview.frames[touchlineRequestedFrameIndex].frame;
    touchlinePlay.dataset.state = "pause";
    touchlinePlay.setAttribute("aria-label", "Pause Touchline demo");
    const advance = (now) => {
      const elapsedSeconds = (now - touchlinePlaybackStartedAt) / 1000;
      const sourceFrame = touchlinePlaybackStartedOnFrame + elapsedSeconds * touchlinePreview.media.frame_rate;
      const targetIndex = Math.min(
        touchlinePreview.frames.length - 1,
        Math.floor((sourceFrame - 1) / touchlinePreview.media.sample_stride),
      );
      if (targetIndex !== touchlineRequestedFrameIndex) {
        renderTouchlineFrame(targetIndex);
        preloadTouchlineFrames(targetIndex);
      }
      if (sourceFrame >= touchlinePreview.media.frame_count) {
        renderTouchlineFrame(touchlinePreview.frames.length - 1);
        stopTouchlinePlayback();
        return;
      }
      touchlinePlaybackFrame = requestAnimationFrame(advance);
    };
    touchlinePlaybackFrame = requestAnimationFrame(advance);
  }).catch(() => stopTouchlinePlayback());
}

function resizeOiiiaCatViewer() {
  if (!oiiaCatViewer || !oiiaCatCanvas || projectPlaceholder.hidden) return;
  const width = Math.max(1, oiiaCatCanvas.clientWidth);
  const height = Math.max(1, oiiaCatCanvas.clientHeight);
  if (width <= 1 || height <= 1) return;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  oiiaCatViewer.renderer.setPixelRatio(pixelRatio);
  oiiaCatViewer.renderer.setSize(width, height, false);
  oiiaCatViewer.camera.aspect = width / height;
  oiiaCatViewer.camera.updateProjectionMatrix();
}

function renderOiiiaCat(time) {
  if (!oiiaCatViewer || projectPlaceholder.hidden) {
    oiiaCatAnimationFrame = 0;
    oiiaCatPreviousTime = 0;
    return;
  }

  const delta = oiiaCatPreviousTime ? Math.min(0.05, (time - oiiaCatPreviousTime) / 1000) : 0;
  oiiaCatPreviousTime = time;
  if (!reducedMotion && time >= oiiaCatAnimationHoldUntil) {
    oiiaCatViewer.mixer?.update(delta);
  }
  oiiaCatViewer.controls.update();
  oiiaCatViewer.renderer.render(oiiaCatViewer.scene, oiiaCatViewer.camera);
  oiiaCatAnimationFrame = requestAnimationFrame(renderOiiiaCat);
}

function restoreOiiiaCatView({ restartAnimation = false } = {}) {
  if (!oiiaCatViewer) return;
  const { camera, controls, defaultView, mixer, renderer, scene } = oiiaCatViewer;
  const dampingEnabled = controls.enableDamping;
  controls.enableDamping = false;
  controls.reset();
  camera.position.copy(defaultView.position);
  camera.quaternion.copy(defaultView.quaternion);
  camera.zoom = defaultView.zoom;
  controls.target.copy(defaultView.target);
  camera.updateProjectionMatrix();
  controls.update();
  controls.enableDamping = dampingEnabled;
  if (restartAnimation) {
    mixer?.setTime(0);
    oiiaCatAnimationHoldUntil = performance.now() + OIIA_CAT_ENTRY_HOLD_MS;
  }
  oiiaCatPreviousTime = 0;
  oiiaCatReset.hidden = true;
  renderer.render(scene, camera);
}

function loadOiiiaCatRuntime() {
  if (!oiiaCatRuntimePromise) {
    oiiaCatRuntimePromise = Promise.all([
      import("three"),
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/controls/OrbitControls.js"),
    ]);
  }
  return oiiaCatRuntimePromise;
}

function startOiiiaCatViewer() {
  if (oiiaCatViewer) {
    restoreOiiiaCatView({ restartAnimation: true });
    resizeOiiiaCatViewer();
    if (!oiiaCatAnimationFrame) oiiaCatAnimationFrame = requestAnimationFrame(renderOiiiaCat);
    return Promise.resolve(oiiaCatViewer);
  }

  if (oiiaCatViewerPromise) return oiiaCatViewerPromise;
  projectPlaceholder.classList.remove("is-error");
  projectPlaceholder.classList.add("is-loading");
  oiiaCatLoading.hidden = false;
  oiiaCatLoading.textContent = "Loading 3D cat…";

  oiiaCatViewerPromise = loadOiiiaCatRuntime().then(([THREE, { GLTFLoader }, { OrbitControls }]) => new Promise((resolve, reject) => {
    const renderer = new THREE.WebGLRenderer({
      canvas: oiiaCatCanvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x242424, 2.6);
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(2.5, 4, 3.5);
    rimLight.position.set(-3, 1.5, -2);
    scene.add(hemisphere, keyLight, rimLight);

    new GLTFLoader().load(
      "/assets/placeholders/oiia-cat.glb",
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        model.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const centre = bounds.getCenter(new THREE.Vector3());
        const extent = Math.max(size.x, size.y, size.z, 0.1);
        model.position.sub(centre);
        const initialCamera = new THREE.Spherical().setFromVector3(
          new THREE.Vector3(extent * 0.72, extent * 0.4, extent * 1.95),
        );
        initialCamera.radius *= 0.68;
        initialCamera.theta += THREE.MathUtils.degToRad(-42);
        initialCamera.phi += THREE.MathUtils.degToRad(7);
        camera.position.setFromSpherical(initialCamera);
        camera.near = extent / 100;
        camera.far = extent * 20;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.075;
        controls.enablePan = false;
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.rotateSpeed = 0.72;
        controls.zoomSpeed = 0.8;
        controls.minDistance = extent * 1.2;
        controls.maxDistance = extent * 2.9;
        controls.minPolarAngle = 0.2;
        controls.maxPolarAngle = Math.PI - 0.2;
        controls.target.set(0, 0, 0);
        controls.update();
        controls.saveState();
        controls.addEventListener("start", () => {
          oiiaCatReset.hidden = false;
        });

        const clip = gltf.animations[0];
        const mixer = clip ? new THREE.AnimationMixer(model) : null;
        if (mixer) {
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        }

        const defaultView = {
          position: camera.position.clone(),
          quaternion: camera.quaternion.clone(),
          target: controls.target.clone(),
          zoom: camera.zoom,
        };
        oiiaCatViewer = { renderer, scene, camera, mixer, controls, defaultView };
        oiiaCatAnimationHoldUntil = performance.now() + OIIA_CAT_ENTRY_HOLD_MS;
        new ResizeObserver(() => {
          cancelAnimationFrame(oiiaCatResizeFrame);
          oiiaCatResizeFrame = requestAnimationFrame(() => {
            oiiaCatResizeFrame = 0;
            resizeOiiiaCatViewer();
          });
        }).observe(oiiaCatCanvas);
        resizeOiiiaCatViewer();
        projectPlaceholder.classList.remove("is-loading");
        projectPlaceholder.classList.add("is-ready");
        oiiaCatLoading.hidden = true;
        if (!projectPlaceholder.hidden && !oiiaCatAnimationFrame) {
          oiiaCatAnimationFrame = requestAnimationFrame(renderOiiiaCat);
        }
        resolve(oiiaCatViewer);
      },
      undefined,
      reject,
    );
  })).catch((error) => {
    oiiaCatViewerPromise = null;
    projectPlaceholder.classList.remove("is-loading");
    projectPlaceholder.classList.add("is-error");
    oiiaCatLoading.textContent = "3D cat could not be loaded.";
    throw error;
  });

  return oiiaCatViewerPromise;
}

function stopOiiiaCatViewer() {
  cancelAnimationFrame(oiiaCatAnimationFrame);
  oiiaCatAnimationFrame = 0;
  oiiaCatPreviousTime = 0;
}

oiiaCatReset.addEventListener("click", () => {
  restoreOiiiaCatView();
});

function renderProjects() {
  projectIndex.classList.toggle("has-two-projects", projects.length === 2);
  projectIndex.innerHTML = projects
    .map(
      (project, index) => `
        <button
          class="project-row${index === 0 ? " is-active" : ""}${project.placeholder ? " is-placeholder" : ""}"
          type="button"
          data-project-index="${index}"
          aria-pressed="${index === 0}"
          aria-controls="${project.placeholder ? "project-stage" : "project-stage project-evidence"}"
        >
          <span class="project-number">${padNumber(index)}</span>
          <span class="project-headline">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-desc">${project.desc}</p>
            <span class="project-tags">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</span>
          </span>
          <span class="project-meta">
            <span>${project.type}</span>
            <span>${project.year}</span>
          </span>
          ${project.placeholder ? `
            <span class="project-placeholder-model" aria-hidden="true">
              <b>3D</b>
              <small>Model</small>
            </span>
          ` : `<span class="project-arrow" aria-hidden="true">&#8599;</span>`}
        </button>
      `,
    )
    .join("");
  syncProjectDescriptionHeights();
}

function syncMetricNotePointers() {
  evidenceMetrics.querySelectorAll(".metric-note-tooltip").forEach((tooltip) => {
    const trigger = tooltip.previousElementSibling;
    const asterisk = trigger?.querySelector("sup");
    if (!asterisk) return;
    const tooltipRect = tooltip.getBoundingClientRect();
    const asteriskRect = asterisk.getBoundingClientRect();
    const pointerWidth = Number.parseFloat(getComputedStyle(tooltip, "::after").width) || 0;
    const rawLeft = asteriskRect.left + (asteriskRect.width / 2) - tooltipRect.left - (pointerWidth / 2);
    const pixelRatio = window.devicePixelRatio || 1;
    const alignedLeft = Math.round(rawLeft * pixelRatio) / pixelRatio;
    tooltip.style.setProperty("--metric-note-pointer-left", `${alignedLeft}px`);
  });
}

function renderProjectEvidence(project) {
  const evidence = project.evidence;
  projectEvidence.hidden = !evidence;
  if (!evidence) return;
  projectEvidence.dataset.project = project.slug;
  evidenceEyebrow.textContent = evidence.eyebrow;
  evidenceTitle.textContent = evidence.title;
  evidenceSummary.textContent = evidence.summary;
  evidenceMetrics.replaceChildren(...evidence.metrics.map(([value, label, note], index) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    if (note) {
      const noteId = `evidence-metric-note-${project.slug}-${index}`;
      const trigger = document.createElement("button");
      const asterisk = document.createElement("sup");
      const tooltip = document.createElement("span");
      trigger.className = "metric-note-trigger";
      trigger.type = "button";
      trigger.setAttribute("aria-label", `${value} ${label}. More information`);
      trigger.setAttribute("aria-describedby", noteId);
      trigger.setAttribute("aria-expanded", "false");
      trigger.append(document.createTextNode(value));
      asterisk.textContent = "*";
      trigger.append(asterisk);
      tooltip.className = "metric-note-tooltip";
      tooltip.id = noteId;
      tooltip.setAttribute("role", "tooltip");
      tooltip.textContent = note;
      term.append(trigger, tooltip);

      let closeTimer = 0;
      const setOpen = (open) => {
        window.clearTimeout(closeTimer);
        item.classList.toggle("is-note-open", open);
        trigger.setAttribute("aria-expanded", String(open));
        if (open) closeTimer = window.setTimeout(() => setOpen(false), 5000);
      };
      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        setOpen(!item.classList.contains("is-note-open"));
      });
      trigger.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "pen") item.classList.add("is-pen-note-hover");
      });
      trigger.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "pen") item.classList.remove("is-pen-note-hover");
      });
    } else {
      term.textContent = value;
    }
    detail.textContent = label;
    item.append(term, detail);
    return item;
  }));
  evidencePipeline.replaceChildren(...evidence.pipeline.map(([label, detail], index) => {
    const item = document.createElement("li");
    const step = document.createElement("span");
    const title = document.createElement("strong");
    const copy = document.createElement("small");
    step.textContent = String(index + 1).padStart(2, "0");
    title.textContent = label;
    copy.textContent = detail;
    item.append(step, title, copy);
    return item;
  }));
  evidenceStatus.replaceChildren(...evidence.status.map(([label, text]) => {
    const item = document.createElement("div");
    const title = document.createElement("strong");
    const copy = document.createElement("p");
    title.textContent = label;
    copy.textContent = text;
    item.append(title, copy);
    return item;
  }));
  requestAnimationFrame(syncMetricNotePointers);
  document.fonts?.ready.then(syncMetricNotePointers);
}

document.addEventListener("click", (event) => {
  evidenceMetrics.querySelectorAll(".is-note-open").forEach((item) => {
    if (item.contains(event.target)) return;
    item.classList.remove("is-note-open", "is-pen-note-hover");
    const trigger = item.querySelector(".metric-note-trigger");
    trigger?.setAttribute("aria-expanded", "false");
    if (trigger === document.activeElement) trigger.blur();
  });
});

function projectIndexFromHash() {
  const match = /^#project-(.+)$/.exec(window.location.hash);
  if (!match) return -1;
  return projects.findIndex((project) => project.slug === match[1]);
}

function focusProjectPreview() {
  if (!window.matchMedia("(max-width: 1100px)").matches
      && !document.documentElement.classList.contains("is-handset")) return;
  requestAnimationFrame(() => {
    projectStage.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  });
}

function syncProjectDescriptionHeights() {
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const openPadding = rootFontSize * 0.38;

  projectIndex.querySelectorAll(".project-desc").forEach((description) => {
    const currentPadding = Number.parseFloat(getComputedStyle(description).paddingTop) || 0;
    const contentHeight = Math.max(0, description.scrollHeight - currentPadding);
    description.style.setProperty(
      "--project-desc-height",
      `${Math.ceil(contentHeight + openPadding)}px`,
    );
  });
}

function setActiveProject(index, { userInitiated = false, updateHistory = false } = {}) {
  const project = projects[index];
  if (!project) return;
  if (index === activeProject) {
    if (userInitiated) focusProjectPreview();
    return;
  }

  const previousProject = projects[activeProject];
  const isPlaceholder = project.interactive === "placeholder";
  const isPlaceholderSlotSwitch = isPlaceholder && previousProject?.placeholder;
  activeProject = index;
  projectIndex.querySelectorAll(".project-row").forEach((row, rowIndex) => {
    const isActive = rowIndex === index;
    row.classList.toggle("is-active", isActive);
    row.setAttribute("aria-pressed", String(isActive));
  });

  stageNumber.textContent = padNumber(index);
  if (isPlaceholder) placeholderSlotNumber.textContent = padNumber(index);
  stageTitle.textContent = project.previewTitle || project.title;
  stageType.textContent = project.type;
  renderProjectEvidence(project);
  if (updateHistory) {
    const nextHash = `#project-${project.slug}`;
    if (window.location.hash !== nextHash) history.pushState(null, "", nextHash);
  }

  if (isPlaceholderSlotSwitch) {
    if (userInitiated) focusProjectPreview();
    return;
  }

  const isTouchline = project.interactive === "touchline";
  touchlineStage.hidden = !isTouchline;
  projectPlaceholder.hidden = !isPlaceholder;
  projectStage.classList.toggle("is-touchline", isTouchline);
  projectStage.classList.toggle("is-placeholder", isPlaceholder);
  if (!isTouchline) stopTouchlinePlayback();
  if (!isPlaceholder) stopOiiiaCatViewer();

  if (project.interactive === "worm") {
    projectCanvas.hidden = true;
    stageVideo.pause();
    stageVideo.hidden = true;
    wormStage.hidden = false;
    wormSequenceNav.hidden = false;
    resetWormView();
    if (userInitiated) ensureWormReady().catch((error) => console.warn(error));
    if (userInitiated) focusProjectPreview();
    return;
  }

  resetWormView();
  wormStage.hidden = true;
  wormSequenceNav.hidden = true;
  wormReset.hidden = true;

  if (isPlaceholder) {
    projectCanvas.hidden = true;
    stageVideo.pause();
    stageVideo.hidden = true;
    startOiiiaCatViewer().catch((error) => console.warn(error));
    if (userInitiated) focusProjectPreview();
    return;
  }

  if (isTouchline) {
    projectCanvas.hidden = true;
    stageVideo.pause();
    stageVideo.hidden = true;
    fitTouchlineMedia();
    loadTouchlineDemo().catch((error) => console.warn(error));
    if (userInitiated) focusProjectPreview();
    return;
  }

  if (project.demo) {
    projectCanvas.hidden = true;
    stageVideo.hidden = false;
    if (stageVideo.getAttribute("src") !== project.demo) stageVideo.src = project.demo;
    if (!reducedMotion) stageVideo.play().catch(() => {});
    return;
  }

  stageVideo.pause();
  stageVideo.hidden = true;
  projectCanvas.hidden = false;
  if (userInitiated) focusProjectPreview();
}

function computeWormGeometry() {
  if (wormStage.hidden) return;

  const wormCrop = wormImages[activeWormImage].crop;

  const stageWidth = wormStage.clientWidth;
  const stageHeight = wormStage.clientHeight;
  const usableHeight = Math.max(1, stageHeight - 52);
  const planeWidth = stageWidth * 1.125;
  const planeHeight = stageHeight;
  const planeLeft = stageWidth * -0.0625;
  const targetHeight = usableHeight * 0.88;
  const scale = targetHeight / (planeHeight * wormCrop.height);
  const cropCentreX = planeWidth * (wormCrop.x + wormCrop.width / 2);
  const cropCentreY = planeHeight * (wormCrop.y + wormCrop.height / 2);
  const targetCentreX = stageWidth / 2;
  const targetCentreY = usableHeight / 2;
  const translateX = targetCentreX - planeLeft - scale * cropCentreX;
  const translateY = targetCentreY - scale * cropCentreY;
  const cropWidth = planeWidth * wormCrop.width * scale;
  const cropLeft = targetCentreX - cropWidth / 2;

  wormStage.style.setProperty(
    "--zoom-transform",
    `translate(${translateX}px, ${translateY}px) scale(${scale})`,
  );
  wormComparisonGeometry = { cropLeft, cropWidth, stageWidth };
  wormComparisonRange.style.left = "0";
  wormComparisonRange.style.width = `${stageWidth}px`;
  updateWormComparison(Number(wormComparisonRange.value));
  requestWormLensRender();
}

function wormLensRectIntersects(first, second) {
  return first.right > second.left
    && first.left < second.right
    && first.bottom > second.top
    && first.top < second.bottom;
}

function getWormLensImageLayer(image, sampleRect, opacity = 1, imageRect = null) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight || opacity <= 0) return;

  const resolvedRect = imageRect || image.getBoundingClientRect();
  if (!resolvedRect.width || !resolvedRect.height || !wormLensRectIntersects(resolvedRect, sampleRect)) return;

  return { image, rect: resolvedRect, opacity };
}

function drawWormLensLayer(context, layer, sampleRect) {
  const { image, rect: imageRect, opacity } = layer;

  const left = Math.max(imageRect.left, sampleRect.left);
  const top = Math.max(imageRect.top, sampleRect.top);
  const right = Math.min(imageRect.right, sampleRect.right);
  const bottom = Math.min(imageRect.bottom, sampleRect.bottom);
  const sourceX = ((left - imageRect.left) / imageRect.width) * image.naturalWidth;
  const sourceY = ((top - imageRect.top) / imageRect.height) * image.naturalHeight;
  const sourceWidth = ((right - left) / imageRect.width) * image.naturalWidth;
  const sourceHeight = ((bottom - top) / imageRect.height) * image.naturalHeight;

  context.globalAlpha = opacity;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    left - sampleRect.left,
    top - sampleRect.top,
    right - left,
    bottom - top,
  );
}

function getWormZoomOpacity(stage, zoomSource) {
  if (!zoomSource || !stage.classList.contains("is-zoom-raster-ready")) return 0;

  const cachedOpacity = wormZoomOpacityCache.get(stage);
  if (cachedOpacity === 1) return 1;

  const opacity = Number.parseFloat(getComputedStyle(zoomSource).opacity) || 0;
  if (opacity >= 0.995) wormZoomOpacityCache.set(stage, 1);
  return opacity;
}

function getWormStageLensLayers(stage, sampleRect) {
  const stageRect = stage.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height || !wormLensRectIntersects(stageRect, sampleRect)) return [];

  const source = stage.querySelector(".worm-source");
  const zoomSource = stage.querySelector(".worm-zoom-source");
  const zoomOpacity = getWormZoomOpacity(stage, zoomSource);
  const zoomRect = zoomOpacity > 0 ? zoomSource.getBoundingClientRect() : null;
  const zoomCoversSample = zoomRect
    && zoomRect.left <= sampleRect.left
    && zoomRect.top <= sampleRect.top
    && zoomRect.right >= sampleRect.right
    && zoomRect.bottom >= sampleRect.bottom;

  const layers = [];
  if (!zoomCoversSample || zoomOpacity < 0.995) {
    const sourceLayer = getWormLensImageLayer(source, sampleRect);
    if (sourceLayer) layers.push(sourceLayer);
  }
  if (zoomSource && zoomOpacity > 0) {
    const zoomLayer = getWormLensImageLayer(zoomSource, sampleRect, zoomOpacity, zoomRect);
    if (zoomLayer) layers.push(zoomLayer);
  }
  return layers;
}

function collectWormLensLayers(stages, sampleRect) {
  return stages.flatMap((stage) => getWormStageLensLayers(stage, sampleRect));
}

function collectWormLensTextureLayers(stages) {
  return stages.flatMap((stage) =>
    [...stage.querySelectorAll(".worm-source, .worm-zoom-source")]
      .filter((image) => image.complete && image.naturalWidth && image.naturalHeight)
      .map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          image,
          rect: {
            left: rect.left,
            top: rect.top,
            width: Math.max(1, rect.width || image.naturalWidth),
            height: Math.max(1, rect.height || image.naturalHeight),
          },
          opacity: 1,
        };
      }),
  );
}

function createWormLensPrewarmLayer(image) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return null;
  return {
    image,
    rect: {
      left: 0,
      top: 0,
      width: image.naturalWidth,
      height: image.naturalHeight,
    },
    opacity: 1,
  };
}

function drawWormLensLayers(context, layers, sampleRect) {
  context.globalCompositeOperation = "source-over";
  layers.forEach((layer) => drawWormLensLayer(context, layer, sampleRect));

  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
}

function ensureWormLensWebGLRenderer() {
  if (wormLensWebGLAttempted) return wormLensWebGLRenderer;
  wormLensWebGLAttempted = true;
  try {
    wormLensWebGLRenderer = createWormLensWebGLRenderer(
      wormComparisonLensWebGL,
      (available) => {
        if (!available) wormCompare.classList.remove("is-webgl-lens");
        if (available) void prewarmWormLensFrame(activeWormImage);
        requestWormLensRender();
      },
    );
  } catch {
    wormLensWebGLRenderer = null;
    wormCompare.classList.remove("is-webgl-lens");
  }
  return wormLensWebGLRenderer;
}

function prewarmWormLensFrame(index = activeWormImage) {
  if (wormLensTexturePrewarm.index === index && wormLensTexturePrewarm.promise) {
    return wormLensTexturePrewarm.promise;
  }

  const renderer = ensureWormLensWebGLRenderer();
  if (!renderer) return Promise.resolve(false);

  const promise = Promise.all([
    loadWormImage(index),
    prepareWormZoomImage(index).catch(() => null),
  ])
    .then(([frame, zoomSource]) => {
      if (index !== activeWormImage) return false;
      const layers = [frame.source, zoomSource]
        .map(createWormLensPrewarmLayer)
        .filter(Boolean);
      if (!layers.length) return false;

      return renderer.prepare(layers).then((prepared) => {
        if (!prepared || index !== activeWormImage || !wormCompare.hidden) return prepared;

        const handset = document.documentElement.classList.contains("is-handset");
        const size = handset ? 24 : 48;
        const sampleRect = { left: 0, top: 0, width: size, height: size };
        const primeLayers = layers.map((layer) => ({ ...layer, rect: sampleRect }));
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
        renderer.render(primeLayers, sampleRect, getWormLensOpticalState(pixelRatio));
        return true;
      });
    })
    .catch(() => false)
    .finally(() => {
      if (wormLensTexturePrewarm.promise === promise) {
        wormLensTexturePrewarm = { index: -1, promise: null };
      }
    });

  wormLensTexturePrewarm = { index, promise };
  return promise;
}

function queueWormLensTexturePreparation(layers) {
  const renderer = ensureWormLensWebGLRenderer();
  if (!renderer?.ready || !layers.length || wormLensWebGLPreparePromise) return;

  wormLensWebGLPreparePromise = renderer.prepare(layers)
    .then((prepared) => {
      if (prepared) requestWormLensRender();
    })
    .catch(() => {
      wormCompare.classList.remove("is-webgl-lens");
    })
    .finally(() => {
      wormLensWebGLPreparePromise = null;
    });
}

async function prepareWormLensStagesForWebGL(stages, { allowHidden = false } = {}) {
  if (!allowHidden && (wormCompare.hidden || !wormCompare.classList.contains("is-ready"))) return;
  const renderer = ensureWormLensWebGLRenderer();
  if (!renderer) return;

  const layers = collectWormLensTextureLayers(stages);
  if (!layers.length) return;
  try {
    await renderer.prepare(layers);
  } catch {
    wormCompare.classList.remove("is-webgl-lens");
  }
}

function getWormLensOpticalState(pixelRatio) {
  const mode = document.documentElement.classList.contains("is-handset")
    ? "handset"
    : "desktop";
  const filter = wormLensFilters.find((candidate) => candidate.mode === mode);
  const fallback = wormLensOpticalTargets[mode].rest;
  return {
    magnification: filter?.magnification.value ?? fallback.magnification,
    refraction: filter?.refraction.value ?? fallback.refraction,
    mapExtentCss: mode === "handset" ? 26 : 52,
    pixelRatio,
  };
}

function renderWormLensView() {
  if (!wormComparisonLens || wormCompare.hidden || !wormCompare.classList.contains("is-ready")) return;

  const sampleRect = wormComparisonLens.getBoundingClientRect();
  if (!sampleRect.width || !sampleRect.height) return;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
  const transitionStages = [...projectStage.querySelectorAll(".worm-swipe-track .worm-stage")];
  const stages = transitionStages.length ? transitionStages : [wormStage];
  const layers = collectWormLensLayers(stages, sampleRect);
  const renderer = ensureWormLensWebGLRenderer();
  if (renderer?.ready) {
    const rendered = renderer.render(
      layers,
      sampleRect,
      getWormLensOpticalState(pixelRatio),
    );
    wormCompare.classList.toggle("is-webgl-lens", rendered);
    if (rendered) return;
    queueWormLensTexturePreparation(layers);
  } else {
    wormCompare.classList.remove("is-webgl-lens");
  }

  const pixelWidth = Math.max(1, Math.round(sampleRect.width * pixelRatio));
  const pixelHeight = Math.max(1, Math.round(sampleRect.height * pixelRatio));
  if (wormComparisonLens.width !== pixelWidth || wormComparisonLens.height !== pixelHeight) {
    wormComparisonLens.width = pixelWidth;
    wormComparisonLens.height = pixelHeight;
  }

  const context = wormComparisonLens.getContext("2d", { alpha: false });
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "#020303";
  context.fillRect(0, 0, sampleRect.width, sampleRect.height);
  drawWormLensLayers(context, layers, sampleRect);
}

function runWormLensRender(time) {
  wormLensRenderAnimationFrame = 0;
  if (wormLensScrollSuspended) return;
  renderWormLensView();
  if (time < wormLensRenderUntil) {
    wormLensRenderAnimationFrame = requestAnimationFrame(runWormLensRender);
  }
}

function requestWormLensRender(duration = 0) {
  if (wormLensScrollSuspended) return;
  wormLensRenderUntil = Math.max(wormLensRenderUntil, performance.now() + duration);
  if (!wormLensRenderAnimationFrame) {
    wormLensRenderAnimationFrame = requestAnimationFrame(runWormLensRender);
  }
}

function setWormLensScrollSuspended(suspended) {
  if (wormLensScrollSuspended === suspended) return;
  wormLensScrollSuspended = suspended;
  wormCompare.classList.toggle("is-page-scrolling", suspended);

  if (suspended) {
    wormLensRenderUntil = 0;
    if (wormLensRenderAnimationFrame) {
      cancelAnimationFrame(wormLensRenderAnimationFrame);
      wormLensRenderAnimationFrame = 0;
    }
    if (wormLensOpticsAnimationFrame) {
      cancelAnimationFrame(wormLensOpticsAnimationFrame);
      wormLensOpticsAnimationFrame = 0;
      wormLensOpticsPreviousTime = 0;
      wormLensFilters.forEach((filter) => {
        filter.magnification.value = filter.magnification.target;
        filter.magnification.velocity = 0;
        filter.refraction.value = filter.refraction.target;
        filter.refraction.velocity = 0;
        writeWormLensScale(filter.magnificationNode, filter.magnification.value);
        writeWormLensScale(filter.refractionNode, filter.refraction.value);
      });
    }
    return;
  }
}

function resumeWormLensAfterScroll() {
  clearTimeout(wormLensScrollTimer);
  wormLensScrollTimer = 0;
  setWormLensScrollSuspended(false);
  requestWormLensRender();
}

function suspendWormLensForScroll() {
  if (!suspendWormLensDuringScroll
      || wormCompare.hidden
      || !wormCompare.classList.contains("is-ready")) return;

  setWormLensScrollSuspended(true);
  clearTimeout(wormLensScrollTimer);
  wormLensScrollTimer = window.setTimeout(resumeWormLensAfterScroll, 100);
}

function updateWormComparison(value) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const stageWidth = wormComparisonGeometry.stageWidth || wormStage.clientWidth;
  const lineX = stageWidth * (clampedValue / 100);
  const cropReveal = Math.max(
    0,
    Math.min(
      100,
      ((lineX - wormComparisonGeometry.cropLeft) / wormComparisonGeometry.cropWidth) * 100,
    ),
  );

  wormComparisonRange.value = String(clampedValue);
  wormStage.style.setProperty("--reveal", `${cropReveal}%`);
  wormStage.style.setProperty("--line-x", `${lineX}px`);
  wormCompare.style.setProperty("--line-x", `${lineX}px`);
  const isComplete = clampedValue >= 99.5;
  if (clampedValue > 0 && wormKey.hidden) {
    wormKey.hidden = false;
  }
  wormStage.classList.toggle("is-complete", isComplete);
  requestWormLensRender();
}

function animateWormComparison(target, duration = 1350) {
  cancelAnimationFrame(wormAnimationFrame);
  const startValue = Number(wormComparisonRange.value);
  const startTime = performance.now();

  function step(time) {
    const progress = Math.min(1, (time - startTime) / duration);
    const eased = 1 - (1 - progress) ** 3;
    updateWormComparison(startValue + (target - startValue) * eased);
    if (progress < 1) wormAnimationFrame = requestAnimationFrame(step);
  }

  wormAnimationFrame = requestAnimationFrame(step);
}

function settleWormComparison() {
  const value = Number(wormComparisonRange.value);
  const velocity = wormSliderMotion.velocity;
  const releaseVelocity = velocity * Math.max(
    0,
    1 - (performance.now() - wormSliderMotion.time) / 200,
  );
  const travel = value - (wormSliderMotion.startValue ?? value);
  const isDirectionalThrow = Math.abs(travel) >= 8
    && Math.abs(releaseVelocity) >= 35
    && Math.sign(travel) === Math.sign(releaseVelocity);
  const target = isDirectionalThrow
    ? travel > 0 ? 100 : 0
    : value <= 25 || (value <= 35 && velocity < -30)
      ? 0
      : value >= 75 || (value >= 65 && velocity > 30)
        ? 100
        : null;

  if (target === null || reducedMotion) {
    if (target !== null) updateWormComparison(target);
    return;
  }

  cancelAnimationFrame(wormAnimationFrame);
  let position = value;
  const initialVelocity = isDirectionalThrow ? releaseVelocity : velocity;
  let springVelocity = Math.max(-180, Math.min(180, initialVelocity));
  let previousTime = performance.now();

  function step(time) {
    const delta = Math.min(0.032, (time - previousTime) / 1000);
    previousTime = time;
    const acceleration = (target - position) * 150 - springVelocity * 20;
    springVelocity += acceleration * delta;
    position += springVelocity * delta;

    if (target === 0) position = Math.max(0, position);
    else position = Math.min(100, position);

    updateWormComparison(position);
    if (Math.abs(target - position) < 0.04 && Math.abs(springVelocity) < 0.35) {
      updateWormComparison(target);
      return;
    }
    wormAnimationFrame = requestAnimationFrame(step);
  }

  wormAnimationFrame = requestAnimationFrame(step);
}

function zoomWormView() {
  if (wormStage.classList.contains("is-zoomed")) return;
  ensureWormReady().catch((error) => console.warn(error));

  const zoomStage = wormStage;
  const zoomMedia = wormMedia;
  const zoomIndex = activeWormImage;
  const existingZoomSource = zoomMedia.querySelector(
    `.worm-zoom-source[data-worm-id="${wormImages[zoomIndex].id}"]`,
  );
  const zoomSource = existingZoomSource
    ? Promise.resolve(existingZoomSource)
    : prepareWormZoomImage(zoomIndex).catch(() => null);
  ensureWormLensWebGLRenderer();
  void prewarmWormLensFrame(zoomIndex);
  computeWormGeometry();
  wormStage.classList.add("is-zoomed");
  prewarmWormZoomNeighbors(zoomIndex);
  zoomSource.then((source) => {
    commitWormZoomSource(source, zoomStage, zoomMedia, zoomIndex);
  });
  wormReset.hidden = false;
  wormZoomTrigger.disabled = true;
  clearTimeout(wormReadyTimer);
  wormReadyTimer = window.setTimeout(() => {
    wormCompare.hidden = false;
    wormCompare.classList.add("is-ready");
    wormStage.classList.add("is-ready");
    requestWormLensRender(280);
    if (!reducedMotion) animateWormComparison(58);
    else updateWormComparison(58);
  }, reducedMotion ? 0 : 900);
  clearTimeout(wormRasterTimer);
}

function resetWormView({ waitForZoom = false } = {}) {
  clearTimeout(wormReadyTimer);
  clearTimeout(wormRasterTimer);
  clearTimeout(wormResetTimer);
  clearTimeout(wormFadeTimer);
  cancelAnimationFrame(wormAnimationFrame);

  if (waitForZoom && wormStage.classList.contains("is-zoomed")) {
    wormKey.hidden = true;
    wormCompare.classList.remove("is-ready");
    wormStage.classList.remove("is-ready", "is-complete");
    wormStage.classList.remove("is-zoom-raster-ready");
    wormStage.classList.add("is-resetting");
    wormZoomTrigger.disabled = true;
    wormStage.classList.remove("is-zoomed");
    wormFadeTimer = window.setTimeout(() => {
      wormCompare.hidden = true;
      wormCompare.classList.remove("is-webgl-lens");
      updateWormComparison(0);
    }, reducedMotion ? 0 : 220);
    wormResetTimer = window.setTimeout(() => {
      wormStage.classList.remove("is-resetting");
      wormZoomTrigger.disabled = false;
      wormReset.hidden = true;
    }, reducedMotion ? 0 : 1050);
    return;
  }

  wormStage.classList.remove("is-ready", "is-resetting", "is-zoomed", "is-zoom-raster-ready");
  wormCompare.classList.remove("is-ready");
  wormCompare.hidden = true;
  wormCompare.classList.remove("is-webgl-lens");
  updateWormComparison(0);
  wormZoomTrigger.disabled = false;
  wormReset.hidden = true;
}

function attachProjectInteractions() {
  projectIndex.querySelectorAll(".project-row").forEach((row) => {
    const index = Number(row.dataset.projectIndex);
    row.addEventListener("click", () => setActiveProject(index, {
      userInitiated: true,
      updateHistory: true,
    }));
    row.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "pen") row.classList.add("is-pen-hover");
    });
    row.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "pen") row.classList.remove("is-pen-hover");
    });
  });
}

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  return { width, height, dpr };
}

function heroQuadraticPoint(track, progress, width, height, time) {
  const inverse = 1 - progress;
  const x = (
    inverse * inverse * track.start[0]
    + 2 * inverse * progress * track.control[0]
    + progress * progress * track.end[0]
  ) * width;
  const y = (
    inverse * inverse * track.start[1]
    + 2 * inverse * progress * track.control[1]
    + progress * progress * track.end[1]
  ) * height;
  const drift = Math.sin(progress * Math.PI * 4 + track.phase * 7 + time * 0.34) * height * 0.005;
  return { x, y: y + drift };
}

function drawHeroReconstructionPlane(ctx, width, height, dpr, time) {
  const vanishX = width * (0.78 + Math.sin(time * 0.07) * 0.008);
  const vanishY = height * (0.19 + Math.cos(time * 0.09) * 0.006);
  const baseY = height * 0.98;
  const leftBase = width * 0.32;
  const rightBase = width * 1.08;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineWidth = 0.55 * dpr;

  for (let index = 0; index <= 9; index += 1) {
    const ratio = index / 9;
    const baseX = leftBase + (rightBase - leftBase) * ratio;
    ctx.beginPath();
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(baseX, baseY);
    ctx.strokeStyle = `rgba(78,126,255,${0.035 + Math.abs(ratio - 0.5) * 0.025})`;
    ctx.stroke();
  }

  for (let index = 1; index <= 9; index += 1) {
    const depth = index / 9;
    const projected = Math.pow(depth, 1.72);
    const y = vanishY + (baseY - vanishY) * projected;
    const left = vanishX + (leftBase - vanishX) * projected;
    const right = vanishX + (rightBase - vanishX) * projected;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.strokeStyle = `rgba(78,126,255,${0.025 + depth * 0.055})`;
    ctx.stroke();
  }

  const registrationPoints = [
    [0.58, 0.78],
    [0.73, 0.59],
    [0.88, 0.82],
    [0.93, 0.38],
  ];
  registrationPoints.forEach(([x, y], index) => {
    const px = width * x;
    const py = height * y;
    const radius = (index % 2 ? 2.2 : 1.6) * dpr;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(78,126,255,0.42)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, radius + 5 * dpr, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(78,126,255,0.12)";
    ctx.stroke();
  });
  ctx.restore();
}

function drawHeroContours(ctx, width, height, dpr, time, pointerX, pointerY, compact) {
  const unit = Math.min(width, height);
  const foci = compact ? heroContourFoci.slice(0, 2) : heroContourFoci;
  const rings = compact ? 4 : 6;
  const steps = compact ? 44 : 68;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineJoin = "round";

  foci.forEach((focus, focusIndex) => {
    const centreX = width * focus.x + Math.sin(time * 0.09 + focus.phase) * unit * 0.008;
    const centreY = height * focus.y + Math.cos(time * 0.075 + focus.phase) * unit * 0.006;

    for (let ring = 0; ring < rings; ring += 1) {
      const expansion = 0.69 + ring * 0.135;
      ctx.beginPath();

      for (let step = 0; step <= steps; step += 1) {
        const angle = (step / steps) * Math.PI * 2;
        const temporal = reducedMotion ? 0 : time * (0.075 + focusIndex * 0.012);
        const contourNoise = 1
          + Math.sin(angle * 3 + focus.phase + temporal) * 0.047
          + Math.sin(angle * 7 - focus.phase * 1.7 - temporal * 0.7) * 0.022
          + Math.cos(angle * 11 + ring * 0.84) * 0.011;
        let x = centreX + Math.cos(angle) * focus.rx * unit * expansion * contourNoise;
        let y = centreY + Math.sin(angle) * focus.ry * unit * expansion * contourNoise;
        const deltaX = pointerX - x;
        const deltaY = pointerY - y;
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        const influence = Math.max(0, 1 - distance / (175 * dpr)) * heroPointerPresence;
        x += deltaX * influence * 0.045;
        y += deltaY * influence * 0.045;

        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      const isPrimary = ring === 2 && focusIndex === 0;
      const isDepth = ring === rings - 2;
      ctx.lineWidth = (isPrimary ? 1.05 : 0.65) * dpr;
      ctx.strokeStyle = isPrimary
        ? "rgba(200,255,55,0.24)"
        : isDepth
          ? "rgba(78,126,255,0.2)"
          : `rgba(244,243,238,${0.035 + ring * 0.009})`;
      ctx.stroke();
    }
  });
  ctx.restore();
}

function drawHeroCornerMarker(ctx, x, y, dpr, color) {
  const halfWidth = 5.5 * dpr;
  const halfHeight = 8 * dpr;
  const corner = 3 * dpr;
  ctx.beginPath();
  ctx.moveTo(x - halfWidth, y - halfHeight + corner);
  ctx.lineTo(x - halfWidth, y - halfHeight);
  ctx.lineTo(x - halfWidth + corner, y - halfHeight);
  ctx.moveTo(x + halfWidth - corner, y - halfHeight);
  ctx.lineTo(x + halfWidth, y - halfHeight);
  ctx.lineTo(x + halfWidth, y - halfHeight + corner);
  ctx.moveTo(x + halfWidth, y + halfHeight - corner);
  ctx.lineTo(x + halfWidth, y + halfHeight);
  ctx.lineTo(x + halfWidth - corner, y + halfHeight);
  ctx.moveTo(x - halfWidth + corner, y + halfHeight);
  ctx.lineTo(x - halfWidth, y + halfHeight);
  ctx.lineTo(x - halfWidth, y + halfHeight - corner);
  ctx.strokeStyle = `rgba(${color},0.72)`;
  ctx.stroke();
}

function drawHeroTracks(ctx, width, height, dpr, time, compact) {
  const tracks = compact ? heroTrackSeeds.slice(0, 4) : heroTrackSeeds;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineWidth = 0.75 * dpr;
  ctx.font = `${6.5 * dpr}px Consolas, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  tracks.forEach((track) => {
    const progress = reducedMotion ? track.phase : (track.phase + time * track.speed) % 1;
    const trailStart = Math.max(0, progress - 0.2);
    const segments = 13;

    for (let index = 1; index <= segments; index += 1) {
      const startProgress = trailStart + ((index - 1) / segments) * (progress - trailStart);
      const endProgress = trailStart + (index / segments) * (progress - trailStart);
      const start = heroQuadraticPoint(track, startProgress, width, height, time);
      const end = heroQuadraticPoint(track, endProgress, width, height, time);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = `rgba(${track.color},${0.015 + (index / segments) * 0.19})`;
      ctx.stroke();
    }

    const current = heroQuadraticPoint(track, progress, width, height, time);
    drawHeroCornerMarker(ctx, current.x, current.y, dpr, track.color);
    ctx.beginPath();
    ctx.arc(current.x, current.y, 1.35 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${track.color},0.9)`;
    ctx.fill();
    ctx.fillStyle = `rgba(${track.color},0.52)`;
    ctx.fillText(track.id, current.x + 8.5 * dpr, current.y - 0.5 * dpr);
  });
  ctx.restore();
}

function drawHeroSampler(ctx, pointerX, pointerY, dpr) {
  const presence = heroPointerPresence;
  if (presence < 0.025) return;
  const glowRadius = 150 * dpr;
  const glow = ctx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, glowRadius);
  glow.addColorStop(0, `rgba(200,255,55,${0.055 * presence})`);
  glow.addColorStop(0.35, `rgba(78,126,255,${0.032 * presence})`);
  glow.addColorStop(1, "rgba(10,10,10,0)");

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = glow;
  ctx.fillRect(pointerX - glowRadius, pointerY - glowRadius, glowRadius * 2, glowRadius * 2);
  ctx.lineWidth = 0.75 * dpr;
  ctx.strokeStyle = `rgba(200,255,55,${0.27 * presence})`;
  ctx.beginPath();
  ctx.arc(pointerX, pointerY, 34 * dpr, -0.82, 0.72);
  ctx.arc(pointerX, pointerY, 34 * dpr, 2.32, 3.86);
  ctx.stroke();

  ctx.setLineDash([2 * dpr, 7 * dpr]);
  ctx.strokeStyle = `rgba(244,243,238,${0.13 * presence})`;
  ctx.beginPath();
  ctx.arc(pointerX, pointerY, 52 * dpr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const tickInner = 40 * dpr;
  const tickOuter = 47 * dpr;
  ctx.strokeStyle = `rgba(200,255,55,${0.34 * presence})`;
  ctx.beginPath();
  ctx.moveTo(pointerX - tickOuter, pointerY);
  ctx.lineTo(pointerX - tickInner, pointerY);
  ctx.moveTo(pointerX + tickInner, pointerY);
  ctx.lineTo(pointerX + tickOuter, pointerY);
  ctx.moveTo(pointerX, pointerY - tickOuter);
  ctx.lineTo(pointerX, pointerY - tickInner);
  ctx.moveTo(pointerX, pointerY + tickInner);
  ctx.lineTo(pointerX, pointerY + tickOuter);
  ctx.stroke();
  ctx.restore();
}

function drawHero(time) {
  const ctx = heroCanvas.getContext("2d");
  const { width, height, dpr } = fitCanvas(heroCanvas);
  const compact = width / dpr < 720;
  const elapsed = reducedMotion ? 0 : time * 0.001;
  const idleX = 0.74 + Math.sin(elapsed * 0.055) * 0.012;
  const idleY = 0.38 + Math.cos(elapsed * 0.05) * 0.01;
  const targetX = heroPointerInside ? heroPointer.x : idleX;
  const targetY = heroPointerInside ? heroPointer.y : idleY;
  const smoothing = reducedMotion ? 1 : 0.075;
  heroPointerSmooth.x += (targetX - heroPointerSmooth.x) * smoothing;
  heroPointerSmooth.y += (targetY - heroPointerSmooth.y) * smoothing;
  const pointerTarget = heroPrecisionPointer && heroPointerInside ? 1 : compact ? 0.08 : 0.16;
  heroPointerPresence += (pointerTarget - heroPointerPresence) * (reducedMotion ? 1 : 0.065);

  const pointerX = heroPointerSmooth.x * width;
  const pointerY = heroPointerSmooth.y * height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#07090a";
  ctx.fillRect(0, 0, width, height);

  const coolGlow = ctx.createRadialGradient(width * 0.8, height * 0.25, 0, width * 0.8, height * 0.25, width * 0.64);
  coolGlow.addColorStop(0, "rgba(24,71,215,0.115)");
  coolGlow.addColorStop(0.46, "rgba(16,37,78,0.04)");
  coolGlow.addColorStop(1, "rgba(7,9,10,0)");
  ctx.fillStyle = coolGlow;
  ctx.fillRect(0, 0, width, height);

  const contourGlow = ctx.createRadialGradient(width * 0.78, height * 0.4, 0, width * 0.78, height * 0.4, width * 0.38);
  contourGlow.addColorStop(0, "rgba(200,255,55,0.035)");
  contourGlow.addColorStop(1, "rgba(7,9,10,0)");
  ctx.fillStyle = contourGlow;
  ctx.fillRect(0, 0, width, height);

  if (!reducedMotion) {
    const scanX = (((elapsed * 0.018) % 1.28) - 0.14) * width;
    const scanWidth = 90 * dpr;
    const scan = ctx.createLinearGradient(scanX - scanWidth, 0, scanX + scanWidth, 0);
    scan.addColorStop(0, "rgba(78,126,255,0)");
    scan.addColorStop(0.5, "rgba(78,126,255,0.025)");
    scan.addColorStop(1, "rgba(78,126,255,0)");
    ctx.fillStyle = scan;
    ctx.fillRect(scanX - scanWidth, 0, scanWidth * 2, height);
  }

  drawHeroReconstructionPlane(ctx, width, height, dpr, elapsed);
  drawHeroContours(ctx, width, height, dpr, elapsed, pointerX, pointerY, compact);
  drawHeroTracks(ctx, width, height, dpr, elapsed, compact);
  drawHeroSampler(ctx, pointerX, pointerY, dpr);
}

function drawProjectScene(time) {
  if (projectCanvas.hidden) return;

  const ctx = projectCanvas.getContext("2d");
  const { width, height, dpr } = fitCanvas(projectCanvas);
  const scene = projects[activeProject]?.scene ?? 0;
  const t = reducedMotion ? 0 : time * 0.001;
  const px = stagePointer.x * width;
  const py = stagePointer.y * height;

  ctx.clearRect(0, 0, width, height);

  if (scene === 0) {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#c8ff37";
    ctx.lineWidth = 2 * dpr;
    const size = Math.min(width, height) * 0.7;
    for (let i = 0; i < 8; i += 1) {
      const inset = i * size * 0.065 + Math.sin(t + i) * 8 * dpr;
      const offsetX = (px - width / 2) * (i / 8) * 0.05;
      const offsetY = (py - height / 2) * (i / 8) * 0.05;
      ctx.strokeRect((width - size) / 2 + inset + offsetX, (height - size) / 2 + inset + offsetY, size - inset * 2, size - inset * 2);
    }
  } else if (scene === 1) {
    ctx.fillStyle = "#08130f";
    ctx.fillRect(0, 0, width, height);

    const projectPitch = (x, y) => {
      const left = width * (0.16 - y * 0.24);
      const right = width * (0.84 + y * 0.24);
      return {
        x: left + x * (right - left),
        y: height * (0.12 + y * 0.76),
        scale: 0.58 + y * 0.72,
      };
    };
    const pitchCorners = [projectPitch(0, 0), projectPitch(1, 0), projectPitch(1, 1), projectPitch(0, 1)];
    ctx.beginPath();
    pitchCorners.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.closePath();
    ctx.fillStyle = "#163e2d";
    ctx.fill();
    ctx.strokeStyle = "rgba(244,243,238,.72)";
    ctx.lineWidth = dpr;
    ctx.stroke();

    const halfwayTop = projectPitch(0.5, 0);
    const halfwayBottom = projectPitch(0.5, 1);
    ctx.beginPath();
    ctx.moveTo(halfwayTop.x, halfwayTop.y);
    ctx.lineTo(halfwayBottom.x, halfwayBottom.y);
    ctx.strokeStyle = "rgba(244,243,238,.45)";
    ctx.stroke();

    const progress = reducedMotion ? 0.525 : (Math.sin(t * 0.42) + 1) / 2;
    const pitchToNormal = ([x, y]) => [(x + 52.5) / 105, (y + 34) / 68];
    touchlineTracks.forEach((track) => {
      const cursor = progress * (track.points.length - 1);
      const start = Math.floor(cursor);
      const end = Math.min(track.points.length - 1, start + 1);
      const blend = cursor - start;
      const position = pitchToNormal([
        track.points[start][0] + (track.points[end][0] - track.points[start][0]) * blend,
        track.points[start][1] + (track.points[end][1] - track.points[start][1]) * blend,
      ]);
      const point = projectPitch(...position);
      const markerWidth = 12 * dpr * point.scale;
      const markerHeight = 18 * dpr * point.scale;

      ctx.fillStyle = "rgba(8,19,15,.78)";
      ctx.fillRect(point.x - markerWidth / 2, point.y - markerHeight, markerWidth, markerHeight);
      ctx.strokeStyle = "#f4f3ee";
      ctx.strokeRect(point.x - markerWidth / 2, point.y - markerHeight, markerWidth, markerHeight);
      ctx.fillStyle = "#c8ff37";
      ctx.font = `${Math.max(7, 7 * dpr)}px Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(String(track.id).padStart(2, "0"), point.x, point.y - markerHeight - 3 * dpr);
    });

    ctx.fillStyle = "rgba(8,19,15,.82)";
    ctx.fillRect(14 * dpr, 14 * dpr, 230 * dpr, 28 * dpr);
    ctx.fillStyle = "#c8ff37";
    ctx.font = `${10 * dpr}px Consolas, monospace`;
    ctx.textAlign = "left";
    ctx.fillText("TOUCHLINE / METRIC PROJECTION", 24 * dpr, 33 * dpr);
  } else if (scene === 2) {
    ctx.fillStyle = "#f04438";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 5 * dpr;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 6 * dpr) {
      const y = height / 2 + Math.sin(x * 0.012 / dpr + t * 2.1) * height * 0.18 + (py - height / 2) * 0.14;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "#f4f3ee";
    for (let i = 0; i < 6; i += 1) {
      const x = width * (0.12 + i * 0.15);
      const y = height / 2 + Math.sin(x * 0.012 / dpr + t * 2.1) * height * 0.18 + (py - height / 2) * 0.14;
      ctx.beginPath();
      ctx.arc(x, y, 12 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#ffd522";
    ctx.fillRect(0, 0, width, height);
    const columns = 6;
    const rows = 5;
    const cellW = width / columns;
    const cellH = height / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const phase = Math.sin(t * 1.4 + row * 0.8 + column * 0.6);
        const scale = 0.2 + (phase + 1) * 0.32;
        const w = cellW * scale;
        const h = cellH * scale;
        ctx.fillStyle = (row + column) % 3 === 0 ? "#1847d7" : "#0a0a0a";
        ctx.fillRect(column * cellW + (cellW - w) / 2, row * cellH + (cellH - h) / 2, w, h);
      }
    }
  }
}

function drawReplay() {
  if (!replayStage || replayStage.closest("[hidden]")) return;
  const ctx = replayCanvas.getContext("2d");
  const { width, height, dpr } = fitCanvas(replayCanvas);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#08130f";
  ctx.fillRect(0, 0, width, height);

  const project = (x, y) => {
    if (replayMode === "overhead") {
      return { x: width * (0.08 + x * 0.84), y: height * (0.1 + y * 0.76), scale: 1 };
    }
    const left = width * (0.16 - y * 0.24);
    const right = width * (0.84 + y * 0.24);
    return {
      x: left + x * (right - left),
      y: height * (0.13 + y * 0.73),
      scale: 0.58 + y * 0.72,
    };
  };

  const pitchCorners = [project(0, 0), project(1, 0), project(1, 1), project(0, 1)];
  ctx.beginPath();
  pitchCorners.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.closePath();
  ctx.fillStyle = "#163e2d";
  ctx.fill();
  ctx.strokeStyle = "rgba(244,243,238,.7)";
  ctx.lineWidth = dpr;
  ctx.stroke();

  const pitchLine = (points, close = false) => {
    ctx.beginPath();
    points.map(([x, y]) => project(x, y)).forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    if (close) ctx.closePath();
    ctx.stroke();
  };
  ctx.strokeStyle = "rgba(244,243,238,.44)";
  pitchLine([[0.5, 0], [0.5, 1]]);
  pitchLine([[0.78, 0.22], [1, 0.22], [1, 0.78], [0.78, 0.78]], true);
  pitchLine([[0.9, 0.38], [1, 0.38], [1, 0.62], [0.9, 0.62]], true);
  const centre = project(0.5, 0.5);
  ctx.beginPath();
  ctx.ellipse(centre.x, centre.y, 0.075 * width, 0.075 * height * (replayMode === "overhead" ? 1 : 0.52), 0, 0, Math.PI * 2);
  ctx.stroke();

  const pitchToNormal = ([x, y]) => [(x + 52.5) / 105, (y + 34) / 68];
  const positionAt = (track, amount) => {
    const cursor = amount * (track.points.length - 1);
    const start = Math.floor(cursor);
    const end = Math.min(track.points.length - 1, start + 1);
    const blend = cursor - start;
    return pitchToNormal([
      track.points[start][0] + (track.points[end][0] - track.points[start][0]) * blend,
      track.points[start][1] + (track.points[end][1] - track.points[start][1]) * blend,
    ]);
  };

  touchlineTracks.forEach((track) => {
    const currentCursor = replayProgress * (track.points.length - 1);
    ctx.beginPath();
    for (let step = 0; step <= Math.ceil(currentCursor); step += 1) {
      const amount = Math.min(replayProgress, step / (track.points.length - 1));
      const point = project(...positionAt(track, amount));
      if (step === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
    }
    const current = project(...positionAt(track, replayProgress));
    ctx.lineTo(current.x, current.y);
    ctx.strokeStyle = "rgba(240,68,56,.48)";
    ctx.lineWidth = 1.2 * dpr;
    ctx.stroke();

    const markerWidth = 13 * dpr * current.scale;
    const markerHeight = 19 * dpr * current.scale;
    ctx.fillStyle = "rgba(8,19,15,.72)";
    ctx.fillRect(current.x - markerWidth / 2, current.y - markerHeight, markerWidth, markerHeight);
    ctx.strokeStyle = "#f4f3ee";
    ctx.lineWidth = dpr;
    ctx.strokeRect(current.x - markerWidth / 2, current.y - markerHeight, markerWidth, markerHeight);
    ctx.fillStyle = "#c8ff37";
    ctx.font = `${Math.max(7, 7 * dpr)}px Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(String(track.id).padStart(2, "0"), current.x, current.y - markerHeight - 3 * dpr);
  });
}

function animate(time) {
  if (heroIsVisible || reducedMotion) drawHero(time);
  drawProjectScene(time);
  drawReplay();
  if (!reducedMotion) requestAnimationFrame(animate);
}

function pointerPosition(event, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
  };
}

const scrollProgress = document.querySelector("#scroll-progress");

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);

  if (scrollProgress) {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    scrollProgress.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  }
}

function initScrollReveal() {
  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  document.documentElement.classList.add("reveal-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );

  revealItems.forEach((item) => observer.observe(item));

  // Safety net: never let content stay stuck hidden if the observer
  // fails to fire for any reason.
  window.setTimeout(() => {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }, 2600);
}

function initActiveNav() {
  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const sections = navLinks
    .map((link) => document.querySelector(`#${link.dataset.nav}`))
    .filter(Boolean);
  if (!sections.length) return;

  let updateQueued = false;

  const updateActiveNav = () => {
    updateQueued = false;
    const marker = Math.min(180, Math.max(96, window.innerHeight * 0.22));
    const activeSection = sections.find((section) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= marker && bounds.bottom > marker;
    });

    navLinks.forEach((link) =>
      link.classList.toggle("is-active", link.dataset.nav === activeSection?.id),
    );
  };

  const queueActiveNavUpdate = () => {
    if (updateQueued) return;
    updateQueued = true;
    window.requestAnimationFrame(updateActiveNav);
  };

  window.addEventListener("scroll", queueActiveNavUpdate, { passive: true });
  window.addEventListener("resize", queueActiveNavUpdate);
  updateActiveNav();
}

const finePointer =
  window.matchMedia && window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches;

heroPrecisionPointer = finePointer;

function initMagnetic() {
  if (reducedMotion) return;
  document.querySelectorAll("[data-magnetic]").forEach((element) => {
    const isBrand = element.classList.contains("brand");
    const isContactMail = element.classList.contains("contact-mail");
    const horizontalStrength = isBrand ? 0.25 : isContactMail ? 0.08 : 0.34;
    const verticalStrength = isBrand ? 0.25 : isContactMail ? 0.22 : 0.34;
    let origin = null;
    element.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      origin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    });
    element.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      if (!origin) {
        const rect = element.getBoundingClientRect();
        origin = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
      const moveX = (event.clientX - origin.x) * horizontalStrength;
      const moveY = (event.clientY - origin.y) * verticalStrength;
      element.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
    element.addEventListener("pointerleave", () => {
      origin = null;
      element.style.transform = "";
    });
    element.addEventListener("pointercancel", () => {
      origin = null;
      element.style.transform = "";
    });
  });
}

function initScramble() {
  const elements = [...document.querySelectorAll("[data-scramble]")];
  if (!elements.length || reducedMotion || !("IntersectionObserver" in window)) return;

  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*<>";
  let previousScrollY = window.scrollY;
  let scrollDirection = 1;

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    if (Math.abs(currentScrollY - previousScrollY) > 1) {
      scrollDirection = currentScrollY > previousScrollY ? 1 : -1;
      previousScrollY = currentScrollY;
    }
  }, { passive: true });

  const run = (element, direction) => {
    const finalText = element.textContent;
    const wordParts = finalText.match(/\s*\S+/g) || [finalText];
    const resolvesFromEnd = direction < 0;
    const final = document.createElement("span");
    const live = document.createElement("span");
    final.className = "scramble-final";
    live.className = "scramble-live";
    live.setAttribute("aria-hidden", "true");

    const createWords = (container) =>
      wordParts.map((part) => {
        const word = document.createElement("span");
        word.className = "scramble-word";
        word.textContent = part;
        container.append(word);
        return word;
      });

    createWords(final);
    const liveWords = createWords(live);
    element.setAttribute("aria-label", finalText);
    element.replaceChildren(final, live);

    let progress = 0;
    const id = window.setInterval(() => {
      progress += 1;
      let offset = 0;
      liveWords.forEach((word, wordIndex) => {
        const part = wordParts[wordIndex];
        let output = "";
        for (let i = 0; i < part.length; i += 1) {
          const character = part[i];
          if (/\s/.test(character)) {
            output += character;
          } else if (
            resolvesFromEnd
              ? offset + i >= finalText.length - progress
              : offset + i < progress
          ) {
            output += character;
          } else {
            output += glyphs[Math.floor(Math.random() * glyphs.length)];
          }
        }
        word.textContent = output;
        offset += part.length;
      });
      if (progress >= finalText.length) {
        window.clearInterval(id);
        final.classList.add("is-visible");
        live.remove();
      }
    }, 28);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target, scrollDirection);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  elements.forEach((element) => observer.observe(element));
}

renderProjects();
attachProjectInteractions();
const initialProjectIndex = projectIndexFromHash();
setActiveProject(initialProjectIndex >= 0 ? initialProjectIndex : 0);
startWormRoiMotion(wormStage);
updateHeader();
initScrollReveal();
initActiveNav();
initMagnetic();
initScramble();

requestAnimationFrame(() => {
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-loaded");
  animate(0);
});

const warmWormWhenApproached = () => {
  const warm = () => {
    ensureWormLensWebGLRenderer();
    ensureWormReady()
      .then(() => prewarmWormLensFrame(activeWormImage))
      .catch((error) => console.warn(error));
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warm, { timeout: 600 });
  } else {
    window.setTimeout(warm, 0);
  }
};
const workSection = document.querySelector("#work");
if ("IntersectionObserver" in window) {
  const wormWarmObserver = new IntersectionObserver(
    ([entry], observer) => {
      if (!entry.isIntersecting) return;
      warmWormWhenApproached();
      observer.disconnect();
    },
    { rootMargin: "500px 0px" },
  );
  wormWarmObserver.observe(workSection);
} else {
  window.setTimeout(warmWormWhenApproached, 1200);
}

const registerWorkerWhenIdle = () => registerStreamlineWorker().catch((error) => console.warn(error));
if ("requestIdleCallback" in window) {
  window.requestIdleCallback(registerWorkerWhenIdle, { timeout: 3000 });
} else {
  window.setTimeout(registerWorkerWhenIdle, 1200);
}

if ("IntersectionObserver" in window) {
  const heroVisibilityObserver = new IntersectionObserver(
    ([entry]) => {
      heroIsVisible = entry.isIntersecting;
    },
    { rootMargin: "12% 0px" },
  );
  heroVisibilityObserver.observe(hero);
}

window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("scroll", suspendWormLensForScroll, { passive: true });
if ("onscrollend" in window) {
  window.addEventListener("scrollend", resumeWormLensAfterScroll, { passive: true });
}
window.addEventListener("popstate", () => {
  const index = projectIndexFromHash();
  setActiveProject(index >= 0 ? index : 0);
});
window.addEventListener("resize", () => {
  syncProjectDescriptionHeights();
  syncMetricNotePointers();
  if (wormStage.classList.contains("is-zoomed")) computeWormGeometry();
  else requestWormLensRender();
  if (reducedMotion) animate(0);
});
window.addEventListener("pageshow", () => requestWormLensRender());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") requestWormLensRender();
});

hero.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "touch") return;
  heroPrecisionPointer = true;
  heroPointerInside = true;
});
hero.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  heroPrecisionPointer = true;
  heroPointerInside = true;
  heroPointer = pointerPosition(event, heroCanvas);
});
hero.addEventListener("pointerleave", () => {
  heroPointerInside = false;
});

projectCanvas.addEventListener("pointermove", (event) => {
  stagePointer = pointerPosition(event, projectCanvas);
});

touchlineSequence.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  stopTouchlinePlayback();
  touchlineScrubPointerId = event.pointerId;
  touchlineSequence.focus({ preventScroll: true });
  touchlineSequence.setPointerCapture(event.pointerId);
  touchlineTimeline.classList.add("is-scrubbing");
  loadTouchlineDemo().then(() => queueTouchlineScrub(event.clientX));
});
touchlineSequence.addEventListener("pointermove", (event) => {
  if (event.pointerId === touchlineScrubPointerId) queueTouchlineScrub(event.clientX);
});
function finishTouchlineScrub(event) {
  if (event.pointerId !== touchlineScrubPointerId) return;
  if (touchlineSequence.hasPointerCapture(event.pointerId)) touchlineSequence.releasePointerCapture(event.pointerId);
  touchlineScrubPointerId = null;
  touchlineTimeline.classList.remove("is-scrubbing");
}
touchlineSequence.addEventListener("pointerup", finishTouchlineScrub);
touchlineSequence.addEventListener("pointercancel", finishTouchlineScrub);
touchlineSequence.addEventListener("keydown", (event) => {
  const keyActions = {
    ArrowLeft: touchlineRequestedFrameIndex - 1,
    ArrowRight: touchlineRequestedFrameIndex + 1,
    PageUp: touchlineRequestedFrameIndex + 5,
    PageDown: touchlineRequestedFrameIndex - 5,
    Home: 0,
    End: touchlinePreview ? touchlinePreview.frames.length - 1 : 149,
  };
  if (!(event.key in keyActions)) return;
  event.preventDefault();
  stopTouchlinePlayback();
  loadTouchlineDemo().then(() => renderTouchlineFrame(keyActions[event.key]));
});
touchlinePlay.addEventListener("click", toggleTouchlinePlayback);
touchlinePrevious.addEventListener("click", () => {
  stopTouchlinePlayback();
  loadTouchlineDemo().then(() => renderTouchlineFrame(touchlineRequestedFrameIndex - 1));
});
touchlineNext.addEventListener("click", () => {
  stopTouchlinePlayback();
  loadTouchlineDemo().then(() => renderTouchlineFrame(touchlineRequestedFrameIndex + 1));
});

function updateReplay(value) {
  replayProgress = Math.max(0, Math.min(1, value));
  const frame = 1 + Math.round(replayProgress * 49);
  replayFrame.textContent = `${String(frame).padStart(3, "0")} / 050`;
  replayTime.textContent = `T + ${(replayProgress * 2).toFixed(1)} s`;
  replayEvent.textContent = replayProgress < 0.25
    ? "YOLO11m detections"
    : replayProgress < 0.5
      ? "OC-SORT identities"
      : replayProgress < 0.75
        ? "NBJW camera solve"
        : "Metric projection";
  if (reducedMotion) drawReplay();
}

replayModeButtons.forEach((button) => button.addEventListener("click", () => {
  replayMode = button.dataset.replayMode;
  replayModeButtons.forEach((item) => {
    const active = item === button;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  if (reducedMotion) drawReplay();
}));
if (replayRange) {
  replayRange.addEventListener("input", () => updateReplay(Number(replayRange.value) / 1000));
  updateReplay(replayProgress);
}

wormZoomTrigger.addEventListener("click", zoomWormView);
wormReset.addEventListener("click", () => resetWormView({ waitForZoom: true }));
wormPrevious.addEventListener("click", () => applyWormImage(activeWormImage - 1, -1));
wormNext.addEventListener("click", () => applyWormImage(activeWormImage + 1, 1));
[wormPrevious, wormNext].forEach((button) => {
  button.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "pen") button.classList.add("is-pen-hover");
  });
  button.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "pen") button.classList.remove("is-pen-hover");
  });
});

function writeWormLensScale(node, value) {
  if (!node) return;
  node.setAttribute("scale", value.toFixed(4));
}

function stepWormLensSpring(channel, elapsed) {
  const steps = Math.max(1, Math.ceil(elapsed / (1 / 120)));
  const step = elapsed / steps;

  for (let index = 0; index < steps; index += 1) {
    const acceleration = (channel.target - channel.value) * 250 - channel.velocity * 14;
    channel.velocity += acceleration * step;
    channel.value += channel.velocity * step;
  }
}

function animateWormLensOptics(time) {
  const elapsed = wormLensOpticsPreviousTime
    ? Math.min(0.032, (time - wormLensOpticsPreviousTime) / 1000)
    : 1 / 120;
  wormLensOpticsPreviousTime = time;
  let unsettled = false;

  wormLensFilters.forEach((filter) => {
    stepWormLensSpring(filter.magnification, elapsed);
    stepWormLensSpring(filter.refraction, elapsed);

    [filter.magnification, filter.refraction].forEach((channel) => {
      if (Math.abs(channel.target - channel.value) < 0.001
        && Math.abs(channel.velocity) < 0.001) {
        channel.value = channel.target;
        channel.velocity = 0;
      } else {
        unsettled = true;
      }
    });

    writeWormLensScale(filter.magnificationNode, filter.magnification.value);
    writeWormLensScale(filter.refractionNode, filter.refraction.value);
  });
  requestWormLensRender();

  if (unsettled) {
    wormLensOpticsAnimationFrame = requestAnimationFrame(animateWormLensOptics);
  } else {
    wormLensOpticsAnimationFrame = 0;
    wormLensOpticsPreviousTime = 0;
  }
}

function syncWormLensOptics() {
  const focused = wormComparisonRange.matches(":focus-visible");
  const state = wormCompare.classList.contains("is-dragging")
    ? "pressed"
    : wormCompare.classList.contains("is-near") || focused
      ? "active"
      : "rest";

  wormLensFilters.forEach((filter) => {
    const targets = wormLensOpticalTargets[filter.mode]?.[state];
    if (!targets) return;
    filter.magnification.target = targets.magnification;
    filter.refraction.target = targets.refraction;

    if (reducedMotion) {
      filter.magnification.value = targets.magnification;
      filter.magnification.velocity = 0;
      filter.refraction.value = targets.refraction;
      filter.refraction.velocity = 0;
      writeWormLensScale(filter.magnificationNode, targets.magnification);
      writeWormLensScale(filter.refractionNode, targets.refraction);
    }
  });

  if (!reducedMotion && !wormLensOpticsAnimationFrame) {
    wormLensOpticsAnimationFrame = requestAnimationFrame(animateWormLensOptics);
  } else if (reducedMotion) {
    requestWormLensRender();
  }
}

function updateSliderProximity(event, bounds = wormComparisonRange.getBoundingClientRect(), force = false) {
  const lineX = bounds.left + bounds.width * (Number(wormComparisonRange.value) / 100);
  const handleY = bounds.top + bounds.height / 2;
  const horizontalDistance = Math.abs(event.clientX - lineX);
  const handleDistance = Math.hypot(event.clientX - lineX, event.clientY - handleY);
  const inside = event.clientY >= bounds.top && event.clientY <= bounds.bottom;

  const isNear = (inside && horizontalDistance <= 28) || handleDistance <= 28;
  const wasNear = wormCompare.classList.contains("is-near");
  wormCompare.classList.toggle("is-near", isNear);
  if (force || wasNear !== isNear) syncWormLensOptics();
}

function wormSliderValueFromPointer(event, bounds = wormComparisonRange.getBoundingClientRect()) {
  return Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
}

function updateWormSliderFromPointer(event) {
  const bounds = wormComparisonRange.getBoundingClientRect();
  const value = wormSliderValueFromPointer(event, bounds);
  const time = performance.now();
  const elapsed = Math.max(8, time - wormSliderMotion.time);
  const instantaneousVelocity = ((value - wormSliderMotion.value) / elapsed) * 1000;
  const velocity = wormSliderMotion.velocity * 0.25 + instantaneousVelocity * 0.75;

  wormSliderMotion = {
    ...wormSliderMotion,
    value,
    time,
    velocity,
  };
  updateWormComparison(value);
  updateSliderProximity(event, bounds);
}

function penCanStartSliderDrag(event) {
  if (event.pointerType !== "pen") return true;
  // Samsung Chrome can report pressure=0 and buttons=0 on the S Pen's initial
  // contact event. `button === 0` still distinguishes that real pointerdown
  // from hover movement, whose button value is -1.
  return event.button === 0 || event.pressure > 0 || (event.buttons & 1) === 1;
}

wormComparisonRange.addEventListener("pointerdown", (event) => {
  if (!penCanStartSliderDrag(event)) {
    event.preventDefault();
    updateSliderProximity(event);
    return;
  }
  event.preventDefault();
  cancelAnimationFrame(wormAnimationFrame);
  wormSliderPointerId = event.pointerId;
  wormComparisonRange.setPointerCapture(event.pointerId);
  wormCompare.classList.add("is-dragging");
  syncWormLensOptics();
  const bounds = wormComparisonRange.getBoundingClientRect();
  const value = wormSliderValueFromPointer(event, bounds);
  const time = performance.now();
  wormSliderMotion = {
    value,
    time,
    velocity: 0,
    startValue: value,
    startTime: time,
  };
  updateWormComparison(value);
  updateSliderProximity(event, bounds);
});
wormComparisonRange.addEventListener("pointermove", (event) => {
  if (event.pointerId === wormSliderPointerId) {
    // Once contact begins, retain the drag until pointerup/pointercancel.
    // Pressure and `buttons` can momentarily drop to zero on Samsung pens.
    updateWormSliderFromPointer(event);
    return;
  }
  updateSliderProximity(event);
});
wormCompare.addEventListener("pointerleave", () => {
  if (!wormCompare.classList.contains("is-dragging")
      && wormCompare.classList.contains("is-near")) {
    wormCompare.classList.remove("is-near");
    syncWormLensOptics();
  }
});

function finishWormSliderDrag(event, shouldSettle) {
  if (event.pointerId !== wormSliderPointerId) return;
  if (wormComparisonRange.hasPointerCapture(event.pointerId)) {
    wormComparisonRange.releasePointerCapture(event.pointerId);
  }
  wormSliderPointerId = null;
  wormCompare.classList.remove("is-dragging");
  updateSliderProximity(event, undefined, true);
  if (shouldSettle) settleWormComparison();
}

wormComparisonRange.addEventListener("pointerup", (event) => finishWormSliderDrag(event, true));
wormComparisonRange.addEventListener("pointercancel", (event) => finishWormSliderDrag(event, false));
wormComparisonRange.addEventListener("input", () => {
  if (wormSliderPointerId !== null) return;
  cancelAnimationFrame(wormAnimationFrame);
  const value = Number(wormComparisonRange.value);
  const time = performance.now();
  const elapsed = Math.max(8, time - wormSliderMotion.time);
  const velocity = ((value - wormSliderMotion.value) / elapsed) * 1000;
  wormSliderMotion = {
    value,
    time,
    velocity,
    startValue: value,
    startTime: time,
  };
  updateWormComparison(value);
});
wormComparisonRange.addEventListener("change", () => {
  if (wormSliderPointerId === null) settleWormComparison();
});
wormComparisonRange.addEventListener("focus", syncWormLensOptics);
wormComparisonRange.addEventListener("blur", syncWormLensOptics);
syncWormLensOptics();
