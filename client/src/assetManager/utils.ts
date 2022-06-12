import { baseAdjust } from "../core/http";

import { assetStore } from "./state";

const state = assetStore.state;

export function showIdName(dir: number): string {
    return state.idMap.get(dir)?.name ?? "";
}

export function getIdImageSrc(file: number): string {
    return baseAdjust("/static/assets/" + state.idMap.get(file)!.file_hash);
}

export function changeDirectory(folder: number): void {
    assetStore.changeDirectory(folder);
}
