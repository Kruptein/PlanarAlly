import { InvalidationMode, SyncMode } from "@/core/models/types";
import { layerManager } from "@/game/layers/manager";
import { ServerShape } from "@/game/models/shapes";
import { createShapeFromDict } from "@/game/shapes/utils";

import { getFloorId } from "./layers/store";
import { Shape } from "./shapes/shape";

class GameManager {
    addShape(shape: ServerShape, sync: SyncMode): Shape | undefined {
        if (!layerManager.hasLayer(layerManager.getFloor(getFloorId(shape.floor))!, shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const layer = layerManager.getLayer(layerManager.getFloor(getFloorId(shape.floor))!, shape.layer)!;
        const sh = createShapeFromDict(shape);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type_} could not be added`);
            return;
        }
        layer.addShape(sh, sync, InvalidationMode.NORMAL);
        layer.invalidate(false);
        return sh;
    }
}

export const gameManager = new GameManager();
(window as any).gameManager = gameManager;
