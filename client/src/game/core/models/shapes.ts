import type { DoorOptions } from "../systems/logic/door/models";
import type { TeleportOptions } from "../systems/logic/tp/models";

export interface ShapeOptions {
    isPlayerRect: boolean;

    preFogShape: boolean;
    skipDraw: boolean;
    borderOperation: GlobalCompositeOperation;

    // legacy svg stuff
    svgHeight: number;
    svgPaths: string[];
    svgWidth: number;
    // new svg stuff
    svgAsset: string;

    UiHelper: boolean;
}

export interface ServerShapeOptions extends ShapeOptions {
    // logic
    door: DoorOptions;
    teleport: TeleportOptions;
}
