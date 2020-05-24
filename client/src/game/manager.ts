import { InvalidationMode, SyncMode } from "@/core/comm/types";
import { sendClientOptions } from "@/game/api/utils";
import { ServerShape } from "@/game/comm/types/shapes";
import { EventBus } from "@/game/event-bus";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { createShapeFromDict } from "@/game/shapes/utils";
import { gameStore } from "@/game/store";
import { AnnotationManager } from "@/game/ui/annotation";
import { g2l } from "@/game/units";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";
import { Shape } from "./shapes/shape";

export class GameManager {
    selectedTool = 0;

    annotationManager = new AnnotationManager();

    addShape(shape: ServerShape): Shape | undefined {
        if (!layerManager.hasLayer(shape.floor, shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const layer = layerManager.getLayer(shape.floor, shape.layer)!;
        const sh = createShapeFromDict(shape);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type_} could not be added`);
            return;
        }
        layer.addShape(sh, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        layer.invalidate(false);
        return sh;
    }

    updateShape(data: { shape: ServerShape; redraw: boolean }): void {
        if (!layerManager.hasLayer(data.shape.floor, data.shape.layer)) {
            console.log(`Shape with unknown layer ${data.shape.layer} could not be added`);
            return;
        }
        const sh = createShapeFromDict(data.shape);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${data.shape.type_} could not be added`);
            return;
        }
        const oldShape = layerManager.UUIDMap.get(data.shape.uuid);
        if (oldShape === undefined) {
            console.log(`Shape with unknown id could not be updated`);
            return;
        }
        const redrawInitiative = sh.owners !== oldShape.owners;
        const shape = Object.assign(oldShape, sh);
        const alteredVision = shape.checkVisionSources();
        const alteredMovement = shape.setMovementBlock(shape.movementObstruction);
        shape.setIsToken(shape.isToken);
        if (data.redraw) {
            if (shape.visionObstruction && !alteredVision) {
                visibilityStore.deleteFromTriag({
                    target: TriangulationTarget.VISION,
                    shape,
                });
                visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape });
                visibilityStore.recalculateVision(shape.floor);
            }
            layerManager.getLayer(data.shape.floor, data.shape.layer)!.invalidate(false);
            layerManager.invalidateLightAllFloors();
            if (shape.movementObstruction && !alteredMovement) {
                visibilityStore.deleteFromTriag({
                    target: TriangulationTarget.MOVEMENT,
                    shape,
                });
                visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape });
                visibilityStore.recalculateMovement(shape.floor);
            }
        }
        if (redrawInitiative) EventBus.$emit("Initiative.ForceUpdate");
    }

    setCenterPosition(position: GlobalPoint): void {
        const localPos = g2l(position);
        gameStore.increasePanX((window.innerWidth / 2 - localPos.x) / gameStore.zoomFactor);
        gameStore.increasePanY((window.innerHeight / 2 - localPos.y) / gameStore.zoomFactor);
        layerManager.invalidateAllFloors();
        sendClientOptions(gameStore.locationUserOptions);
    }
}

export const gameManager = new GameManager();
(<any>window).gameManager = gameManager;
