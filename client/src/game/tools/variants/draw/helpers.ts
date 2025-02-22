import { Colour } from "../../../colour";
import { VisionBlock } from "../../../systems/properties/types";

export function getDrawColours(
    blocksVision: VisionBlock,
    blocksMovement: boolean,
    isDoor: boolean,
): Colour | undefined {
    // If it's a door, apply door colours
    if (isDoor) {
        return Colour.Door;
    }
    // Otherwise if no vision/movement blockers are applied, use normal colours
    if (blocksVision === VisionBlock.No && !blocksMovement) {
        return undefined;
    }
    // Wall (vision+movement block)
    if (blocksVision !== VisionBlock.No) {
        return Colour.Wall;
    }
    // Window (vision block)
    return Colour.Window;
}
