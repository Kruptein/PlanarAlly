import BoundingVolume from "./bvh/bvh";
import store from "./store";
import AnnotationManager from "./ui/annotation";

import { ClientOptions, ServerShape } from "./api_types";
import { GlobalPoint } from "./geom";
import { LayerManager } from "./layers/manager";
import { vm } from "./planarally";
import { createShapeFromDict } from "./shapes/utils";
import { sendClientOptions } from "./socket";
import { g2l } from "./units";

export class GameManager {
    layerManager = new LayerManager();
    selectedTool: number = 0;

    lightsources: { shape: string; aura: string }[] = [];
    lightblockers: string[] = [];
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
        this.lightsources = [];
        this.lightblockers = [];
        this.annotations = [];
        this.movementblockers = [];
        this.ownedtokens = [];
        this.recalculateBoundingVolume();
    }

    recalculateBoundingVolume() {
        this.BV = new BoundingVolume(this.lightblockers);
    }

    addShape(shape: ServerShape): void {
        if (!this.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const layer = this.layerManager.getLayer(shape.layer)!;
        const sh = createShapeFromDict(shape);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type} could not be added`);
            return;
        }
        layer.addShape(sh, false);
        layer.invalidate(false);
    }

    moveShape(shape: ServerShape): void {
        if (!this.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const sh = createShapeFromDict(shape, true);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type} could not be added`);
            return;
        }
        const realShape = Object.assign(this.layerManager.UUIDMap.get(shape.uuid), sh);
        this.layerManager.getLayer(realShape.layer)!.onShapeMove(realShape);
    }

    updateShape(data: { shape: ServerShape; redraw: boolean }): void {
        if (!this.layerManager.hasLayer(data.shape.layer)) {
            console.log(`Shape with unknown layer ${data.shape.layer} could not be added`);
            return;
        }
        const sh = createShapeFromDict(data.shape, true);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${data.shape.type} could not be added`);
            return;
        }
        const oldShape = this.layerManager.UUIDMap.get(data.shape.uuid);
        if (oldShape === undefined) {
            console.log(`Shape with unknown id could not be updated`);
            return;
        }
        const redrawInitiative = sh.owners !== oldShape.owners;
        const shape = Object.assign(oldShape, sh);
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        shape.setIsToken(shape.isToken);
        if (data.redraw) this.layerManager.getLayer(data.shape.layer)!.invalidate(false);
        if (redrawInitiative) (<any>vm.$refs.initiative).$forceUpdate();
    }

    setClientOptions(options: ClientOptions): void {
        if (options.gridColour) store.commit("setGridColour", { colour: options.gridColour, sync: false });
        if (options.fowColour) store.commit("setFOWColour", { colour: options.fowColour, sync: false });
        if (options.rulerColour) store.commit("setRulerColour", { colour: options.rulerColour, sync: false });
        if (options.locationOptions) {
            if (
                options.locationOptions[
                `${store.state.roomName}/${store.state.roomCreator}/${store.state.locationName}`
                ]
            ) {
                const loc =
                    options.locationOptions[
                    `${store.state.roomName}/${store.state.roomCreator}/${store.state.locationName}`
                    ];
                if (loc.panX) store.commit("setPanX", loc.panX);
                if (loc.panY) store.commit("setPanY", loc.panY);
                if (loc.zoomFactor) {
                    store.commit("setZoomFactor", loc.zoomFactor);
                }
                if (this.layerManager.getGridLayer() !== undefined) this.layerManager.getGridLayer()!.invalidate();
            }
        }
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
