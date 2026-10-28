# Architecture

This document gives reviewers a technical map of the portfolio without requiring them to reverse-engineer the interactive page first.

## Runtime shape

The portfolio is predominantly a client-rendered, single-page experience:

1. `index.html` supplies the semantic page and initial project state.
2. `styles.css` owns the visual system, responsive layouts and interaction transitions.
3. `script.js` coordinates project selection, WormProfiler, Touchline, the 3D project previews and input-specific behaviour.
4. `worm-lens-webgl.js` renders the WormProfiler magnifying lens through WebGL2 when the browser supports it.
5. `public/streamline-sw.js` supports the site's asset-caching strategy.
6. Vite builds the client assets and Cloudflare Worker bundle for deployment.

`public/hero-intro.js` starts the existing hero entrance independently of the project module. Space Grotesk and Space Mono are served as local WOFF2 files; only the primary variable font is preloaded. The shared `preview-assets.js` queue starts model and Touchline preparation after the hero has painted, fonts are ready and the initial document load has finished. The existing revision-aware service worker gets a bounded background opportunity to take control before these requests, never blocking the hero. WormProfiler lens maps and detailed preparation still follow the approaching project stage. User interaction can prepare a demo immediately.

The queue shares in-flight promises and retained compressed blobs across preloading and actual clicks. Two low-priority network slots are used normally, one on Data Saver/2G, with a reserved slot and priority promotion for real interactions. Bulk requests pause while the page is hidden. On Data Saver/2G, only the player model and opening Touchline window are warmed until the project stage is approached; then the rest is queued. Failed requests remain retryable. `npm test` covers queue gating, prioritization, deduplication, visibility and failure handling.

Expensive preparation runs one model/thumbnail task at a time in idle periods and waits for scroll/drag activity to settle. Animation-bound fitting yields after small work slices. Models are parsed and their GPU programs/textures warmed using isolated scenes and a scratch render target, without selecting them, altering the live camera or drawing another model to the displayed canvas. Warm-up restores mixer time and exposure. The three prepared records remain paused until selected. CPU/GPU warming is not a new loading-screen requirement. Performance marks `portfolio-preview-preload-start` and `portfolio-previews-ready` make readiness testable without adding visible status UI.

## WormProfiler presentation

The browser demo deliberately separates source preparation from runtime delivery.

- Full-resolution camera captures remain local and are excluded from the public repository.
- Browser-ready overview, zoom and segmentation derivatives live in `public/assets/demos/`.
- The page initially uses lighter overview media.
- Detailed views use dedicated high-resolution crops rather than scaling the overview indefinitely.
- The comparison state is shared across pointer, touch and supported stylus interaction.
- The WebGL2 lens uses decoded image textures; unsupported environments retain a fallback renderer.
- Zoomed navigation prepares both stages' lens textures before the existing 420 ms slide starts. A transient texture miss retains the completed shader frame; only genuine renderer unavailability selects the fallback. Empty camera space is rendered through the glass normally, not treated as a failure.
- Lens diameter follows the actual project-preview width (28–48 CSS pixels at rest), rather than a 24/48-pixel phone/desktop split. The ring, rail joins, hover/press sizes and both renderers' optical maps share that scale. Rendering remains on demand and scroll/offscreen suspension is unchanged.

This structure balances close inspection with download size and mobile memory pressure.

## Touchline presentation

Touchline is represented as a bounded browser demo rather than the complete development environment.

- The live demo loads sampled WebP frames from a locally retained `public/assets/demos/touchline/frames/` directory that is excluded from the public repository.
- `preview-data.js` associates each retained frame with its annotations and timing data.
- Two visual layers allow decoded incoming frames to replace the current frame cleanly.
- All 150 compressed WebP frame files are fetched progressively in the background, independently of selecting Touchline. A missing first frame stops bulk warming, so the public source checkout (which excludes the footage) does not issue 150 failing requests.
- A bounded nearby window is decoded; pruning releases its blob URLs, while the two displayed layers are protected through atomic swaps. Seeking uses the already-cached compressed blob instead of downloading it again. This is not a promise to keep all 150 images decoded in memory.
- The twelve filmstrip thumbnails are prepared as 160×90 display-only derivatives. They do not retain twelve extra full-size decoded frames; the main 960×540 frame assets and annotation coordinates are unchanged.
- Overlay coordinates are transformed with the displayed media dimensions so annotations remain attached during responsive resizing.

The public source therefore documents the interface and playback system but does not contain the SoccerNet-derived footage required to reproduce the complete visual demo.

## Progressive interaction haptics

`interaction-haptics.js` uses the Vibration API only where available. Trusted finger/pen scrubbing requests a 4 ms detent when the Touchline seek index changes, capped at one pulse per 50 ms; skipped samples never queue a burst. WormProfiler's previous/next buttons request one 12 ms pulse per accepted touch/pen click. Playback, hover, keyboard and mouse actions remain silent. Release, cancellation, lost capture, blur, hidden tabs and leaving Touchline clear scrub feedback. Reduced-motion mode disables pulses. Unsupported/denied APIs fail silently without changing control behaviour; no iOS hidden-switch workaround is installed. Pulse duration is not a guarantee of physical intensity on every device.

## Switch and the 3D project previews

Switch (Remake), in slot 03, and the queued project in slot 04 use `model-viewer.js`, Three.js and `OrbitControls`. Both use the model-neutral `project-model-stage` and `project-model-canvas` hooks. The `interactive: "model"` setting selects this viewer; the separate `queued: true` setting controls slot 04's placeholder styling, not which renderer is used. Per-model configuration supplies the asset, animation, camera framing and accessible copy. The hoverable “Switch.” title is a native button that toggles independent `rocket-player` and `rocket-enemy` cache entries and mixers, and remembers the chosen variant when leaving the project. One renderer also caches the cat. All three records are warmed in the background on ordinary connections; selection tokens prevent late warming or asset loads from replacing the currently requested model.

Rockets share a `swapGroup`. A variant-only selection keeps the outgoing model mounted and playing until the requested asset is ready. At the atomic swap, the incoming mixer takes the outgoing mixer's current elapsed time, synchronizing the full thrust/ember pose. The camera, OrbitControls damping, idle spin phase, reset tween and render clock are not reset. The default reset view is copied to the incoming record, so Reset retains the same moving reference. Clicking back during a pending load cancels that swap without disturbing the visible model. Switching to another project retains the normal project-selection behavior.

Switch has a dedicated case-study panel with a labelled original-game reference screenshot and scoped red/orange/yellow accents. Its rocket asset lives in `public/assets/switch/`; only the queued cat remains in `public/assets/placeholders/`. Cat camera angles are explicit configuration rather than hard-coded defaults inside the shared renderer. The old `#project-placeholder-03` fragment remains an alias for `#project-switch`, and slot 04 retains its existing `#project-placeholder-04` address.

Both rocket exports repeat their embedded `Thruster_Cycle` animations (6.4 seconds), including fourteen animated embers and complete shutdown. Their orbit pivots are centred on `Folded_Grey_Housing`, not the exhaust. A seven-degree presentation wrapper restores the earlier display pitch without modifying either export. The rockets retain the earlier 3× full-cycle framing rather than pulling the camera back to contain every ember at every orbit angle; outer particles can leave the pane at extreme rotations. Fitting runs on selection or layout changes, never while dragging. An expanded render surface spans the project pane, with an off-axis projection that preserves the body position and scale. Neither rockets nor cat support wheel or pinch zoom. The cat keeps its agreed angle with 10% greater optical magnification. Camera reset restores each fixed view without restarting its animation. Reduced-motion mode uses the first, engine-off frame and renders only while the camera is changing.

Rockets use the inspector's sRGB/ACES reference lighting and exposure 1.18; the cat's original lights and exposure remain separate. `rocket-effects.js` preserves GLB colours, emissive strengths, vertex colours, transparency, unlit materials and double-sided geometry. The player uses a post-tone-map red surface correction plus a panel-only, half-resolution halo at strength .085 with the reference .8 red reduction. Exhaust and embers are excluded from opaque mask occluders. The export already contains reduced red emission, so it is not multiplied again.

The enemy uses a linear, multisampled HDR target and Three.js bloom at strength .055, radius 0, threshold .9. Its final composite preserves the source coverage and halo alpha and performs ACES/sRGB conversion once. The player keeps direct scene rendering plus a premultiplied, transparency-aware additive halo; neither effect paints an opaque rectangle. Targets follow the viewer's existing render camera and drawing-buffer pixel ratio. Effects are cached per model and render only through the visible viewer loop. Phones retain the same side-by-side model, “Switch.” word toggle and description arrangement, with the full rocket description visible even on the narrowest layout. Other project layouts and the cat are unchanged.

An IntersectionObserver pauses its render loop outside the viewport. Returning resumes the existing mixer, camera and controls; it does not run the project-selection reset. Touchline similarly preserves elapsed playback time while off-screen or in a hidden browser tab.

The rocket auto-orbits gently at one revolution per two minutes, using elapsed time rather than display frame count. Manual dragging takes priority; reduced-motion mode disables the auto-orbit. The cat's existing animation is unchanged.

The models' Reset button follows a 220 ms eased, shortest-angle orbit, preserving fixed magnification and animation playback. The rocket has an independent idle-spin phase that advances even during manual orbiting: Reset rejoins the moving pose it would have reached without user rotation, rather than rewinding to the starting angle. The cat returns to its fixed default view. A new drag interrupts the return; reduced-motion mode resets immediately.

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

The three project-information panels share the tallest natural content height at the current viewport and font size. Temporary inert measurement panels are removed immediately, and their image aspect ratios are reserved without loading inactive media. Resizing or font readiness refreshes the shared minimum height; ordinary project switches reuse it. Content remains free to grow rather than being clipped, and the following section stays in the same position between case studies.

Stable source-image rectangles are cached relative to the WormProfiler stage. Each lens draw still reads the stage's actual position, including sticky positioning. Zooms, resets, incoming images and swipes invalidate or bypass the cache and continue measuring the interpolated transforms. Shader code, texture-resolution limits, source-image files and interaction timings are unchanged.

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
