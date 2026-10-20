# Architecture

This document gives reviewers a technical map of the portfolio without requiring them to reverse-engineer the interactive page first.

## Runtime shape

The portfolio is predominantly a client-rendered, single-page experience:

1. `index.html` supplies the semantic page and initial project state.
2. `styles.css` owns the visual system, responsive layouts and interaction transitions.
3. `script.js` coordinates project selection, Worm Profiler, Touchline, the 3D placeholder and input-specific behaviour.
4. `worm-lens-webgl.js` renders the Worm Profiler magnifying lens through WebGL2 when the browser supports it.
5. `public/streamline-sw.js` supports the site's asset-caching strategy.
6. Vite builds the client assets and Cloudflare Worker bundle for deployment.

`public/hero-intro.js` starts the existing hero entrance independently of the project module. Space Grotesk and Space Mono are served as local WOFF2 files; only the primary variable font is preloaded. Lens maps and project preparation wait until the project stage approaches the viewport and the first hero frames and font requests have completed. A user interaction can prepare a demo immediately.

## Worm Profiler presentation

The browser demo deliberately separates source preparation from runtime delivery.

- Full-resolution camera captures remain local and are excluded from the public repository.
- Browser-ready overview, zoom and segmentation derivatives live in `public/assets/demos/`.
- The page initially uses lighter overview media.
- Detailed views use dedicated high-resolution crops rather than scaling the overview indefinitely.
- The comparison state is shared across pointer, touch and supported stylus interaction.
- The WebGL2 lens uses decoded image textures; unsupported environments retain a fallback renderer.

This structure balances close inspection with download size and mobile memory pressure.

## Touchline presentation

Touchline is represented as a bounded browser demo rather than the complete development environment.

- The live demo loads sampled WebP frames from a locally retained `public/assets/demos/touchline/frames/` directory that is excluded from the public repository.
- `preview-data.js` associates each retained frame with its annotations and timing data.
- Two visual layers allow decoded incoming frames to replace the current frame cleanly.
- Nearby frames are preloaded while distant cached frames are released.
- Overlay coordinates are transformed with the displayed media dimensions so annotations remain attached during responsive resizing.

The public source therefore documents the interface and playback system but does not contain the SoccerNet-derived footage required to reproduce the complete visual demo.

## 3D placeholder

The queued-project placeholder uses Three.js and `OrbitControls` to display a GLB model with constrained camera movement and a reproducible reset position.

An IntersectionObserver pauses its render loop outside the viewport. Returning resumes the existing mixer, camera and controls; it does not run the project-selection reset. Touchline similarly preserves elapsed playback time while off-screen or in a hidden browser tab.

## Deployment

The production build uses:

- Vite for client bundling.
- `@cloudflare/vite-plugin` for the Worker environment.
- `@openai/sites-vite-plugin` for Sites packaging and deployment.
- Wrangler configuration for SPA fallback and static assets.

The production website is available at [onyemenam.dev](https://onyemenam.dev).

## Performance principles

### Scheduling and lens geometry

Scroll and resize updates share one animation-frame queue for header progress, active navigation and responsive layout work. The progress indicator uses a transform rather than a changing width. The ambient canvas loop stops when none of its surfaces are visible.

Stable source-image rectangles are cached relative to the Worm Profiler stage. Each lens draw still reads the stage's actual position, including sticky positioning. Zooms, resets, incoming images and swipes invalidate or bypass the cache and continue measuring the interpolated transforms. Shader code, texture-resolution limits, source-image files and interaction timings are unchanged.

### Asset caching

`tools/streamline-build.mjs` fingerprints public files and emitted client bundles on each production build and injects those fingerprints into the service worker. Asset cache keys use content fingerprints; a changed file fetches fresh bytes even when its public URL is unchanged. Cache writes run after the response can be delivered.

The cache retains the current and previous build's fingerprints, removes older entries and caps asset storage at 320 responses. The previous build supports already-open documents and the last cached offline page. HTML stays network-first with an offline fallback. Development unregisters this worker on both loopback and LAN URLs; it does not cache development sources.

### Local verification, 20 October 2026

Three cold mobile runs at 390 × 844, DPR 2, 100 ms network latency, 200 KB/s download and 4× CPU slowdown produced median LCP of 2,724 ms before and 1,160 ms after these changes. These are comparative local Chrome measurements, not published PageSpeed scores or field data.

With the cat selected but scrolled off-screen, the same desktop check went from 60 cat draws and 120 animation callbacks per second to zero. Pause/resume playback, zoomed navigation, pen hover, layout widths from 320 to 1440 px, stale-file recovery and a cached offline reload were also checked.

- Serve purpose-built responsive media instead of original captures in the initial page.
- Decode and preload only the assets needed for the next likely interaction.
- Avoid retaining the complete Touchline sequence in memory.
- Keep animated geometry on transform/opacity paths where visual quality permits.
- Preserve a non-WebGL lens path for compatibility.
- Respect reduced-motion preferences and input differences across mouse, touch and stylus devices.
