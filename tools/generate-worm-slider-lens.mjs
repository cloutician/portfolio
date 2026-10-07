import sharp from "sharp";
import { fileURLToPath } from "node:url";

// Circular adaptation of kube.io's published Liquid Glass map maths:
// https://github.com/kube/kube.io/tree/main/app/data/articles/2025_10_04_liquid_glass_css_svg
// The shipped slider remains 100% local; this script only regenerates its three
// tiny build-time PNG maps and is never included in the browser bundle.

const MAP_SIZE = 150;
const DPR = 2;
const RADIUS = MAP_SIZE / 2;
const BEZEL_WIDTH = 25;
const GLASS_THICKNESS = 110;
const REFRACTIVE_INDEX = 1.5;
const PROFILE_BEZEL_WIDTH = 25;
const MAP_NORMALIZATION = 100;
const SPECULAR_ANGLE = Math.PI / 3;

const output = (name) =>
  fileURLToPath(new URL(`../public/assets/demos/${name}`, import.meta.url));

function convexSquircle(x) {
  return Math.pow(1 - Math.pow(1 - x, 4), 1 / 4);
}

function calculateDisplacementProfile(
  glassThickness = 200,
  bezelWidth = 50,
  refractiveIndex = 1.5,
  samples = 128,
) {
  const eta = 1 / refractiveIndex;

  function refract(normalX, normalY) {
    const dot = normalY;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null;
    const kSqrt = Math.sqrt(k);
    return [
      -(eta * dot + kSqrt) * normalX,
      eta - (eta * dot + kSqrt) * normalY,
    ];
  }

  return Array.from({ length: samples }, (_, index) => {
    const x = index / samples;
    const y = convexSquircle(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const derivative = (convexSquircle(x + dx) - y) / dx;
    const magnitude = Math.sqrt(derivative * derivative + 1);
    const normal = [-derivative / magnitude, -1 / magnitude];
    const refracted = refract(normal[0], normal[1]);
    if (!refracted) return 0;

    const remainingHeight = y * bezelWidth + glassThickness;
    return refracted[0] * (remainingHeight / refracted[1]);
  });
}

function createRgbaImage(width, height, fill = [0, 0, 0, 0]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = fill[0];
    data[index + 1] = fill[1];
    data[index + 2] = fill[2];
    data[index + 3] = fill[3];
  }
  return data;
}

function calculateMagnifyingMap(size, dpr) {
  const width = Math.round(size * dpr);
  const height = Math.round(size * dpr);
  const data = createRgbaImage(width, height);
  const ratio = Math.max(width / 2, height / 2);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const relativeX = (x - width / 2) / ratio;
      const relativeY = (y - height / 2) / ratio;
      data[index] = 128 - relativeX * 127;
      data[index + 1] = 128 - relativeY * 127;
      data[index + 2] = 0;
      data[index + 3] = 255;
    }
  }

  return { data, width, height };
}

function calculateBezelMap(size, radius, bezelWidth, profile, dpr) {
  const width = Math.round(size * dpr);
  const height = Math.round(size * dpr);
  const data = createRgbaImage(width, height, [128, 128, 0, 255]);
  const scaledRadius = radius * dpr;
  const scaledBezel = bezelWidth * dpr;
  const radiusSquared = scaledRadius ** 2;
  const radiusPlusOneSquared = (scaledRadius + 1) ** 2;
  const radiusMinusBezelSquared = (scaledRadius - scaledBezel) ** 2;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const relativeX = x - scaledRadius;
      const relativeY = y - scaledRadius;
      const distanceSquared = relativeX ** 2 + relativeY ** 2;
      const inBezel =
        distanceSquared <= radiusPlusOneSquared &&
        distanceSquared >= radiusMinusBezelSquared;
      if (!inBezel) continue;

      const distance = Math.sqrt(distanceSquared);
      if (distance === 0) continue;
      const opacity =
        distanceSquared < radiusSquared
          ? 1
          : 1 -
            (distance - Math.sqrt(radiusSquared)) /
              (Math.sqrt(radiusPlusOneSquared) - Math.sqrt(radiusSquared));
      const distanceFromSide = scaledRadius - distance;
      const profileIndex = Math.floor(
        (distanceFromSide / scaledBezel) * profile.length,
      );
      const displacement = profile[profileIndex] ?? 0;
      const dx = (-(relativeX / distance) * displacement) / MAP_NORMALIZATION;
      const dy = (-(relativeY / distance) * displacement) / MAP_NORMALIZATION;
      const index = (y * width + x) * 4;

      data[index] = 128 + dx * 127 * opacity;
      data[index + 1] = 128 + dy * 127 * opacity;
      data[index + 2] = 0;
      data[index + 3] = 255;
    }
  }

  return { data, width, height };
}

function calculateSpecularMap(size, radius, bezelWidth, dpr) {
  const width = Math.round(size * dpr);
  const height = Math.round(size * dpr);
  const data = createRgbaImage(width, height);
  const scaledRadius = radius * dpr;
  const scaledBezel = bezelWidth * dpr;
  const radiusSquared = scaledRadius ** 2;
  const radiusPlusOneSquared = (scaledRadius + dpr) ** 2;
  const radiusMinusBezelSquared = (scaledRadius - scaledBezel) ** 2;
  const specularVector = [
    Math.cos(SPECULAR_ANGLE),
    Math.sin(SPECULAR_ANGLE),
  ];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const relativeX = x - scaledRadius;
      const relativeY = y - scaledRadius;
      const distanceSquared = relativeX ** 2 + relativeY ** 2;
      const inBezel =
        distanceSquared <= radiusPlusOneSquared &&
        distanceSquared >= radiusMinusBezelSquared;
      if (!inBezel) continue;

      const distance = Math.sqrt(distanceSquared);
      if (distance === 0) continue;
      const distanceFromSide = scaledRadius - distance;
      const opacity =
        distanceSquared < radiusSquared
          ? 1
          : 1 -
            (distance - Math.sqrt(radiusSquared)) /
              (Math.sqrt(radiusPlusOneSquared) - Math.sqrt(radiusSquared));
      const cos = relativeX / distance;
      const sin = -relativeY / distance;
      const dotProduct = Math.abs(
        cos * specularVector[0] + sin * specularVector[1],
      );
      const curve = 1 - (1 - distanceFromSide / dpr) ** 2;
      const coefficient = curve > 0 ? dotProduct * Math.sqrt(curve) : 0;
      const color = 255 * coefficient;
      const index = (y * width + x) * 4;

      data[index] = color;
      data[index + 1] = color;
      data[index + 2] = color;
      data[index + 3] = color * coefficient * opacity;
    }
  }

  return { data, width, height };
}

async function savePng(image, name) {
  await sharp(Buffer.from(image.data.buffer), {
    raw: {
      width: image.width,
      height: image.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output(name));
}

const profile = calculateDisplacementProfile(
  GLASS_THICKNESS,
  PROFILE_BEZEL_WIDTH,
  REFRACTIVE_INDEX,
);
const maximumDisplacement = Math.max(...profile.map(Math.abs));

await Promise.all([
  savePng(
    calculateMagnifyingMap(MAP_SIZE, DPR),
    "worm-slider-lens-magnify.png",
  ),
  savePng(
    calculateBezelMap(MAP_SIZE, RADIUS, BEZEL_WIDTH, profile, DPR),
    "worm-slider-lens-bezel.png",
  ),
  savePng(
    calculateSpecularMap(MAP_SIZE, RADIUS, BEZEL_WIDTH, DPR),
    "worm-slider-lens-specular.png",
  ),
]);

console.log(
  `Generated ${MAP_SIZE * DPR}x${MAP_SIZE * DPR} lens maps; maximum displacement ${maximumDisplacement}.`,
);
