import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const vertexShader = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

function patchRedPanels(model) {
  const materials = new Set();
  for (const name of ["Red_F_Left", "Red_F_Right"]) {
    const panel = model.getObjectByName(name);
    if (!panel?.isMesh) throw new Error(`Missing player glow panel: ${name}`);
    for (const material of Array.isArray(panel.material) ? panel.material : [panel.material]) materials.add(material);
  }
  for (const material of materials) {
    const originalCompile = material.onBeforeCompile;
    const originalCacheKey = material.customProgramCacheKey();
    material.onBeforeCompile = function (shader, renderer) {
      originalCompile.call(this, shader, renderer);
      shader.uniforms.uPanelRedColour = { value: new THREE.Color(0xff101b) };
      shader.fragmentShader = "uniform vec3 uPanelRedColour;\n" + shader.fragmentShader.replace(
        "#include <tonemapping_fragment>", `
          #include <tonemapping_fragment>
          float panelBrightness = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);
          gl_FragColor.rgb = uPanelRedColour * (.5 + .5 * panelBrightness);
        `,
      );
    };
    material.customProgramCacheKey = () => `${originalCacheKey}:portfolio-panel-red-chroma-v1`;
    material.needsUpdate = true;
  }
  // The export already contains .35 * .8 red emission. Do not multiply it again.
  return materials;
}

class PlayerPanelHalo {
  constructor(renderer, record, { strength = 0.085, redScale = 0.8 } = {}) {
    this.renderer = renderer;
    this.record = record;
    this.redMaterials = patchRedPanels(record.model);
    this.maskScene = new THREE.Scene();
    this.black = new THREE.MeshBasicMaterial({ color: 0, side: THREE.DoubleSide, toneMapped: false });
    this.neon = new THREE.MeshBasicMaterial({ color: 0xff101b, side: THREE.DoubleSide, toneMapped: false });
    this.surfaces = [];
    record.model.traverse(source => {
      // Transparent exhaust and even opaque animated embers must never become
      // black depth occluders in the panel-only mask.
      if (!source.isMesh || /^(?:Exhaust_(?:Orange_Glow|White_Core)$|Ember_)/.test(source.name)) return;
      const sources = Array.isArray(source.material) ? source.material : [source.material];
      if (sources.every(material => material.transparent)) return;
      const materials = sources.map(material => this.redMaterials.has(material) ? this.neon : this.black);
      const mask = new THREE.Mesh(source.geometry, Array.isArray(source.material) ? materials : materials[0]);
      mask.matrixAutoUpdate = false;
      mask.renderOrder = source.renderOrder;
      this.maskScene.add(mask);
      this.surfaces.push({ source, mask });
    });
    this.maskTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    this.horizontalTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
    this.haloTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
    this.blurMaterial = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, toneMapped: false, vertexShader,
      uniforms: { image: { value: null }, step: { value: new THREE.Vector2() } },
      fragmentShader: `
        uniform sampler2D image;
        uniform vec2 step;
        varying vec2 vUv;
        void main() {
          vec3 light = texture2D(image, vUv).rgb * .227027;
          light += texture2D(image, vUv + step * 1.384615).rgb * .316216;
          light += texture2D(image, vUv - step * 1.384615).rgb * .316216;
          light += texture2D(image, vUv + step * 3.230769).rgb * .070270;
          light += texture2D(image, vUv - step * 3.230769).rgb * .070270;
          gl_FragColor = vec4(light, 1.0);
        }
      `,
    });
    this.haloMaterial = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, toneMapped: false, vertexShader,
      transparent: true, premultipliedAlpha: true, blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { image: { value: this.haloTarget.texture }, strength: { value: strength }, redScale: { value: redScale } },
      fragmentShader: `
        uniform sampler2D image;
        uniform float strength;
        uniform float redScale;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(texture2D(image, vUv).rgb, 0.0);
          #include <colorspace_fragment>
          gl_FragColor.rgb *= strength * redScale;
          // Add premultiplied radiance and its coverage, never a full-screen
          // alpha of 1. Zero-energy pixels leave the CSS background untouched.
          gl_FragColor.a = max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b));
        }
      `,
    });
    this.blur = new FullScreenQuad(this.blurMaterial);
    this.halo = new FullScreenQuad(this.haloMaterial);
    this.size = new THREE.Vector2();
    this.clearColor = new THREE.Color();
  }

  render(scene, camera) {
    const renderer = this.renderer;
    renderer.render(scene, camera); // Normal materials: ACES/output conversion once.
    renderer.getDrawingBufferSize(this.size);
    const width = Math.max(1, Math.ceil(this.size.x / 2));
    const height = Math.max(1, Math.ceil(this.size.y / 2));
    if (this.maskTarget.width !== width || this.maskTarget.height !== height) {
      for (const target of [this.maskTarget, this.horizontalTarget, this.haloTarget]) target.setSize(width, height);
    }
    this.record.root.updateWorldMatrix(true, true);
    for (const { source, mask } of this.surfaces) {
      mask.matrix.copy(source.matrixWorld);
      mask.matrixWorldNeedsUpdate = true;
      mask.visible = true;
      for (let parent = source; parent; parent = parent.parent) {
        if (!parent.visible) { mask.visible = false; break; }
      }
    }
    const target = renderer.getRenderTarget(), autoClear = renderer.autoClear;
    renderer.getClearColor(this.clearColor);
    const clearAlpha = renderer.getClearAlpha();
    try {
      renderer.autoClear = true;
      renderer.setClearColor(0, 0);
      renderer.setRenderTarget(this.maskTarget);
      renderer.render(this.maskScene, camera);
      this.blurMaterial.uniforms.image.value = this.maskTarget.texture;
      this.blurMaterial.uniforms.step.value.set(1.25 / width, 0);
      renderer.setRenderTarget(this.horizontalTarget); this.blur.render(renderer);
      this.blurMaterial.uniforms.image.value = this.horizontalTarget.texture;
      this.blurMaterial.uniforms.step.value.set(0, 1.25 / height);
      renderer.setRenderTarget(this.haloTarget); this.blur.render(renderer);
      renderer.setRenderTarget(target);
      renderer.autoClear = false;
      this.halo.render(renderer);
    } finally {
      renderer.setClearColor(this.clearColor, clearAlpha);
      renderer.autoClear = autoClear;
      renderer.setRenderTarget(target);
    }
  }

  dispose() {
    for (const target of [this.maskTarget, this.horizontalTarget, this.haloTarget]) target.dispose();
    for (const material of [this.black, this.neon, this.blurMaterial, this.haloMaterial]) material.dispose();
    this.blur.dispose(); this.halo.dispose();
  }
}

class EnemyTrimBloom {
  constructor(renderer, { strength = 0.055, radius = 0, threshold = 0.9 } = {}) {
    this.renderer = renderer;
    this.baseTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: Math.min(4, renderer.capabilities.maxSamples),
    });
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), strength, radius, threshold);
    this.bloom.renderToScreen = false;
    // Use Three's unmodified extraction/mip kernels and the reference values,
    // but do not let its final additive copy overwrite the scene's alpha.
    // Our transparency-aware output pass composites the computed bloom texture.
    this.bloom.blendMaterial.colorWrite = false;
    this.outputMaterial = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, blending: THREE.NoBlending, toneMapped: true, vertexShader,
      uniforms: { base: { value: this.baseTarget.texture }, glow: { value: this.bloom.renderTargetsHorizontal[0].texture } },
      fragmentShader: `
        uniform sampler2D base;
        uniform sampler2D glow;
        varying vec2 vUv;
        void main() {
          vec4 surface = texture2D(base, vUv);
          vec3 light = max(texture2D(glow, vUv).rgb, vec3(0.0));
          float glowAlpha = clamp(max(light.r, max(light.g, light.b)), 0.0, 1.0);
          float alpha = surface.a + glowAlpha * (1.0 - surface.a);
          // The scene target contains premultiplied linear light. Perform the
          // display transform on straight colour, then premultiply exactly once
          // for the transparent browser canvas (including soft exhaust tails).
          gl_FragColor = vec4((surface.rgb + light) / max(alpha, .00001), alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb *= alpha;
        }
      `,
    });
    this.output = new FullScreenQuad(this.outputMaterial);
    this.size = new THREE.Vector2();
    this.clearColor = new THREE.Color();
  }

  render(scene, camera) {
    const renderer = this.renderer;
    renderer.getDrawingBufferSize(this.size);
    const width = Math.max(1, this.size.x), height = Math.max(1, this.size.y);
    if (this.baseTarget.width !== width || this.baseTarget.height !== height) {
      this.baseTarget.setSize(width, height);
      this.bloom.setSize(width, height);
    }
    const target = renderer.getRenderTarget(), autoClear = renderer.autoClear;
    renderer.getClearColor(this.clearColor);
    const clearAlpha = renderer.getClearAlpha();
    try {
      renderer.autoClear = true;
      renderer.setClearColor(0, 0);
      renderer.setRenderTarget(this.baseTarget);
      renderer.render(scene, camera); // Linear HDR; Three defers tone mapping offscreen.
      this.bloom.render(renderer, null, this.baseTarget, 0, false);
      renderer.setRenderTarget(target);
      this.output.render(renderer); // The only ACES/sRGB conversion in this path.
    } finally {
      renderer.setClearColor(this.clearColor, clearAlpha);
      renderer.autoClear = autoClear;
      renderer.setRenderTarget(target);
    }
  }

  dispose() {
    this.baseTarget.dispose(); this.bloom.dispose();
    this.outputMaterial.dispose(); this.output.dispose();
  }
}

export function createRocketEffects(renderer, record) {
  const options = record.config.effects;
  if (options?.type === "player-panels") return new PlayerPanelHalo(renderer, record, options);
  if (options?.type === "enemy-trim") return new EnemyTrimBloom(renderer, options);
  return null;
}
