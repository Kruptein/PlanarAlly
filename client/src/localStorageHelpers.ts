// random helpers for interacting with local storage

export const debugLayers = localStorage.getItem("PA_DEBUG_INVALIDATE_DRAW") === "true";

export function getLocalStorageObject(key: string): unknown {
    const data = localStorage.getItem(key);
    if (data === null) return undefined;

    return JSON.parse(data);
}

export function setLocalStorageObject(key: string, object: unknown): void {
    localStorage.setItem(key, JSON.stringify(object));
}
