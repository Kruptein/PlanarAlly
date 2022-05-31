export type AssetListMap = Map<string, AssetListMap | AssetFile[]>;
export type ReadonlyAssetListMap = ReadonlyMap<string, ReadonlyAssetListMap | AssetFile[]>;

export interface AssetList {
    [inode: string]: AssetList | AssetFile[];
}

export interface AssetFile {
    id: number;
    name: string;
    hash: string;
}

export interface Asset {
    id: number;
    name: string;
    file_hash?: string;
    children?: Asset[];
}

export enum SyncMode {
    NO_SYNC,
    TEMP_SYNC,
    FULL_SYNC,
}

export enum InvalidationMode {
    NO,
    NORMAL,
    WITH_LIGHT,
}

export interface Sync {
    ui: boolean;
    server: boolean;
}

export const NO_SYNC: Sync = { server: false, ui: false };
export const SERVER_SYNC: Sync = { server: true, ui: false };
export const UI_SYNC: Sync = { server: false, ui: true };
export const FULL_SYNC: Sync = { server: true, ui: true };
