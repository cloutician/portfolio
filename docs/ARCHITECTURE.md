# Architecture

This document gives reviewers a technical map of the portfolio without requiring them to reverse-engineer the interactive page first.

## Runtime shape

The portfolio is predominantly a client-rendered, single-page experience:

1. `index.html` supplies the semantic page and initial project state.
2. `styles.css` owns the visual system, responsive layouts and interaction transitions.
3. `script.js` coordinates project selection, WormProfiler, Touchline, the 3D placeholder and input-specific behaviour.
4. `worm-lens-webgl.js` renders the WormProfiler magnifying lens through WebGL2 when the browser supports it.
5. `public/streamline-sw.js` supports the site's asset-caching strategy.
6. Vite builds the client assets and Cloudflare Worker bundle for deployment.

`public/hero-intro.js` starts the existing hero entrance independently of the project module. Space Grotesk and Space Mono are served as local WOFF2 files; only the primary variable font is preloaded. Lens maps and project preparation wait until the project stage approaches the viewport and the first hero frames and font requests have completed. A user interaction can prepare a demo immediately.

## WormProfiler presentation

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

## Switch and the 3D project previews

Switch (slot 03) and the queued project (slot 04) use `placeholder-viewer.js`, Three.js and `OrbitControls`. Switch has a dedicated case-study panel with a labelled original-game reference screenshot and a scoped warm orange/red/yellow theme; the remaining placeholder retains the cat. Per-slot configuration supplies the asset, animation, camera and accessible copy. One renderer caches the two models and their independent mixers. Selection tokens prevent a late asset load from replacing the currently requested model. The old `#project-placeholder-03` fragment remains an alias for `#project-switch`.

The rocket repeats its embedded `Thruster_Cycle` animation (6.4 seconds). Its orbit pivot is centred on the solid rocket housing, not the exhaust. The fixed default view is magnified 3× relative to the initial full-cycle framing. A rocket-only render surface spans the project pane, with an off-axis projection that preserves the body position and scale. Rendering never adjusts camera distance during rotation; neither model supports wheel or pinch zoom. The cat keeps its agreed camera angle with 10% greater optical magnification. Camera reset restores each fixed view without restarting its animation. The exported rocket body orientation is unchanged. Reduced-motion mode presents a still frame and renders only while the camera is changing.

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
