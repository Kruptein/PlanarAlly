import AnnotationManager from "./ui/annotation";
import layerManager from "./layers/manager";

import { sendClientOptions } from "./api";
import { ServerShape } from "./comm/types/shapes";
import { GlobalPoint } from "./geom";
import game from "./game.vue";
import { createShapeFromDict } from "./shapes/utils";
import { g2l } from "./units";
import { store } from "./store";

export class GameManager {
    selectedTool: number = 0;

    annotationManager = new AnnotationManager();

    addShape(shape: ServerShape): void {
        if (!layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const layer = layerManager.getLayer(shape.layer)!;
        const sh = createShapeFromDict(shape);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type_} could not be added`);
            return;
        }
        layer.addShape(sh, false);
        layer.invalidate(false);
    }

    updateShape(data: { shape: ServerShape; redraw: boolean, move: boolean }): void {
        if (!layerManager.hasLayer(data.shape.layer)) {
            console.log(`Shape with unknown layer ${data.shape.layer} could not be added`);
            return;
        }
        const sh = createShapeFromDict(data.shape, true);
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
        if (data.move && shape.visionObstruction) store.recalculateBV();
        if (data.redraw) layerManager.getLayer(data.shape.layer)!.invalidate(false);
        if (redrawInitiative) (<any>game).$refs.initiative.$forceUpdate();
    }

    setCenterPosition(position: GlobalPoint) {
        const localPos = g2l(position);
        // store.commit("increasePanX", (window.innerWidth / 2 - localPos.x) / store.state.game.zoomFactor);
        // store.commit("increasePanY", (window.innerHeight / 2 - localPos.y) / store.state.game.zoomFactor);
        layerManager.invalidate();
        sendClientOptions();
    }
}

const gameManager = new GameManager();
(<any>window).gameManager = gameManager;
export default gameManager;
