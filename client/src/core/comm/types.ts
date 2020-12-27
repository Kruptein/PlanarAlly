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

/**
 * This enumeration is used to provide the required direction of certain communication streams.
 * SyncTo.UI is used to sync changes typically coming from the server to the UI
 * SyncTo.SERVER is used to sync changes typically coming from the UI to the server
 * SyncTo.SHAPE is a special case that is used to sync UI changes to the core Shape without updating the server.
 *
 * The latter is usually done when a bigger operation can be done by executing smaller existing operations
 * but only needing 1 server message.
 * E.g. Moving typically is equal to removing + creating, this can sometimes be done without ever removing the actual object
 * which would happen if we did it as 2 separate server events
 */
export enum SyncTo {
    UI,
    SERVER,
    SHAPE,
}
