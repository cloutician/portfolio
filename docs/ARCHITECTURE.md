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

## Deployment

The production build uses:

- Vite for client bundling.
- `@cloudflare/vite-plugin` for the Worker environment.
- `@openai/sites-vite-plugin` for Sites packaging and deployment.
- Wrangler configuration for SPA fallback and static assets.

The production website is available at [onyemenam.dev](https://onyemenam.dev).

## Performance principles

- Serve purpose-built responsive media instead of original captures in the initial page.
- Decode and preload only the assets needed for the next likely interaction.
- Avoid retaining the complete Touchline sequence in memory.
- Keep animated geometry on transform/opacity paths where visual quality permits.
- Preserve a non-WebGL lens path for compatibility.
- Respect reduced-motion preferences and input differences across mouse, touch and stylus devices.
