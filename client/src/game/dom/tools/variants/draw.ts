import { computed, reactive, toRaw } from "vue";

import type { LocalPoint } from "../../../../core/geometry";
import type { PromptFunction } from "../../../../core/plugins/modals/prompt";
import { i18n } from "../../../../i18n";
import type { DrawToolState } from "../../../common/tools/draw";
import { DrawCategory, DrawMode, DrawShape } from "../../../common/tools/draw";
import type { LayerName, Floor } from "../../../core/models/floor";
import { ToolName } from "../../../core/models/tools";
import type { ToolFeatures, ITool } from "../../../core/models/tools";
import type { DOOR_TOGGLE_MODE } from "../../../core/systems/logic/door/models";
import { DEFAULT_PERMISSIONS } from "../../../core/systems/logic/models";
import type { Permissions } from "../../../core/systems/logic/models";
import { postRender } from "../../../messages/render";
import { getPressedModifiers } from "../../input/events";
import { Tool } from "../tool";

class DrawTool extends Tool implements ITool {
    readonly toolName = ToolName.Draw;
    readonly toolTranslation = i18n.global.t("tool.Draw");

    state = reactive<DrawToolState>({
        selectedMode: DrawMode.Normal,
        selectedShape: DrawShape.Square,
        selectedCategory: DrawCategory.Shape,

        fillColour: "rgba(0, 0, 0, 1)",
        borderColour: "rgba(255, 255, 255, 0)",

        isClosedPolygon: false,
        brushSize: 5,

        blocksVision: false,
        blocksMovement: false,

        fontSize: 20,

        isDoor: false,
        doorPermissions: DEFAULT_PERMISSIONS(),
        toggleMode: "both" as DOOR_TOGGLE_MODE,
    });
    hasBrushSize = computed(() => [DrawShape.Brush, DrawShape.Polygon].includes(this.state.selectedShape));

    // constructor() {
    //     super();
    //     watch(
    //         () => gameState.reactive.boardInitialized,
    //         () => {
    //             watch(
    //                 floorState.currentLayer,
    //                 async (newLayer, oldLayer) => {
    //                     if (oldLayer !== undefined) {
    //                         if (newLayer?.floor !== oldLayer.floor) {
    //                             await this.onFloorChange(floorSystem.getFloor({ id: oldLayer.floor })!);
    //                         } else if (newLayer.name !== oldLayer.name) {
    //                             await this.onLayerChange(oldLayer);
    //                         }
    //                     }
    //                     if (newLayer?.isVisionLayer ?? false) {
    //                         this.state.blocksMovement = true;
    //                         this.state.blocksVision = true;
    //                     } else if (oldLayer?.isVisionLayer === true) {
    //                         this.state.blocksMovement = false;
    //                         this.state.blocksVision = false;
    //                     }
    //                 },
    //                 { immediate: true },
    //             );
    //         },
    //     );
    //     watch(
    //         () => this.state.selectedMode,
    //         (newMode, oldMode) => this.onModeChange(newMode, oldMode),
    //     );
    //     watch(
    //         () => this.state.fillColour,
    //         () => {
    //             if (this.brushHelper) {
    //                 propertiesSystem.setFillColour(this.brushHelper.id, this.state.fillColour, NO_SYNC);
    //                 propertiesSystem.setStrokeColour(this.brushHelper.id, mostReadable(this.state.fillColour), NO_SYNC);
    //             }
    //         },
    //     );
    //     watch(
    //         () => this.state.brushSize,
    //         () => {
    //             if (this.brushHelper) {
    //                 this.brushHelper.strokeWidth = Math.max(1, this.state.brushSize * 0.05);
    //             }
    //         },
    //     );
    //     watchEffect(() => {
    //         if (this.shape !== undefined && this.active.value) {
    //             (this.shape as Polygon).openPolygon = !this.state.isClosedPolygon;
    //         }
    //     });
    // }

    // Prompt function

    private promptFunction: PromptFunction | undefined;

    setPromptFunction(promptFunction: PromptFunction): void {
        this.promptFunction = promptFunction;
    }

    // HELPERS

    // private getLayer(data?: { floor?: Floor; layer?: LayerName }): ILayer | undefined {
    //     if (this.state.selectedMode === DrawMode.Normal)
    //         return floorSystem.getLayer(data?.floor ?? floorState.readonly.currentFloor!, data?.layer);
    //     else if (this.state.selectedMode === DrawMode.Erase) {
    //         return floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Map);
    //     }
    //     return floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Lighting);
    // }

    // private async showLayerPoints(): Promise<void> {
    //     const layer = this.getLayer()!;
    //     await layer.waitValid();
    //     if (!this.isActiveTool.value) return;
    //     const dL = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw)!;
    //     for (const point of layer.points.keys()) {
    //         const parsedPoint = JSON.parse(point);
    //         dL.ctx.beginPath();
    //         dL.ctx.arc(g2lx(parsedPoint[0]), g2ly(parsedPoint[1]), 5, 0, 2 * Math.PI);
    //         dL.ctx.fill();
    //     }
    // }

    // private onModeChange(newValue: string, oldValue: string): void {
    //     if (this.brushHelper === undefined) return;

    //     const fowLayer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Lighting);
    //     const normalLayer = floorState.currentLayer.value;
    //     const mapLayer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Map)!;
    //     if (fowLayer === undefined || normalLayer === undefined) return;

    //     // Removal

    //     if (oldValue === DrawMode.Normal) {
    //         normalLayer.removeShape(this.brushHelper, {
    //             sync: SyncMode.NO_SYNC,
    //             recalculate: true,
    //             dropShapeId: false,
    //         });
    //     } else if (oldValue === DrawMode.Erase) {
    //         mapLayer.removeShape(this.brushHelper, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: false });
    //     } else {
    //         fowLayer.removeShape(this.brushHelper, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: false });
    //     }

    //     // Adding

    //     if (newValue === DrawMode.Normal) {
    //         normalLayer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
    //     } else if (newValue === DrawMode.Erase) {
    //         mapLayer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
    //     } else {
    //         fowLayer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
    //     }

    //     this.setupBrush();
    // }

    // private async onFloorChange(oldValue: Floor): Promise<void> {
    //     if (this.isActiveTool.value) {
    //         let mouse: { x: number; y: number } | undefined = undefined;
    //         if (this.brushHelper !== undefined) {
    //             mouse = { x: this.brushHelper.refPoint.x, y: this.brushHelper.refPoint.y };
    //         }
    //         this.onDeselect({ floor: oldValue });
    //         await this.onSelect(mouse);
    //     }
    // }

    // private async onLayerChange(oldValue: DeepReadonly<ILayer>): Promise<void> {
    //     if (this.isActiveTool.value) {
    //         let mouse: { x: number; y: number } | undefined = undefined;
    //         if (this.brushHelper !== undefined) {
    //             mouse = { x: this.brushHelper.refPoint.x, y: this.brushHelper.refPoint.y };
    //         }
    //         this.onDeselect({ layer: oldValue.name });
    //         await this.onSelect(mouse);
    //     }
    // }

    // STATE HANDLERS

    async onSelect(mouse?: { x: number; y: number }): Promise<void> {
        // const layer = this.getLayer();
        // if (layer === undefined) return Promise.resolve();
        // layer.canvas.parentElement!.style.cursor = "none";
        document.body.style.cursor = "none";
        await postRender("Tool.Draw.Select", toRaw(this.state));
    }

    onDeselect(data?: { floor?: Floor; layer?: LayerName }): void {
        // const layer = this.getLayer(data);
        // if (layer === undefined) return;
        // if (this.brushHelper !== undefined) {
        //     layer.removeShape(this.brushHelper, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
        //     this.brushHelper = undefined;
        // }
        // if (this.pointer !== undefined) {
        //     const drawLayer = floorSystem.getLayer(data?.floor ?? floorState.readonly.currentFloor!, LayerName.Draw);
        //     drawLayer!.removeShape(this.pointer, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
        //     this.pointer = undefined;
        // }
        // if (this.ruler !== undefined) {
        //     layer.removeShape(this.ruler, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
        //     this.ruler = undefined;
        // }
        // if (this.active.value && this.shape !== undefined) {
        //     layer.removeShape(this.shape, { sync: SyncMode.FULL_SYNC, recalculate: true, dropShapeId: true });
        //     this.shape = undefined;
        //     this.active.value = false;
        //     layer.invalidate(false);
        // }
        // layer.canvas.parentElement!.style.removeProperty("cursor");
        document.body.style.removeProperty("cursor");
        // floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw)?.invalidate(true);
    }

    // MOUSE HANDLERS

    async onDown(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        event?.preventDefault();
        await postRender("Tool.Draw.Down", { lp, state: toRaw(this.state), pressed: getPressedModifiers(event) });
    }

    async onMove(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        await postRender("Tool.Draw.Move", { lp, pressed: getPressedModifiers(event) });
    }

    async onUp(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        await postRender("Tool.Draw.Up", { lp, pressed: getPressedModifiers(event) });
    }

    async onContextMenu(event: MouseEvent): Promise<boolean> {
        // if (
        //     this.active.value &&
        //     this.shape !== undefined &&
        //     this.state.selectedShape === DrawShape.Polygon &&
        //     this.shape instanceof Polygon
        // ) {
        //     const layer = this.getLayer();
        //     if (layer === undefined) {
        //         console.log("No active layer!");
        //         return true;
        //     }
        //     layer.removeShape(this.ruler!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
        //     this.ruler = undefined;
        //     if (this.state.isClosedPolygon) {
        //         const props = getProperties(this.shape.id)!;
        //         const points = this.shape.points; // expensive call
        //         if (props.blocksVision && points.length > 1)
        //             visionState.insertConstraint(TriangulationTarget.VISION, this.shape, points[0]!, points.at(-1)!);
        //         if (props.blocksMovement && points.length > 1)
        //             visionState.insertConstraint(TriangulationTarget.MOVEMENT, this.shape, points[0]!, points.at(-1)!);
        //     }
        //     await this.finaliseShape();
        // } else if (!this.active.value) {
        //     openDefaultContextMenu(event);
        // }
        return true;
    }

    async onKeyUp(event: KeyboardEvent, features: ToolFeatures): Promise<void> {
        // if (event.defaultPrevented) return;
        // if (event.key === "Escape" && this.active.value) {
        //     let mouse: { x: number; y: number } | undefined = undefined;
        //     if (this.brushHelper !== undefined) {
        //         mouse = { x: this.brushHelper.refPoint.x, y: this.brushHelper.refPoint.y };
        //     }
        //     this.onDeselect();
        //     await this.onSelect(mouse);
        //     event.preventDefault();
        // }
        // super.onKeyUp(event, features);
    }

    // LOGIC

    setDoorPermissions(permissions: Permissions): void {
        this.state.doorPermissions = permissions;
    }
}

export const drawTool = new DrawTool();
