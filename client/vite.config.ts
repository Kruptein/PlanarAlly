/// <reference types="vitest" />

import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueI18n from "@intlify/vite-plugin-vue-i18n";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueI18n({
            include: path.resolve(__dirname, "./src/locales/**"),
        }),
    ],
    server: {
        host: "0.0.0.0",
        port: 8080,
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
