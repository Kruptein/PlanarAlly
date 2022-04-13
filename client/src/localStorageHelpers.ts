// random helpers for interacting with local storage

export function debugLayers(): boolean {
    return localStorage.getItem("PA_DEBUG_INVALIDATE_DRAW") === "true";
}
