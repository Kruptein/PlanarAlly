import type { Vector } from "../../core/geometry";
import type { LocalId } from "../../core/id";
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

    // used to store noteIds for templates
    // only relevant on asset drop and template creation
    templateNoteIds: string[];

    collapsedIds: [LocalId, Vector][];
}

export interface ServerShapeOptions extends ShapeOptions {
    // logic
    door: DoorOptions;
    teleport: TeleportOptions;
}
