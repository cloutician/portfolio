const MAP_URLS = {
  magnify: "/assets/demos/worm-slider-lens-magnify.png?v=20260930-01",
  bezel: "/assets/demos/worm-slider-lens-bezel.png?v=20260930-01",
  specular: "/assets/demos/worm-slider-lens-specular.png?v=20260930-01",
};

const MAX_IMAGE_TEXTURES = 4;
const DESKTOP_TEXTURE_LIMIT = 2048;
const COMPACT_TEXTURE_LIMIT = 1536;

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 aPosition;
out vec2 vUv;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
}
`;

const COMPOSITE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uSource;
uniform vec4 uImageRect;
uniform float uOpacity;

in vec2 vUv;
out vec4 outputColor;

void main() {
  vec2 localUv = (vUv - uImageRect.xy) / uImageRect.zw;
  if (any(lessThan(localUv, vec2(0.0))) || any(greaterThan(localUv, vec2(1.0)))) {
    discard;
  }

  vec4 sourceColor = texture(uSource, localUv);
  outputColor = vec4(sourceColor.rgb, sourceColor.a * uOpacity);
}
`;

const OPTICS_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uComposite;
uniform sampler2D uMagnifyMap;
uniform sampler2D uBezelMap;
uniform sampler2D uSpecularMap;
uniform vec2 uResolution;
uniform vec2 uMapExtent;
uniform float uMagnification;
uniform float uRefraction;

in vec2 vUv;
out vec4 outputColor;

bool outsideUnitSquare(vec2 position) {
  return any(lessThan(position, vec2(0.0))) || any(greaterThan(position, vec2(1.0)));
}

vec4 sampleMap(sampler2D mapTexture, vec2 position) {
  vec2 mapUv = position * uResolution / uMapExtent;
  return outsideUnitSquare(mapUv) ? vec4(0.0) : texture(mapTexture, mapUv);
}

vec2 displacement(sampler2D mapTexture, vec2 position, float scale) {
  vec2 channels = sampleMap(mapTexture, position).rg - vec2(0.5);
  return channels * scale / uResolution;
}

vec3 saturateColor(vec3 color, float amount) {
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luminance), color, amount);
}

void main() {
  // The SVG filter's second displacement samples the output of its first one.
  // Working backwards from the output pixel therefore applies the bezel first,
  // then evaluates the magnifying map at that displaced coordinate.
  vec2 refractedPosition = vUv + displacement(uBezelMap, vUv, uRefraction);
  vec2 sourcePosition = refractedPosition
    + displacement(uMagnifyMap, refractedPosition, uMagnification);

  vec4 sourceColor = outsideUnitSquare(sourcePosition)
    ? vec4(0.0, 0.0, 0.0, 1.0)
    : texture(uComposite, vec2(sourcePosition.x, 1.0 - sourcePosition.y));
  vec4 specular = sampleMap(uSpecularMap, vUv);
  vec3 saturated = saturateColor(sourceColor.rgb, 9.0);
  vec3 refractedWithSaturation = mix(sourceColor.rgb, saturated, specular.a);
  vec3 highlighted = mix(refractedWithSaturation, specular.rgb, specular.a * 0.5);

  outputColor = vec4(highlighted, 1.0);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create a WebGL shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;

  const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error.";
  gl.deleteShader(shader);
  throw new Error(message);
}

function createProgram(gl, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Could not create a WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;

  const message = gl.getProgramInfoLog(program) || "Unknown shader link error.";
  gl.deleteProgram(program);
  throw new Error(message);
}

function configureTexture(gl, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function configurePixelStore(gl) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  if (typeof gl.UNPACK_COLORSPACE_CONVERSION_WEBGL === "number") {
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  }
}

function loadTextureImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load lens texture: ${url}`));
    image.src = url;
  });
}

function imageIsReady(image) {
  return image instanceof HTMLImageElement
    && image.complete
    && image.naturalWidth > 0
    && image.naturalHeight > 0;
}

function waitForImage(image) {
  if (imageIsReady(image)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const cleanUp = () => {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };
    const handleLoad = () => {
      cleanUp();
      if (imageIsReady(image)) resolve();
      else reject(new Error("A lens source image loaded without usable dimensions."));
    };
    const handleError = () => {
      cleanUp();
      reject(new Error("Could not load a lens source image."));
    };

    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleError, { once: true });
  });
}

function sourceKeyForImage(image) {
  return image.currentSrc || image.src || "";
}

function normalizedLayers(layers) {
  if (!Array.isArray(layers)) return [];

  return layers.filter((layer) => layer
    && layer.image instanceof HTMLImageElement
    && layer.rect
    && Number.isFinite(layer.rect.left)
    && Number.isFinite(layer.rect.top)
    && Number.isFinite(layer.rect.width)
    && Number.isFinite(layer.rect.height)
    && layer.rect.width > 0
    && layer.rect.height > 0
    && (Number.isFinite(layer.opacity) ? layer.opacity : 1) > 0);
}

function uniqueImagesForLayers(layers) {
  const images = new Map();
  layers.forEach(({ image }) => {
    const key = sourceKeyForImage(image);
    if (key && !images.has(key)) images.set(key, image);
  });
  return images;
}

function createUploadSource(image, limit) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const largestDimension = Math.max(sourceWidth, sourceHeight);
  if (largestDimension <= limit) return image;

  const scale = limit / largestDimension;
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
  const surface = document.createElement("canvas");
  surface.width = targetWidth;
  surface.height = targetHeight;

  const context = surface.getContext("2d", { alpha: false });
  if (!context) throw new Error("Could not create the lens texture downscaler.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return surface;
}

export function createWormLensWebGLRenderer(canvas, onAvailabilityChange = () => {}) {
  if (!(canvas instanceof HTMLCanvasElement)) return null;

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    desynchronized: true,
    failIfMajorPerformanceCaveat: true,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    stencil: false,
  });
  if (!gl) return null;

  let compositeProgram = null;
  let opticsProgram = null;
  let vertexArray = null;
  let vertexBuffer = null;
  let compositeFramebuffer = null;
  let compositeTexture = null;
  let compositeWidth = 0;
  let compositeHeight = 0;
  let magnifyTexture = null;
  let bezelTexture = null;
  let specularTexture = null;
  let compositeUniforms = null;
  let opticsUniforms = null;
  let ready = false;
  let initialisationPromise = null;
  let generation = 0;
  let useCounter = 0;
  let availability = null;
  const imageTextures = new Map();
  const pendingImages = new Map();

  function reportAvailability(available) {
    if (availability === available) return;
    availability = available;
    onAvailabilityChange(available);
  }

  function fail(error) {
    ready = false;
    reportAvailability(false);
    if (error) console.warn("WebGL lens unavailable; using the SVG lens fallback.", error);
  }

  function createTexture() {
    const texture = gl.createTexture();
    if (!texture) throw new Error("Could not create a WebGL texture.");
    configureTexture(gl, texture);
    return texture;
  }

  function uploadTexture(texture, source) {
    configurePixelStore(gl);
    configureTexture(gl, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  function clearImageCache(deleteTextures = true) {
    if (deleteTextures && !gl.isContextLost()) {
      imageTextures.forEach(({ texture }) => gl.deleteTexture(texture));
    }
    imageTextures.clear();
    pendingImages.clear();
  }

  function evictImageTextures(protectedKeys = new Set()) {
    while (imageTextures.size > MAX_IMAGE_TEXTURES) {
      let oldestKey = null;
      let oldestUse = Infinity;

      imageTextures.forEach((entry, key) => {
        if (!protectedKeys.has(key) && entry.lastUsed < oldestUse) {
          oldestKey = key;
          oldestUse = entry.lastUsed;
        }
      });

      if (!oldestKey) break;
      const entry = imageTextures.get(oldestKey);
      if (entry && !gl.isContextLost()) gl.deleteTexture(entry.texture);
      imageTextures.delete(oldestKey);
    }
  }

  async function ensureImageTexture(key, image, currentGeneration, protectedKeys) {
    const cached = imageTextures.get(key);
    if (cached) {
      cached.lastUsed = ++useCounter;
      return cached;
    }

    const pending = pendingImages.get(key);
    if (pending) return pending;

    const upload = (async () => {
      await waitForImage(image);
      if (currentGeneration !== generation || gl.isContextLost() || !ready) return null;

      const compact = typeof window.matchMedia === "function"
        && window.matchMedia("(max-width: 1024px)").matches;
      const uploadSource = createUploadSource(
        image,
        compact ? COMPACT_TEXTURE_LIMIT : DESKTOP_TEXTURE_LIMIT,
      );
      if (currentGeneration !== generation || gl.isContextLost() || !ready) return null;

      const texture = createTexture();
      uploadTexture(texture, uploadSource);
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        gl.deleteTexture(texture);
        throw new Error(`Could not upload a lens source texture (WebGL error ${error}).`);
      }

      const entry = { texture, lastUsed: ++useCounter };
      imageTextures.set(key, entry);
      evictImageTextures(protectedKeys);
      return entry;
    })();

    pendingImages.set(key, upload);
    try {
      return await upload;
    } finally {
      if (pendingImages.get(key) === upload) pendingImages.delete(key);
    }
  }

  async function initialise() {
    const currentGeneration = ++generation;
    ready = false;
    reportAvailability(false);
    clearImageCache(false);

    try {
      configurePixelStore(gl);
      compositeProgram = createProgram(gl, COMPOSITE_FRAGMENT_SHADER);
      opticsProgram = createProgram(gl, OPTICS_FRAGMENT_SHADER);

      vertexArray = gl.createVertexArray();
      vertexBuffer = gl.createBuffer();
      if (!vertexArray || !vertexBuffer) throw new Error("Could not create the lens geometry.");

      gl.bindVertexArray(vertexArray);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);

      compositeFramebuffer = gl.createFramebuffer();
      compositeTexture = createTexture();
      magnifyTexture = createTexture();
      bezelTexture = createTexture();
      specularTexture = createTexture();
      if (!compositeFramebuffer) throw new Error("Could not create the lens framebuffer.");

      compositeUniforms = {
        imageRect: gl.getUniformLocation(compositeProgram, "uImageRect"),
        opacity: gl.getUniformLocation(compositeProgram, "uOpacity"),
      };
      opticsUniforms = {
        resolution: gl.getUniformLocation(opticsProgram, "uResolution"),
        mapExtent: gl.getUniformLocation(opticsProgram, "uMapExtent"),
        magnification: gl.getUniformLocation(opticsProgram, "uMagnification"),
        refraction: gl.getUniformLocation(opticsProgram, "uRefraction"),
      };

      gl.useProgram(compositeProgram);
      gl.uniform1i(gl.getUniformLocation(compositeProgram, "uSource"), 0);
      gl.useProgram(opticsProgram);
      gl.uniform1i(gl.getUniformLocation(opticsProgram, "uComposite"), 0);
      gl.uniform1i(gl.getUniformLocation(opticsProgram, "uMagnifyMap"), 1);
      gl.uniform1i(gl.getUniformLocation(opticsProgram, "uBezelMap"), 2);
      gl.uniform1i(gl.getUniformLocation(opticsProgram, "uSpecularMap"), 3);

      const [magnifyImage, bezelImage, specularImage] = await Promise.all([
        loadTextureImage(MAP_URLS.magnify),
        loadTextureImage(MAP_URLS.bezel),
        loadTextureImage(MAP_URLS.specular),
      ]);
      if (currentGeneration !== generation || gl.isContextLost()) return false;

      gl.activeTexture(gl.TEXTURE1);
      uploadTexture(magnifyTexture, magnifyImage);
      gl.activeTexture(gl.TEXTURE2);
      uploadTexture(bezelTexture, bezelImage);
      gl.activeTexture(gl.TEXTURE3);
      uploadTexture(specularTexture, specularImage);
      gl.activeTexture(gl.TEXTURE0);

      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        throw new Error(`Could not initialise lens textures (WebGL error ${error}).`);
      }

      ready = true;
      reportAvailability(true);
      return true;
    } catch (error) {
      if (currentGeneration === generation) fail(error);
      return false;
    }
  }

  function startInitialisation() {
    initialisationPromise = initialise();
    return initialisationPromise;
  }

  function ensureCompositeTarget(width, height) {
    if (width === compositeWidth && height === compositeHeight) return true;

    compositeWidth = width;
    compositeHeight = height;
    gl.bindTexture(gl.TEXTURE_2D, compositeTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      compositeWidth,
      compositeHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, compositeFramebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      compositeTexture,
      0,
    );
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return complete;
  }

  async function prepare(layers) {
    if (!ready && initialisationPromise) await initialisationPromise;
    if (!ready || gl.isContextLost()) return false;

    const images = uniqueImagesForLayers(normalizedLayers(layers));
    if (!images.size) return false;
    if (images.size > MAX_IMAGE_TEXTURES) {
      console.warn(`WebGL lens supports at most ${MAX_IMAGE_TEXTURES} simultaneous image textures.`);
      return false;
    }

    const currentGeneration = generation;
    const protectedKeys = new Set(images.keys());
    try {
      const entries = await Promise.all(
        [...images].map(([key, image]) => ensureImageTexture(
          key,
          image,
          currentGeneration,
          protectedKeys,
        )),
      );
      if (currentGeneration !== generation || gl.isContextLost() || !ready) return false;
      if (entries.some((entry) => !entry)) return false;

      evictImageTextures(protectedKeys);
      return [...protectedKeys].every((key) => imageTextures.has(key));
    } catch (error) {
      if (currentGeneration === generation) fail(error);
      return false;
    }
  }

  function render(layers, sampleRect, opticalState = {}) {
    if (!ready || gl.isContextLost() || !sampleRect) return false;

    const renderLayers = normalizedLayers(layers);
    if (!renderLayers.length
      || !Number.isFinite(sampleRect.left)
      || !Number.isFinite(sampleRect.top)
      || !Number.isFinite(sampleRect.width)
      || !Number.isFinite(sampleRect.height)
      || sampleRect.width <= 0
      || sampleRect.height <= 0) return false;

    const pixelRatio = Number.isFinite(opticalState.pixelRatio)
      ? Math.max(0.5, opticalState.pixelRatio)
      : Math.max(0.5, window.devicePixelRatio || 1);
    const mapExtentCss = Number.isFinite(opticalState.mapExtentCss)
      ? Math.max(1, opticalState.mapExtentCss)
      : Math.max(sampleRect.width, sampleRect.height);
    const requestedPixelWidth = Math.max(1, Math.round(sampleRect.width * pixelRatio));
    const requestedPixelHeight = Math.max(1, Math.round(sampleRect.height * pixelRatio));
    const mapPixelExtent = Math.max(1, Math.ceil(mapExtentCss * pixelRatio));
    // Keep one maximum-size backing store while the CSS lens grows and shrinks.
    // Reallocating the canvas and FBO for every intermediate size can stall the
    // GPU during an otherwise smooth high-refresh hover/press transition.
    const pixelWidth = Math.max(canvas.width, requestedPixelWidth, mapPixelExtent);
    const pixelHeight = Math.max(canvas.height, requestedPixelHeight, mapPixelExtent);
    const renderPixelRatio = Math.max(
      0.5,
      Math.min(pixelWidth / sampleRect.width, pixelHeight / sampleRect.height),
    );

    try {
      const renderEntries = renderLayers.map((layer) => {
        const key = sourceKeyForImage(layer.image);
        const entry = imageTextures.get(key);
        if (entry) entry.lastUsed = ++useCounter;
        return { layer, entry };
      });
      if (renderEntries.some(({ entry }) => !entry)) return false;

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      if (!ensureCompositeTarget(pixelWidth, pixelHeight)) {
        throw new Error("The lens framebuffer is incomplete.");
      }

      gl.bindVertexArray(vertexArray);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.SCISSOR_TEST);

      // Pass one: rebuild only the tiny camera view behind the lens. Source
      // textures remain resident, so there is no per-frame CPU canvas upload.
      gl.bindFramebuffer(gl.FRAMEBUFFER, compositeFramebuffer);
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.clearColor(0.0078, 0.0118, 0.0118, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
      );
      gl.useProgram(compositeProgram);

      renderEntries.forEach(({ layer, entry }) => {
        const rect = layer.rect;
        const opacity = Math.max(0, Math.min(1, Number.isFinite(layer.opacity) ? layer.opacity : 1));
        const normalizedLeft = (rect.left - sampleRect.left) / sampleRect.width;
        const normalizedTop = (rect.top - sampleRect.top) / sampleRect.height;
        const normalizedWidth = rect.width / sampleRect.width;
        const normalizedHeight = rect.height / sampleRect.height;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, entry.texture);
        gl.uniform4f(
          compositeUniforms.imageRect,
          normalizedLeft,
          normalizedTop,
          normalizedWidth,
          normalizedHeight,
        );
        gl.uniform1f(compositeUniforms.opacity, opacity);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });

      // Pass two: apply the glass maps entirely on the GPU.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.disable(gl.BLEND);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(opticsProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, compositeTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, magnifyTexture);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, bezelTexture);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, specularTexture);
      gl.uniform2f(opticsUniforms.resolution, pixelWidth, pixelHeight);
      gl.uniform2f(
        opticsUniforms.mapExtent,
        mapExtentCss * renderPixelRatio,
        mapExtentCss * renderPixelRatio,
      );
      gl.uniform1f(
        opticsUniforms.magnification,
        (Number(opticalState.magnification) || 0) * renderPixelRatio,
      );
      gl.uniform1f(
        opticsUniforms.refraction,
        (Number(opticalState.refraction) || 0) * renderPixelRatio,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindVertexArray(null);
      gl.activeTexture(gl.TEXTURE0);
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  }

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    generation += 1;
    ready = false;
    initialisationPromise = null;
    clearImageCache(false);
    reportAvailability(false);
  });
  canvas.addEventListener("webglcontextrestored", () => {
    compositeWidth = 0;
    compositeHeight = 0;
    startInitialisation();
  });

  startInitialisation();
  return {
    get ready() {
      return ready;
    },
    prepare,
    render,
  };
}
