import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Vendor small SVGs locally so the toolkit needs no runtime icon service.
const root = new URL("../", import.meta.url);
const destination = new URL("public/assets/toolkit/", root);
const profileBadges = new URL("docs/github-profile/assets/badges/", root);
await mkdir(destination, { recursive: true });

async function getText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to download ${url}: ${response.status}`);
  return response.text();
}

const deviconCommit = JSON.parse(await getText("https://api.github.com/repos/devicons/devicon/commits/master")).sha;
const devicons = {
  cplusplus: "cplusplus", python: "python", kotlin: "kotlin",
  typescript: "typescript", javascript: "javascript", pytorch: "pytorch",
  tensorflow: "tensorflow", qt: "qt", android: "android",
  "jetpack-compose": "jetpackcompose", react: "react", nodejs: "nodejs",
  numpy: "numpy", pandas: "pandas", matplotlib: "matplotlib",
  jupyter: "jupyter", docker: "docker", linux: "linux",
  postgresql: "postgresql", spark: "apachespark", git: "git",
  cmake: "cmake", "android-studio": "androidstudio",
};

const tasks = Object.entries(devicons).map(([name, source]) => async () => {
  const variant = source === "linux" ? "plain" : "original";
  const url = `https://raw.githubusercontent.com/devicons/devicon/${deviconCommit}/icons/${source}/${source}-${variant}.svg`;
  const svg = await getText(url);
  if (!svg.includes("<svg")) throw new Error(`Invalid SVG: ${name}`);
  await writeFile(new URL(`${name}.svg`, destination), svg);
});
for (let offset = 0; offset < tasks.length; offset += 6) {
  await Promise.all(tasks.slice(offset, offset + 6).map((task) => task()));
}

const reused = ["java", "sql", "aws", "google-cloud", "scikit-learn", "opencv", "codex", "cursor", "claude"];
for (const name of reused) {
  const badge = await readFile(new URL(`${name}.svg`, profileBadges), "utf8");
  const nested = badge.match(/<svg\b(?=[^>]*\bx=)[^>]*>[\s\S]*?<\/svg>/)?.[0];
  if (!nested) throw new Error(`Missing icon inside the ${name} badge`);
  let icon = nested.replace(/\s(?:x|y|width|height)="[^"]*"/g, "");
  icon = icon.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  icon = icon.replaceAll("#FFFFFF", "#0a0a0a");
  if (name === "sql") icon = icon.replaceAll("#79B8FF", "#246394");
  if (name === "aws") icon = icon.replace('viewBox="0 25 128 65"', 'viewBox="-2 22 132 84"');
  await writeFile(new URL(`${name}.svg`, destination), icon + "\n");
}

for (const [name, source, colour] of [["cuda", "nvidia", "76B900"], ["onnx", "onnx", "005CED"]]) {
  let svg = await getText(`https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${source}.svg`);
  svg = svg.replace("<svg ", `<svg fill="#${colour}" `);
  await writeFile(new URL(`${name}.svg`, destination), svg);
}

for (const licence of ["LICENSE.devicon.txt", "LICENSE.lobe-icons.txt", "LICENSE.simple-icons.txt"]) {
  await copyFile(new URL(licence, profileBadges), new URL(licence, destination));
}

await writeFile(new URL("SOURCES.md", destination), `# Toolkit icon sources

Devicon icons: https://github.com/devicons/devicon/tree/${deviconCommit}/icons
Devicon is MIT-licensed. The original geometry and colours are retained, with the lightweight monochrome Linux variant.

Java, AWS, Google Cloud, OpenCV and scikit-learn reuse the Devicon artwork already stored in the GitHub profile badges. AWS lettering is dark for this light surface.

Codex reuses the Lobe Icons artwork already stored in the GitHub profile badges (MIT). Cursor and Claude reuse Simple Icons artwork (CC0). NVIDIA (CUDA) and ONNX also use Simple Icons (CC0).

SQL uses the existing generic database symbol from the GitHub profile. It is not a product mark.

Fiji, CellProfiler and ilastik use the logo files supplied by George. CellProfiler's icon is shown from the left of its supplied wordmark using CSS; the source image is unchanged. AWS has an expanded SVG viewport to keep its smile fully visible.

Names and marks belong to their respective owners and identify the listed tools. The corresponding licence texts are included here.
`);

console.log(`Prepared ${Object.keys(devicons).length + reused.length + 2} local toolkit icons in ${fileURLToPath(destination)}`);
