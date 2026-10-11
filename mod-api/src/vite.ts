import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface DevPlugin {
  name: string;
  apply?: "serve";
  enforce?: "pre";
  resolveId?: (id: string) => { id: string; external: true } | undefined;
  configureServer?: (server: {
    httpServer: { once(event: string, listener: () => void): void } | null;
  }) => void;
}

function packageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 4; i++) {
    try {
      const parsed = JSON.parse(readFileSync(resolve(dir, "package.json"), "utf8")) as { name?: unknown };
      if (parsed.name === "@planarally/mod-api") return dir;
    } catch {
      // Keep walking until the package root.
    }
    dir = resolve(dir, "..");
  }
  return dirname(fileURLToPath(import.meta.url));
}

function httpUrl(value: string | undefined): string | undefined {
  if (value !== undefined && /^https?:\/\//.test(value)) return value;
  return undefined;
}

function readEnvUrl(file: string): string | undefined {
  try {
    const match = /^VITE_VUE_URL=(?:"([^"]+)"|'([^']+)'|([^\s#]+))/m.exec(readFileSync(file, "utf8"));
    return httpUrl(match?.[1] ?? match?.[2] ?? match?.[3]);
  } catch {
    return undefined;
  }
}

function readShippedUrl(file: string): string | undefined {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { url?: unknown };
    return typeof parsed.url === "string" ? httpUrl(parsed.url) : undefined;
  } catch {
    return undefined;
  }
}

// The dev client loads this module through its import map. A second copy of Vue
// cannot update components the host already mounted.
function hostVueUrl(): string {
  const fromEnv = httpUrl(process.env.VITE_VUE_URL);
  if (fromEnv !== undefined) return fromEnv;
  const root = packageRoot();
  const live = readEnvUrl(resolve(root, "../client/.env.development"));
  if (live !== undefined) return live;
  const shipped = readShippedUrl(resolve(root, "vue-dev.json"));
  if (shipped !== undefined) return shipped;
  throw new Error(
    "Could not find the PlanarAlly dev Vue URL. Set VITE_VUE_URL, or use a @planarally/mod-api build that includes vue-dev.json.",
  );
}

function externalizeVue(vueUrl: string): DevPlugin {
  return {
    name: "externalize-vue",
    apply: "serve",
    enforce: "pre",
    resolveId(id) {
      if (id === "vue") return { id: vueUrl, external: true };
    },
  };
}

function advertiseDevServer(root: string, origin: string): DevPlugin {
  const file = resolve(root, "vite-dev.json");
  return {
    name: "advertise-dev-server",
    apply: "serve",
    configureServer(server) {
      const http = server.httpServer;
      if (http === null) return;
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
    vue: (options: { features: { componentIdGenerator: "filepath" } }) => object;
  },
) {
  const origin = `http://127.0.0.1:${options.port}`;
  return {
    root: options.root,
    plugins: [
      externalizeVue(hostVueUrl()),
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
