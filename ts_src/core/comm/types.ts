export interface AssetList {
    [inode: string]: AssetList | AssetFile[];
}

export interface AssetFile {
    name: string;
    hash: string;
}