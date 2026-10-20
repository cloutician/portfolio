import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const digest = (data) => createHash("sha256").update(data).digest("hex").slice(0, 16);

export function streamlineBuild() {
  let publicDirectory;
  return {
    name: "portfolio-streamline-revisions",
    apply: "build",
    configResolved(config) { publicDirectory = config.publicDir; },
    generateBundle: { order: "post", handler(_options, bundle) {
      // Cloudflare builds a server and a client; only the client owns assets.
      if (!bundle["index.html"]) return;
      const revisions = {};
      const walk = (directory) => {
        for (const item of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
          const absolute = path.join(directory, item.name);
          if (item.isDirectory()) walk(absolute);
          else {
            const relative = path.relative(publicDirectory, absolute).split(path.sep).join("/");
            if (relative === "streamline-sw.js") continue;
            revisions[`/${relative}`] = digest(readFileSync(absolute));
          }
        }
      };
      walk(publicDirectory);
      for (const [filename, file] of Object.entries(bundle)) {
        if (filename === "index.html") continue;
        revisions[`/${filename}`] = digest(file.type === "chunk" ? file.code : file.source);
      }
      const revision = digest(JSON.stringify(revisions) + bundle["index.html"].source);
      const template = readFileSync(path.join(publicDirectory, "streamline-sw.js"), "utf8");
      const source = template
        .replace('"__STREAMLINE_REVISION__"', JSON.stringify(revision))
        .replace("/* __STREAMLINE_ASSETS__ */ {}", JSON.stringify(revisions));
      this.emitFile({ type: "asset", fileName: "streamline-sw.js", source });
    } },
  };
}
