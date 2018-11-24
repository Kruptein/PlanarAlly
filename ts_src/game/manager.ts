import BoundingVolume from "./bvh/bvh";
import store from "./store";
import AnnotationManager from "./ui/annotation";

import { sendClientOptions } from "./comm/socket";
import { ServerShape } from "./comm/types/shapes";
import { GlobalPoint } from "./geom";
import { LayerManager } from "./layers/manager";
import { vm } from "./planarally";
import { createShapeFromDict } from "./shapes/utils";
import { g2l } from "./units";

export class GameManager {
    layerManager = new LayerManager();
    selectedTool: number = 0;

    visionSources: { shape: string; aura: string }[] = [];
    visionBlockers: string[] = [];
    annotations: string[] = [];
    movementblockers: string[] = [];
    ownedtokens: string[] = [];

    annotationManager = new AnnotationManager();

    BV!: BoundingVolume;

    constructor() {
        this.recalculateBoundingVolume();
    }

    clear() {
        this.layerManager = new LayerManager();
        this.visionSources = [];
        this.visionBlockers = [];
        this.annotations = [];
        this.movementblockers = [];
        this.ownedtokens = [];
        this.recalculateBoundingVolume();
    }

    recalculateBoundingVolume() {
        if (store.state.boardInitialized) {
            let success = false;
            while (!success) {
                success = true;
                try {
                    this.BV = new BoundingVolume(this.visionBlockers);
                } catch {
                    success = false;
                }
            }
        }
    }

    addShape(shape: ServerShape): void {
        if (!this.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const layer = this.layerManager.getLayer(shape.layer)!;
        const sh = createShapeFromDict(shape);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type_} could not be added`);
            return;
        }
        layer.addShape(sh, false);
        layer.invalidate(false);
    }

    updateShape(data: { shape: ServerShape; redraw: boolean, move: boolean }): void {
        if (!this.layerManager.hasLayer(data.shape.layer)) {
            console.log(`Shape with unknown layer ${data.shape.layer} could not be added`);
            return;
        }
        const sh = createShapeFromDict(data.shape, true);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${data.shape.type_} could not be added`);
            return;
        }
        const oldShape = this.layerManager.UUIDMap.get(data.shape.uuid);
        if (oldShape === undefined) {
            console.log(`Shape with unknown id could not be updated`);
            return;
        }
        const redrawInitiative = sh.owners !== oldShape.owners;
        const shape = Object.assign(oldShape, sh);
        shape.checkVisionSources();
        shape.setMovementBlock(shape.movementObstruction);
        shape.setIsToken(shape.isToken);
        if (data.move && shape.visionObstruction) this.recalculateBoundingVolume();
        if (data.redraw) this.layerManager.getLayer(data.shape.layer)!.invalidate(false);
        if (redrawInitiative) (<any>vm.$refs.initiative).$forceUpdate();
    }

    setCenterPosition(position: GlobalPoint) {
        const localPos = g2l(position);
        store.commit("increasePanX", (window.innerWidth / 2 - localPos.x) / store.state.zoomFactor);
        store.commit("increasePanY", (window.innerHeight / 2 - localPos.y) / store.state.zoomFactor);
        this.layerManager.invalidate();
        sendClientOptions();
    }
}

const gameManager = new GameManager();
(<any>window).gameManager = gameManager;
export default gameManager;
