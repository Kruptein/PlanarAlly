/// <reference types="vitest" />

import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueI18n from "@intlify/unplugin-vue-i18n/vite";
import { transformLazyShow } from "v-lazy-show";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue({ template: { compilerOptions: { nodeTransforms: [transformLazyShow] } } }),
        vueI18n({
            include: path.resolve(__dirname, "./src/locales/**"),
        }),
    ],
    server: {
        host: "0.0.0.0",
        port: 8080,
        hmr: {
            port: 9324,
        },
        fs: {
            strict: false,
        },
    },
    base: process.env.PA_BASEPATH,
    build: {
        minify: "esbuild",
        assetsDir: process.env.NODE_ENV === "production" ? "static/vite" : "dev-static",
        outDir: "../server",
        chunkSizeWarningLimit: 2500,
        rollupOptions: {
            external: ["ammo.js"],
        },
    },
    css: { preprocessorOptions: { scss: { charset: false } } },
    test: {
        environment: "happy-dom",
        setupFiles: ["./test/setup.ts"],
        coverage: {
            reporter: ["text", "html"],
        },
    },
});
