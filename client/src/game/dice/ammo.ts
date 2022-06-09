import { baseAdjust } from "../../core/http";

const loadScriptAsync = (url: string): Promise<void> => {
    return new Promise((resolve) => {
        const tag = document.createElement("script");
        tag.onload = () => {
            resolve();
        };
        tag.onerror = () => {
            throw new Error(`failed to load ${url}`);
        };
        tag.async = true;
        tag.src = url;
        document.head.appendChild(tag);
    });
};

export const loadAmmoModule = async (): Promise<void> => {
    // console.log(wasmSupported ? 'WebAssembly is supported' : 'WebAssembly is not supported')
    // if (wasmSupported) loadScriptAsync(`${path}/ammo.wasm.js`, () => doneCallback())
    await loadScriptAsync(baseAdjust("/static/extern/js/ammo.js"));
};
