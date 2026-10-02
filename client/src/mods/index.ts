import { ref } from "vue";

import type { ApiModMeta } from "../apiTypes";
import { baseAdjust } from "../core/http";

import { modEvents } from "./events";
import { shutdownMod } from "./lifecycle";
import type { Mod } from "./models";

export interface LoadedMod {
    id: string;
    meta: ApiModMeta;
    mod: Mod;
    gameStarted: boolean;
}

export const loadedMods = ref<LoadedMod[]>([]);
export const devModsActive = ref(false);

let roomModsReady = false;
let pendingDevMods: { mods: ApiModMeta[]; force: boolean } | undefined;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
const { promise: modsLoading, resolve: resolveModsLoading } = Promise.withResolvers<void>();
export { modsLoading };

export function loadedModId(meta: { tag: string; version: string; hash: string; dev?: boolean }): string {
    if (meta.dev === true) return `dev:${meta.tag}`;
    return `${meta.tag}-${meta.version}-${meta.hash}`;
}

export async function loadMod(meta: ApiModMeta, cacheBust?: string): Promise<LoadedMod | undefined> {
    const id = loadedModId(meta);
    try {
        const mod = (await import(/* @vite-ignore */ scriptUrl(meta, cacheBust))) as Mod;
        if (loadedMods.value.some((loaded) => loaded.id === id)) {
            console.debug(`Mod ${id} has already been loaded. Skipping.`);
            return;
        }
        if (meta.hasCss) createCss(id, meta, cacheBust);
        await mod.events?.init?.(meta);
        const entry: LoadedMod = { id, meta, mod, gameStarted: false };
        loadedMods.value.push(entry);
        return entry;
    } catch (error) {
        console.error(`Failed to load ${id} mod`, error);
    }
}

export async function loadRoomMods(mods: ApiModMeta[]): Promise<void> {
    devModsActive.value = mods.some((mod) => mod.dev);
    for (const modMeta of mods) {
        // oxlint-disable-next-line no-await-in-loop
        await loadMod(modMeta);
    }
    roomModsReady = true;
    resolveModsLoading();
    if (pendingDevMods) {
        const pending = pendingDevMods;
        pendingDevMods = undefined;
        await syncDevMods(pending.mods, pending.force);
    }
}

export async function activateMod(entry: LoadedMod): Promise<void> {
    await modEvents.gameOpened([entry]);
    await modEvents.locationLoaded([entry]);
}

export async function syncDevMods(mods: ApiModMeta[], force: boolean): Promise<void> {
    if (!roomModsReady) {
        pendingDevMods = { mods, force };
        return;
    }
    devModsActive.value = mods.length > 0;
    const tags = new Set(mods.map((mod) => mod.tag));
    const removed = loadedMods.value.filter((existing) => existing.meta.dev && !tags.has(existing.meta.tag));
    for (const existing of removed) {
        // oxlint-disable-next-line no-await-in-loop
        await unloadMod(existing.id);
    }
    const cacheBust = force ? String(Date.now()) : undefined;
    for (const meta of mods) {
        const existing = loadedMods.value.find((mod) => mod.meta.dev && mod.meta.tag === meta.tag);
        if (existing && !force && existing.meta.reloadToken === meta.reloadToken) continue;
        if (existing) {
            // oxlint-disable-next-line no-await-in-loop
            await unloadMod(existing.id);
        }
        // oxlint-disable-next-line no-await-in-loop
        const loaded = await loadMod(meta, cacheBust);
        if (loaded) {
            // oxlint-disable-next-line no-await-in-loop
            await activateMod(loaded);
        }
    }
}

export async function replaceRoomMod(meta: ApiModMeta): Promise<void> {
    if (loadedMods.value.some((mod) => mod.meta.dev && mod.meta.tag === meta.tag)) {
        console.debug(`Dev mod ${meta.tag} is active; leaving the published upload linked for later.`);
        return;
    }
    const nextId = loadedModId(meta);
    const replaced = loadedMods.value.filter(
        (existing) => !existing.meta.dev && existing.meta.tag === meta.tag && existing.id !== nextId,
    );
    for (const existing of replaced) {
        // oxlint-disable-next-line no-await-in-loop
        await unloadMod(existing.id);
    }
    const loaded = await loadMod(meta);
    if (loaded) await activateMod(loaded);
}

export async function unloadMod(id: string): Promise<void> {
    const entry = loadedMods.value.find((mod) => mod.id === id);
    loadedMods.value = loadedMods.value.filter((mod) => mod.id !== id);
    removeStyles(id);
    if (entry) await shutdownMod(entry.mod, entry.id);
}

export function unloadRoomMods(): void {
    roomModsReady = false;
    pendingDevMods = undefined;
    devModsActive.value = false;
    const current = [...loadedMods.value];
    loadedMods.value = [];
    for (const entry of current) {
        removeStyles(entry.id);
        void shutdownMod(entry.mod, entry.id);
    }
    for (const link of document.querySelectorAll("[data-room-mod]")) link.remove();
}

function scriptUrl(meta: ApiModMeta, cacheBust?: string): string {
    if (meta.dev) {
        const params = new URLSearchParams({ t: meta.reloadToken ?? "" });
        if (cacheBust !== undefined) params.set("r", cacheBust);
        return baseAdjust(`/static/mods-dev/${encodeURIComponent(meta.tag)}/index.js?${params}`);
    }
    return baseAdjust(`/static/mods/${loadedModId(meta)}/index.js`);
}

function createCss(modId: string, meta: ApiModMeta, cacheBust?: string): void {
    const link = document.createElement("link");
    if (meta.dev) {
        const params = new URLSearchParams({ t: meta.reloadToken ?? "" });
        if (cacheBust !== undefined) params.set("r", cacheBust);
        link.href = baseAdjust(`/static/mods-dev/${encodeURIComponent(meta.tag)}/index.css?${params}`);
    } else {
        link.href = baseAdjust(`/static/mods/${modId}/index.css`);
    }
    link.rel = "stylesheet";
    link.type = "text/css";
    link.dataset.roomMod = "true";
    link.dataset.modId = modId;
    document.head.appendChild(link);
}

function removeStyles(modId: string): void {
    for (const link of document.querySelectorAll(`[data-mod-id="${CSS.escape(modId)}"]`)) link.remove();
}
