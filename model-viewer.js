import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createRocketEffects } from "./rocket-effects.js";

// One canvas/renderer, independent cached models and mixers. Selection is the only
// operation allowed to mount a loaded model, so late loads cannot replace it.
export class ProjectModelViewer {
  constructor(canvas, { reducedMotion = false, onInteract = () => {}, loadAsset = null, yieldWork = () => Promise.resolve() } = {}) {
    this.canvas = canvas;
    this.loadAsset = loadAsset;
    this.yieldWork = yieldWork;
    this.preparing = new Map();
    this.reducedMotion = reducedMotion;
    this.records = new Map();
    this.selection = 0;
    this.active = null;
    this.visible = false;
    this.animationFrame = 0;
    this.previousTime = 0;
    this.holdUntil = 0;
    this.aspect = 1;
    this.surface = null;
    this.resetTransition = null;
    this.autoOrbitPhase = 0;
    this.autoOrbitSpeed = 0;
    this.interacting = false;
    this.spinAxis = new THREE.Vector3(0, 1, 0);
    this.renderCamera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x242424, 2.6);
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    const rim = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2.5, 4, 3.5);
    rim.position.set(-3, 1.5, -2);
    this.defaultLighting = new THREE.Group();
    this.defaultLighting.add(hemisphere, key, rim);
    this.rocketLighting = new THREE.Group();
    const rocketKey = new THREE.DirectionalLight(0xffe0b8, 3.1);
    rocketKey.position.set(-4, 6, 5);
    const rocketRim = new THREE.PointLight(0x527dff, 20, 13, 2);
    rocketRim.position.set(3, 2.6, -3.5);
    this.rocketLighting.add(new THREE.HemisphereLight(0xaab8ff, 0x100913, 2.4), rocketKey, rocketRim);
    this.rocketLighting.visible = false;
    this.scene.add(this.defaultLighting, this.rocketLighting);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.rotateSpeed = 0.72;
    this.controls.minPolarAngle = 0.2;
    this.controls.maxPolarAngle = Math.PI - 0.2;
    this.controls.enabled = false;
    this.controls.addEventListener("start", () => {
      this.interacting = true;
      this.cancelResetTransition();
      onInteract();
      this.requestRender();
    });
    this.controls.addEventListener("end", () => { this.interacting = false; });
    this.controls.addEventListener("change", () => this.requestRender());
    this.render = this.render.bind(this);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resizeObserver.observe(canvas.parentElement);
    this.resizeObserver.observe(canvas.closest(".project-model-stage"));
  }

  async load(config, { background = false } = {}) {
    if (!background && this.preparing.has(config.key)) this.preparing.get(config.key).background = false;
    if (!this.records.has(config.key)) {
      const preparation = { background };
      this.preparing.set(config.key, preparation);
      const promise = (async () => {
        const loader = new GLTFLoader();
        let gltf;
        if (this.loadAsset) {
          const blob = await this.loadAsset(config.url, preparation.background);
          await this.yieldWork(preparation.background);
          gltf = await loader.parseAsync(await blob.arrayBuffer(), "");
        } else gltf = await loader.loadAsync(config.url);
        const model = gltf.scene;
        const presentation = new THREE.Group();
        presentation.rotation.x = THREE.MathUtils.degToRad(config.presentationPitch ?? 0);
        presentation.add(model);
        const clip = config.animation
          ? THREE.AnimationClip.findByName(gltf.animations, config.animation)
          : gltf.animations[0];
        if (config.animation && !clip) throw new Error(`Missing ${config.animation} animation in ${config.key}.`);
        const mixer = clip ? new THREE.AnimationMixer(model) : null;
        const action = mixer?.clipAction(clip);
        action?.setLoop(THREE.LoopRepeat, Infinity).play();
        const bounds = new THREE.Box3();
        if (config.fitAnimation && clip) {
          // Sample the full cycle, including its keyframes, before centring the
          // wrapper. Never alter the exported body's orientation or pitch.
          const times = new Set([0]);
          for (const track of clip.tracks) for (const time of track.times) times.add(time);
          for (let frame = 0; frame <= Math.ceil(clip.duration * 60); frame++) {
            times.add(Math.min(frame / 60, clip.duration));
          }
          let sliceStarted = performance.now();
          for (const time of times) {
            mixer.setTime(time);
            presentation.updateMatrixWorld(true);
            bounds.union(new THREE.Box3().setFromObject(presentation));
            if (performance.now() - sliceStarted >= 4) {
              await this.yieldWork(preparation.background);
              sliceStarted = performance.now();
            }
          }
          mixer.setTime(0);
          model.traverse((node) => {
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            for (const material of materials) {
              if (!material) continue;
              if (material.transparent) material.depthWrite = false;
              if (material.isMeshBasicMaterial) material.toneMapped = false;
            }
          });
        } else {
          presentation.updateMatrixWorld(true);
          bounds.setFromObject(presentation);
        }
        const root = new THREE.Group();
        root.name = `project-model-${config.key}`;
        root.add(presentation);
        root.updateMatrixWorld(true);
        const anchor = config.orbitAnchor && model.getObjectByName(config.orbitAnchor);
        if (config.orbitAnchor && !anchor) throw new Error(`Missing ${config.orbitAnchor} orbit anchor in ${config.key}.`);
        // Exhaust is useful for fitting the view, but must not move the orbit
        // pivot away from the solid body as the engine ignites and shuts down.
        const centre = (anchor ? new THREE.Box3().setFromObject(anchor) : bounds).getCenter(new THREE.Vector3());
        root.position.copy(centre).negate();
        root.updateMatrixWorld(true);
        const size = bounds.getSize(new THREE.Vector3());
        const record = {
          config, root, presentation, model, mixer, action, clip, bounds,
          extent: Math.max(size.x, size.y, size.z, 0.1),
          radius: Math.max(size.length() / 2, 0.05),
          defaultView: null,
        };
        record.effects = createRocketEffects(this.renderer, record);
        return record;
      })().catch((error) => {
        this.records.delete(config.key);
        throw error;
      }).finally(() => this.preparing.delete(config.key));
      this.records.set(config.key, promise);
    }
    return this.records.get(config.key);
  }

  async prepare(config) {
    const record = await this.load(config, { background: true });
    // Never run a hidden model's effects over a visible interactive demo.
    if (this.visible || this.active === record || record.gpuPrepared) return record;
    if (!record.warmPromise) {
      record.warmPromise = this.warmRecord(record).catch(error => {
        record.warmPromise = null;
        throw error;
      });
    }
    await record.warmPromise;
    return record;
  }

  async warmRecord(record) {
    const scene = new THREE.Scene();
    const lights = (record.config.lighting === "switch-rockets" ? this.rocketLighting : this.defaultLighting).clone();
    lights.visible = true;
    scene.add(lights, record.root);
    const camera = new THREE.PerspectiveCamera(record.config.fieldOfView ?? 30, 1, record.extent / 100, record.extent * 20);
    camera.position.set(1.5, 1.55, -1.4).normalize().multiplyScalar(record.radius * 4);
    camera.lookAt(0, 0, 0);
    const renderer = this.renderer;
    let target = renderer.getRenderTarget();
    try {
      // Compile the same on/offscreen material variants used by real playback.
      renderer.setRenderTarget(record.effects?.baseTarget || null);
      const compiled = renderer.compileAsync(scene, camera);
      renderer.setRenderTarget(target);
      await compiled;
      if (record.root.parent !== scene || this.active === record || this.visible) return;
      const scratch = new THREE.WebGLRenderTarget(32, 32);
      const time = record.mixer?.time ?? 0, exposure = renderer.toneMappingExposure;
      try {
        renderer.toneMappingExposure = record.config.exposure ?? 1;
        record.mixer?.setTime(record.clip ? Math.min(1.6, record.clip.duration / 2) : 0);
        renderer.setRenderTarget(scratch);
        if (record.effects) record.effects.render(scene, camera);
        else renderer.render(scene, camera);
      } finally {
        record.mixer?.setTime(time);
        record.root.updateMatrixWorld(true);
        renderer.toneMappingExposure = exposure;
        renderer.setRenderTarget(target);
        scratch.dispose();
      }
      const output = record.effects?.haloMaterial || record.effects?.outputMaterial;
      if (output) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
        const quad = new THREE.Mesh(geometry, output);
        renderer.setRenderTarget(null);
        const compiledOutput = renderer.compileAsync(quad, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
        renderer.setRenderTarget(target);
        try { await compiledOutput; } finally { geometry.dispose(); }
      }
      record.gpuPrepared = true;
    } finally {
      if (record.root.parent === scene) scene.remove(record.root);
      // No state was held changed across an await; another selection may have
      // legitimately changed the render target since compilation began.
    }
  }

  async select(config, { preserveState = false } = {}) {
    const keepState = preserveState && config.swapGroup && this.active?.config.swapGroup === config.swapGroup;
    if (keepState) this.selection++;
    else this.cancelSelection();
    const selection = this.selection;
    const record = await this.load(config);
    if (record.warmPromise) await record.warmPromise;
    if (selection !== this.selection) return null;
    if (keepState && this.active?.config.swapGroup === config.swapGroup) {
      const outgoing = this.active;
      if (record === outgoing) return record; // Cancel a pending swap back to the visible model.
      // Take the live clock at commit time, not at click time: the outgoing
      // model keeps playing and orbiting throughout a cold asset load.
      record.mixer?.setTime(outgoing.mixer?.time ?? 0);
      const home = outgoing.defaultView;
      record.defaultView = {
        position: home.position.clone(), quaternion: home.quaternion.clone(),
        target: home.target.clone(), zoom: home.zoom,
      };
      this.scene.remove(outgoing.root);
      this.active = record;
      this.scene.add(record.root);
      this.applyAppearance(config);
      // Camera, OrbitControls/damping, idle phase, reset tween and frame clock
      // remain untouched. Only the model/effect pair changes on the next draw.
      this.requestRender();
      return record;
    }
    this.active = record;
    this.scene.add(record.root);
    this.applyAppearance(config);
    // Keep the idle spin clock independent of user orbiting. OrbitControls
    // handles only the user's offset, never the automatic spin itself.
    this.controls.autoRotate = false;
    this.autoOrbitPhase = 0;
    this.autoOrbitSpeed = this.reducedMotion ? 0 : (config.autoRotateSpeed ?? 0);
    this.interacting = false;
    record.mixer?.setTime(this.reducedMotion ? (config.reducedTime ?? 0) : 0);
    this.holdUntil = performance.now() + (this.reducedMotion ? 0 : (config.entryHold ?? 0));
    this.resize();
    this.configureCamera(record);
    this.resetView();
    this.controls.enabled = this.visible;
    this.canvas.style.visibility = "visible";
    this.requestRender();
    return record;
  }

  applyAppearance(config) {
    this.canvas.closest(".project-model-stage").classList.toggle("has-expanded-model", !!config.expandViewport);
    // The drawing area can grow without making the whole pane swallow touch
    // scrolling. Keep the original model-sized drag surface and sensitivity.
    const input = config.expandViewport ? this.canvas.parentElement : this.canvas;
    if (this.controls.domElement !== input) {
      this.controls.disconnect();
      this.controls.connect(input);
    }
    this.renderer.toneMappingExposure = config.exposure ?? 1;
    const rocketLighting = config.lighting === "switch-rockets";
    this.defaultLighting.visible = !rocketLighting;
    this.rocketLighting.visible = rocketLighting;
  }

  configureCamera(record, preserveView = false) {
    this.cancelResetTransition();
    const { camera, controls } = this;
    const oldDefault = record.defaultView;
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.fov = record.config.fieldOfView ?? 30;
    camera.near = record.extent / 100;
    camera.far = record.extent * 20;
    camera.zoom = record.config.cameraOrbit ? (record.config.defaultZoom ?? 1) : 1;
    controls.target.set(0, 0, 0);
    if (!record.config.cameraOrbit) {
      const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
      const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
      const projection = Math.sin(Math.min(vertical, horizontal));
      const fit = record.radius / projection * 1.04;
      const distance = fit * 1.12 / (record.config.defaultZoom ?? 1);
      camera.position.fromArray(record.config.cameraDirection).normalize().multiplyScalar(distance);
    } else {
      // Explicit orbit settings belong to each model, not the shared viewer.
      // Apply fixed magnification optically without changing orbit distance.
      const orbit = record.config.cameraOrbit;
      const initial = new THREE.Spherical().setFromVector3(
        new THREE.Vector3().fromArray(orbit.direction).multiplyScalar(record.extent),
      );
      initial.radius *= orbit.radiusScale;
      initial.theta += THREE.MathUtils.degToRad(orbit.azimuthDegrees);
      initial.phi += THREE.MathUtils.degToRad(orbit.polarDegrees);
      camera.position.setFromSpherical(initial);
    }
    // Orbit only: neither pointer gestures nor the render path may dolly the
    // camera. Equal limits also prevent residual control state changing size.
    const distance = camera.position.length();
    controls.minDistance = distance;
    controls.maxDistance = distance;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    record.defaultView = {
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
      target: controls.target.clone(),
      zoom: camera.zoom,
    };
    if (preserveView && oldDefault) {
      camera.position.copy(direction.multiplyScalar(distance));
      camera.lookAt(controls.target);
    }
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.saveState();
    controls.enableDamping = damping;
  }

  getResetView() {
    const view = this.active.defaultView;
    if (!this.autoOrbitSpeed) return view;
    const rotation = new THREE.Quaternion().setFromAxisAngle(this.spinAxis, this.autoOrbitPhase);
    return {
      ...view,
      position: view.position.clone().sub(view.target).applyQuaternion(rotation).add(view.target),
      quaternion: view.quaternion.clone().premultiply(rotation),
    };
  }

  resetView({ animate = false } = {}) {
    if (!this.active?.defaultView) return;
    this.cancelResetTransition();
    const { camera, controls } = this;
    const view = this.getResetView();
    const shouldAnimate = animate && !this.reducedMotion && this.visible && !document.hidden;
    const fromPosition = shouldAnimate ? camera.position.clone() : view.position;
    const fromTarget = shouldAnimate ? controls.target.clone() : view.target;
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.reset();
    camera.position.copy(fromPosition);
    camera.zoom = view.zoom;
    controls.target.copy(fromTarget);
    camera.lookAt(controls.target);
    camera.updateProjectionMatrix();
    controls.update();
    if (shouldAnimate) {
      const from = new THREE.Spherical().setFromVector3(fromPosition.clone().sub(fromTarget));
      const to = new THREE.Spherical().setFromVector3(view.position.clone().sub(view.target));
      this.resetTransition = {
        elapsed: 0, duration: 0.22, from, to, fromTarget,
        thetaDelta: THREE.MathUtils.euclideanModulo(to.theta - from.theta + Math.PI, Math.PI * 2) - Math.PI,
        spherical: from.clone(), view, damping, phase: this.autoOrbitPhase,
      };
    } else {
      camera.quaternion.copy(view.quaternion);
      controls.enableDamping = damping;
    }
    // Camera reset does not touch the mixer or restart the model animation.
    this.requestRender();
  }

  cancelResetTransition() {
    if (!this.resetTransition) return;
    this.controls.enableDamping = this.resetTransition.damping;
    this.resetTransition = null;
  }

  advanceResetTransition(delta) {
    const motion = this.resetTransition;
    if (!motion) return false;
    motion.elapsed += delta;
    const progress = Math.min(1, motion.elapsed / motion.duration);
    const ease = 1 - Math.pow(1 - progress, 3);
    // Aim at the moving idle pose, not the pose at the instant of the click.
    // At the end, its velocity already matches the ongoing gentle spin.
    const spinSinceStart = this.autoOrbitPhase - motion.phase;
    motion.spherical.theta = motion.from.theta + (motion.thetaDelta + spinSinceStart) * ease;
    motion.spherical.phi = THREE.MathUtils.lerp(motion.from.phi, motion.to.phi, ease);
    // Keep radius fixed: resetting the angle must never create a zoom pulse.
    this.controls.target.lerpVectors(motion.fromTarget, motion.view.target, ease);
    this.camera.position.setFromSpherical(motion.spherical).add(this.controls.target);
    if (progress === 1) this.camera.position.copy(this.getResetView().position);
    this.camera.lookAt(this.controls.target);
    this.controls.update(0);
    if (progress === 1) this.cancelResetTransition();
    return true;
  }

  resize() {
    if (!this.visible) return;
    const expanded = this.active?.config.expandViewport;
    const previousSurface = this.surface;
    const frame = this.canvas.parentElement;
    const stage = this.canvas.closest(".project-model-stage");
    if (expanded) {
      const anchor = frame.getBoundingClientRect();
      const pane = stage.getBoundingClientRect();
      this.surface = {
        width: pane.width, height: pane.height,
        anchorWidth: anchor.width, anchorHeight: anchor.height,
        x: anchor.left - pane.left, y: anchor.top - pane.top,
      };
      this.canvas.style.width = `${pane.width}px`;
      this.canvas.style.height = `${pane.height}px`;
      this.canvas.style.left = `${-this.surface.x}px`;
      this.canvas.style.top = `${-this.surface.y}px`;
    } else {
      this.surface = null;
      for (const property of ["width", "height", "left", "top"]) this.canvas.style.removeProperty(property);
    }
    const width = expanded ? this.surface.width : this.canvas.clientWidth;
    const height = expanded ? this.surface.height : this.canvas.clientHeight;
    if (width <= 1 || height <= 1) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    // The original square still defines body size and the orbit anchor. The
    // larger render surface reveals more around it without stretching it.
    const aspect = expanded ? this.surface.anchorWidth / this.surface.anchorHeight : width / height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const framingChanged = expanded && (!previousSurface ||
      ["width", "height", "anchorWidth", "anchorHeight", "x", "y"].some(key => Math.abs(previousSurface[key] - this.surface[key]) > 0.5));
    if (this.active && (Math.abs(this.aspect - aspect) > 0.001 || framingChanged)) {
      this.configureCamera(this.active, true);
    }
    this.aspect = aspect;
    this.requestRender();
  }

  getRenderCamera() {
    if (!this.surface || !this.active?.config.expandViewport) return this.camera;
    const { width, height, anchorWidth, anchorHeight, x, y } = this.surface;
    const camera = this.renderCamera.copy(this.camera);
    // Expand the view around the existing anchor without changing distance,
    // magnification or position as the visitor rotates the model.
    camera.setViewOffset(anchorWidth, anchorHeight, -x, -y, width, height);
    camera.updateMatrixWorld(true);
    return camera;
  }

  setVisible(visible) {
    this.visible = visible;
    this.controls.enabled = visible && !!this.active;
    if (!visible) this.pause();
    else {
      this.resize();
      this.requestRender();
    }
  }

  requestRender() {
    if (!this.animationFrame && this.visible && this.active && !document.hidden) {
      this.animationFrame = requestAnimationFrame(this.render);
    }
  }

  render(time) {
    if (!this.visible || !this.active || document.hidden) {
      this.pause();
      return;
    }
    const delta = this.previousTime ? Math.min(0.05, (time - this.previousTime) / 1000) : 0;
    this.previousTime = time;
    if (!this.reducedMotion && time >= this.holdUntil) this.active.mixer?.update(delta);
    // The reference keeps turning even while a visitor drags or resets. It
    // pauses with the render loop offscreen, rather than jumping on return.
    const spin = -Math.PI * 2 / 60 * this.autoOrbitSpeed * delta;
    this.autoOrbitPhase += spin;
    let moved = this.advanceResetTransition(delta);
    if (!moved) {
      moved = this.controls.update(delta);
      if (spin && !this.interacting) {
        this.camera.position.sub(this.controls.target).applyAxisAngle(this.spinAxis, spin).add(this.controls.target);
        this.camera.lookAt(this.controls.target);
        moved = true;
      }
    }
    const camera = this.getRenderCamera();
    if (this.active.effects) this.active.effects.render(this.scene, camera);
    else this.renderer.render(this.scene, camera);
    this.animationFrame = !this.reducedMotion || moved ? requestAnimationFrame(this.render) : 0;
  }

  pause() {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    this.previousTime = 0;
  }

  cancelSelection() {
    this.selection++;
    this.cancelResetTransition();
    this.interacting = false;
    this.pause();
    this.controls.enabled = false;
    if (this.active) this.scene.remove(this.active.root);
    this.active = null;
    this.canvas.style.visibility = "hidden";
    this.renderer.clear();
  }
}
