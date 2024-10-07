import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    base: process.env.PA_BASEPATH,
    server: {
        host: "0.0.0.0",
        port: 8081,
    },
    build: {
        assetsDir:
            process.env.NODE_ENV === "production"
                ? "static/vite-admin"
                : "dev-static",
        outDir: "../server",
    },
    css: {
        preprocessorOptions: {
            scss: { api: "modern-compiler", charset: false },
        },
    },
});
