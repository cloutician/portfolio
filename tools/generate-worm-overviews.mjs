import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const projectRoot = path.resolve(import.meta.dirname, "..");
const demosDir = path.join(projectRoot, "public", "assets", "demos");
const sourceDir = path.join(projectRoot, "source-assets", "worm-profiler");

const images = [
  { source: "worm-profiler-hd.jpg", output: "worm-profiler" },
  { source: "worm-9539.jpg", output: "worm-9539" },
  { source: "worm-0175.jpg", output: "worm-0175" },
  { source: "worm-0191.jpg", output: "worm-0191" },
  { source: "worm-2852.jpg", output: "worm-2852" },
  { source: "worm-1201.jpg", output: "worm-1201" },
];

const variants = [
  { width: 1920, suffix: "stage", quality: 96 },
  { width: 3200, suffix: "stage-3200", quality: 98 },
];

for (const image of images) {
  const sourcePath = path.join(sourceDir, image.source);
  await fs.access(sourcePath);

  for (const variant of variants) {
    const outputPath = path.join(demosDir, `${image.output}-${variant.suffix}.webp`);
    await sharp(sourcePath)
      .resize({
        width: variant.width,
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .webp({
        quality: variant.quality,
        effort: 6,
        smartSubsample: true,
      })
      .toFile(outputPath);
  }
}

console.log(`Generated ${images.length * variants.length} responsive Worm Profiler images.`);
