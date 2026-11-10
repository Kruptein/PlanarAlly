import { unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Plugin, PluginOption, UserConfig } from "vite";

const HOST_VUE_PATH = "/@planarally/host-vue.js";

// The mod has to use the same Vue instance as the host, a second copy cannot update components the host mounted.
// Vite rewrites bare imports in dev, so `vue` is pointed at a module on this dev server that re-exports
// the bare `vue` specifier, which the browser then resolves through the host page's import map.
function hostVue(origin: string): Plugin {
  return {
    name: "host-vue",
    apply: "serve",
    enforce: "pre",
    resolveId(id) {
      if (id === "vue") return { id: `${origin}${HOST_VUE_PATH}`, external: true };
    },
    configureServer(server) {
      server.middlewares.use(HOST_VUE_PATH, (_req, res) => {
        res.setHeader("Content-Type", "text/javascript");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end('export * from "vue";\n');
      });
    },
  };
}

function advertiseDevServer(root: string, origin: string): Plugin {
  const file = resolve(root, "vite-dev.json");
  const write = (): void => {
    writeFileSync(file, `${JSON.stringify({ origin, entry: "/src/main.ts" })}\n`);
  };
  const remove = (): void => {
    try {
      unlinkSync(file);
    } catch {
      // The file is only removed once.
    }
  };
  return {
    name: "advertise-dev-server",
    apply: "serve",
    configureServer(server) {
      const http = server.httpServer;
      if (http === null) return;
      http.once("listening", write);
      http.once("close", remove);
    },
  };
}

export function modOptions(
  command: "build" | "serve",
  options: {
    name: string;
    port: number;
    root: string;
    minify?: boolean;
    vue: (options: { features: { componentIdGenerator: "filepath" } }) => PluginOption;
  },
): UserConfig {
  const origin = `http://127.0.0.1:${options.port}`;
  return {
    root: options.root,
    plugins: [
      hostVue(origin),
      options.vue({
        features: { componentIdGenerator: "filepath" },
      }),
      advertiseDevServer(options.root, origin),
    ],
    define: {
      "process.env": {},
    },
    // Library output is loaded from /static/mods-dev and from the zipped mod, so asset
    // URLs stay relative. The dev server is a different origin and needs absolute URLs.
    base: command === "serve" ? "/" : "./",
    server: {
      host: "127.0.0.1",
      port: options.port,
      strictPort: true,
      origin,
      cors: true,
      hmr: {
        protocol: "ws",
        host: "127.0.0.1",
        port: options.port,
        clientPort: options.port,
      },
      fs: {
        allow: [resolve(options.root, "../..")],
      },
    },
    optimizeDeps: {
      exclude: ["vue"],
    },
    build: {
      minify: options.minify ?? false,
      lib: {
        entry: resolve(options.root, "src/main.ts"),
        name: options.name,
        fileName: "index",
        formats: ["es"],
      },
      rolldownOptions: {
        external: ["vue"],
        output: {
          globals: { vue: "Vue" },
          assetFileNames: "[name].[ext]",
        },
      },
    },
  };
}
