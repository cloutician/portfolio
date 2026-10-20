import { cloudflare } from "@cloudflare/vite-plugin";
import { sites } from "@openai/sites-vite-plugin";
import { defineConfig } from "vite";
import { streamlineBuild } from "./tools/streamline-build.mjs";

export default defineConfig({
  plugins: [sites(), cloudflare({ viteEnvironment: { name: "server" } }), streamlineBuild()],
  server: {
    headers: {
      "Cache-Control": "no-store",
    },
  },
});
