import { sendClientOptions } from "@/game/api/utils";
import { ServerShape } from "@/game/comm/types/shapes";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { createShapeFromDict } from "@/game/shapes/utils";
import { gameStore } from "@/game/store";
import { AnnotationManager } from "@/game/ui/annotation";
import { g2l } from "@/game/units";
import { EventBus } from "./event-bus";
import { visibilityStore } from "./visibility/store";
import { SyncMode } from "@/core/comm/types";

export class GameManager {
    selectedTool = 0;

    annotationManager = new AnnotationManager();

    addShape(shape: ServerShape): void {
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
        layer.addShape(sh, SyncMode.NO_SYNC);
        layer.invalidate(false);
    }

    updateShape(data: { shape: ServerShape; redraw: boolean; move: boolean; temporary: boolean }): void {
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
        shape.checkVisionSources();
        shape.setMovementBlock(shape.movementObstruction);
        shape.setIsToken(shape.isToken);
        if (data.redraw) {
            if (shape.visionObstruction) visibilityStore.recalculateVision(shape.floor);
            layerManager.getLayer(data.shape.floor, data.shape.layer)!.invalidate(false);
            if (shape.movementObstruction) visibilityStore.recalculateMovement(shape.floor);
        }
        if (redrawInitiative) EventBus.$emit("Initiative.ForceUpdate");
    }

    setCenterPosition(position: GlobalPoint): void {
        const localPos = g2l(position);
        gameStore.increasePanX((window.innerWidth / 2 - localPos.x) / gameStore.zoomFactor);
        gameStore.increasePanY((window.innerHeight / 2 - localPos.y) / gameStore.zoomFactor);
        layerManager.invalidateAllFloors();
        sendClientOptions(gameStore.locationOptions);
    }
}

export const gameManager = new GameManager();
(<any>window).gameManager = gameManager;
