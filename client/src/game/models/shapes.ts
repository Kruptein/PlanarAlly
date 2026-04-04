import type { Vector } from "../../core/geometry";
import type { LocalId } from "../../core/id";
import type { DoorOptions } from "../systems/logic/door/models";
import type { TeleportOptions } from "../systems/logic/tp/models";
import type { NoteId } from "../systems/notes/types";

export interface ShapeOptions {
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
    templateNoteIds: NoteId[];

    collapsedIds: [LocalId, Vector][];

    // Special shapes created by the light tool
    // These have custom rendering logic that only applies during light tool interaction
    // and generally interact with the ambient light system
    lightShape: boolean;
    ambientBarrier: boolean;
}

export interface ServerShapeOptions extends ShapeOptions {
    // logic
    door: DoorOptions;
    teleport: TeleportOptions;
}
