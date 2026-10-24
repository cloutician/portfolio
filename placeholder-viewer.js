import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// One canvas/renderer, independent cached models and mixers. Selection is the only
// operation allowed to mount a loaded model, so late loads cannot replace it.
export class PlaceholderModelViewer {
  constructor(canvas, { reducedMotion = false, onInteract = () => {} } = {}) {
    this.canvas = canvas;
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
    this.scene.add(hemisphere, key, rim);
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
    this.resizeObserver.observe(canvas.closest(".project-placeholder-stage"));
  }

  async load(config) {
    if (!this.records.has(config.key)) {
      const promise = new GLTFLoader().loadAsync(config.url).then((gltf) => {
        const model = gltf.scene;
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
          for (const time of times) {
            mixer.setTime(time);
            model.updateMatrixWorld(true);
            bounds.union(new THREE.Box3().setFromObject(model));
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
          model.updateMatrixWorld(true);
          bounds.setFromObject(model);
        }
        const root = new THREE.Group();
        root.name = `placeholder-${config.key}`;
        root.add(model);
        const anchor = config.orbitAnchor && model.getObjectByName(config.orbitAnchor);
        if (config.orbitAnchor && !anchor) throw new Error(`Missing ${config.orbitAnchor} orbit anchor in ${config.key}.`);
        // Exhaust is useful for fitting the view, but must not move the orbit
        // pivot away from the solid body as the engine ignites and shuts down.
        const centre = (anchor ? new THREE.Box3().setFromObject(anchor) : bounds).getCenter(new THREE.Vector3());
        root.position.copy(centre).negate();
        root.updateMatrixWorld(true);
        const size = bounds.getSize(new THREE.Vector3());
        return {
          config, root, model, mixer, action, clip, bounds,
          extent: Math.max(size.x, size.y, size.z, 0.1),
          radius: Math.max(size.length() / 2, 0.05),
          defaultView: null,
        };
      }).catch((error) => {
        this.records.delete(config.key);
        throw error;
      });
      this.records.set(config.key, promise);
    }
    return this.records.get(config.key);
  }

  async select(config) {
    this.cancelSelection();
    const selection = this.selection;
    const record = await this.load(config);
    if (selection !== this.selection) return null;
    this.active = record;
    this.scene.add(record.root);
    this.canvas.closest(".project-placeholder-stage").classList.toggle("has-expanded-model", !!config.expandViewport);
    // The drawing area can grow without making the whole pane swallow touch
    // scrolling. Keep the original model-sized drag surface and sensitivity.
    const input = config.expandViewport ? this.canvas.parentElement : this.canvas;
    if (this.controls.domElement !== input) {
      this.controls.disconnect();
      this.controls.connect(input);
    }
    this.renderer.toneMappingExposure = config.exposure ?? 1;
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

  configureCamera(record, preserveView = false) {
    this.cancelResetTransition();
    const { camera, controls } = this;
    const oldDefault = record.defaultView;
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.fov = record.config.fitAnimation ? 32 : 30;
    camera.near = record.extent / 100;
    camera.far = record.extent * 20;
    camera.zoom = record.config.fitAnimation ? 1 : (record.config.defaultZoom ?? 1);
    controls.target.set(0, 0, 0);
    if (record.config.fitAnimation) {
      const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
      const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
      const projection = Math.sin(Math.min(vertical, horizontal));
      const fit = record.radius / projection * 1.04;
      const distance = fit * 1.12 / (record.config.defaultZoom ?? 1);
      camera.position.fromArray(record.config.cameraDirection).normalize().multiplyScalar(distance);
    } else {
      // Keep the agreed cat angle; apply its configured fixed magnification
      // optically without changing the orbit distance.
      const initial = new THREE.Spherical().setFromVector3(
        new THREE.Vector3(record.extent * 0.72, record.extent * 0.4, record.extent * 1.95),
      );
      initial.radius *= 0.68;
      initial.theta += THREE.MathUtils.degToRad(-42);
      initial.phi += THREE.MathUtils.degToRad(7);
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
    // Camera reset does not touch the mixer or restart the thrust/cat loop.
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
    const frame = this.canvas.parentElement;
    const stage = this.canvas.closest(".project-placeholder-stage");
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
    if (this.active && Math.abs(this.aspect - aspect) > 0.001) {
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
    this.renderer.render(this.scene, this.getRenderCamera());
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
