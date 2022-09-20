export interface LgSpawn {
    typeId: number;
    file: { imageSource: string; assetId: number };
}

export const HAND_TYPE = 64;

export interface TokMessage {
    angle: number;
    componentId: number;
    positionX: number;
    positionY: number;
    sessionId: number;
    typeId: number;
}
