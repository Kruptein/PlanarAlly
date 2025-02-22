import { computed, reactive, watch, watchEffect } from "vue";
import type { DeepReadonly } from "vue";

import { getUnitDistance, l2g, l2gz } from "../../../../core/conversions";
import { addP, cloneP, subtractP, toArrayP, toGP, Vector } from "../../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../../core/geometry";
import { snapPointToGrid } from "../../../../core/grid";
import { equalPoints, snapToPoint } from "../../../../core/math";
import { InvalidationMode, NO_SYNC, SyncMode, UI_SYNC } from "../../../../core/models/types";
import type { PromptFunction } from "../../../../core/plugins/modals/prompt";
import { ctrlOrCmdPressed, mostReadable } from "../../../../core/utils";
import { i18n } from "../../../../i18n";
import { sendShapeSizeUpdate } from "../../../api/emits/shape/core";
import type { ILayer } from "../../../interfaces/layer";
import type { IShape } from "../../../interfaces/shape";
import type { ICircle } from "../../../interfaces/shapes/circle";
import type { IRect } from "../../../interfaces/shapes/rect";
import { LayerName } from "../../../models/floor";
import type { Floor } from "../../../models/floor";
import { ToolName } from "../../../models/tools";
import type { ToolFeatures, ITool } from "../../../models/tools";
import { overrideLastOperation } from "../../../operations/undo";
import { Circle } from "../../../shapes/variants/circle";
import { Line } from "../../../shapes/variants/line";
import { Polygon } from "../../../shapes/variants/polygon";
import { Rect } from "../../../shapes/variants/rect";
import { Text } from "../../../shapes/variants/text";
import { accessSystem } from "../../../systems/access";
import { floorSystem } from "../../../systems/floors";
import { floorState } from "../../../systems/floors/state";
import { gameState } from "../../../systems/game/state";
import { doorSystem } from "../../../systems/logic/door";
import type { DOOR_TOGGLE_MODE } from "../../../systems/logic/door/models";
import { DEFAULT_PERMISSIONS } from "../../../systems/logic/models";
import type { Permissions } from "../../../systems/logic/models";
import { playerSystem } from "../../../systems/players";
import { propertiesSystem } from "../../../systems/properties";
import { getProperties } from "../../../systems/properties/state";
import { VisionBlock } from "../../../systems/properties/types";
import { locationSettingsState } from "../../../systems/settings/location/state";
import { playerSettingsState } from "../../../systems/settings/players/state";
import { openDefaultContextMenu } from "../../../ui/contextmenu/state";
import { TriangulationTarget, visionState } from "../../../vision/state";
import { Tool } from "../../tool";

import { getDrawColours } from "./helpers";

export enum DrawMode {
    Normal = "normal",
    Reveal = "reveal",
    Hide = "hide",
    Erase = "erase",
}

export enum DrawShape {
    Square = "square",
    Circle = "circle",
    Polygon = "draw-polygon",
    Brush = "paint-brush",
    Text = "font",
}

export enum DrawCategory {
    Shape = "square",
    Vision = "eye",
    Logic = "cogs",
}

class DrawTool extends Tool implements ITool {
    readonly toolName = ToolName.Draw;
    readonly toolTranslation = i18n.global.t("tool.Draw");

    state = reactive({
        selectedMode: DrawMode.Normal,
        selectedShape: DrawShape.Square,
        selectedCategory: DrawCategory.Shape,

        // Used for default colours (e.g. walls/windows/doors)
        // When set to true, the default colours will be used when relevant
        // otherwise the actual selected colours will be used.
        preferDefaultColours: true,
        fillColour: "rgba(0, 0, 0, 1)",
        borderColour: "rgba(255, 255, 255, 0)",

        isClosedPolygon: false,
        brushSize: 5,

        blocksVision: VisionBlock.No,
        blocksMovement: false,

        fontSize: 20,

        isDoor: false,
        doorPermissions: DEFAULT_PERMISSIONS(),
        toggleMode: "both" as DOOR_TOGGLE_MODE,
    });
    hasBrushSize = computed(() => [DrawShape.Brush, DrawShape.Polygon].includes(this.state.selectedShape));
    colours = computed(() => {
        const overruledColour = getDrawColours(this.state.blocksVision, this.state.blocksMovement, this.state.isDoor);
        return {
            fill: overruledColour ?? this.state.fillColour,
            stroke: overruledColour ?? this.state.borderColour,
        };
    });

    private startPoint?: GlobalPoint;
    private shape?: IShape;
    private brushHelper?: Circle;
    private ruler?: Line;
    private pointer?: Polygon;

    private snappedToPoint = false;

    constructor() {
        super();
        watch(
            () => gameState.reactive.boardInitialized,
            () => {
                watch(
                    floorState.currentLayer,
                    async (newLayer, oldLayer) => {
                        if (oldLayer !== undefined) {
                            if (newLayer?.floor !== oldLayer.floor) {
                                await this.onFloorChange(floorSystem.getFloor({ id: oldLayer.floor })!);
                            } else if (newLayer.name !== oldLayer.name) {
                                await this.onLayerChange(oldLayer);
                            }
                        }
                        if (newLayer?.isVisionLayer ?? false) {
                            this.state.blocksMovement = true;
                            this.state.blocksVision = VisionBlock.Behind;
                        } else if (oldLayer?.isVisionLayer === true) {
                            this.state.blocksMovement = false;
                            this.state.blocksVision = VisionBlock.No;
                        }
                    },
                    { immediate: true },
                );
            },
        );
        watch(
            () => this.state.selectedMode,
            (newMode, oldMode) => this.onModeChange(newMode, oldMode),
        );
        watch(
            () => this.colours.value.fill,
            () => {
                if (this.brushHelper) {
                    propertiesSystem.setFillColour(this.brushHelper.id, this.colours.value.fill, NO_SYNC);
                    propertiesSystem.setStrokeColour(
                        this.brushHelper.id,
                        mostReadable(this.colours.value.fill),
                        NO_SYNC,
                    );
                }
            },
        );
        watch(
            () => this.state.brushSize,
            () => {
                if (this.brushHelper) {
                    this.brushHelper.strokeWidth = Math.max(1, this.state.brushSize * 0.05);
                }
            },
        );
        watchEffect(() => {
            if (this.shape !== undefined && this.active.value) {
                (this.shape as Polygon).openPolygon = !this.state.isClosedPolygon;
            }
        });
    }

    // Prompt function

    private promptFunction: PromptFunction | undefined;

    setPromptFunction(promptFunction: PromptFunction): void {
        this.promptFunction = promptFunction;
    }

    // HELPERS

    private get helperSize(): number {
        if (this.hasBrushSize.value) return this.state.brushSize / 2;
        return getUnitDistance(locationSettingsState.raw.unitSize.value) / 8;
    }

    private getLayer(data?: { floor?: Floor; layer?: LayerName }): ILayer | undefined {
        if (this.state.selectedMode === DrawMode.Normal)
            return floorSystem.getLayer(data?.floor ?? floorState.currentFloor.value!, data?.layer);
        else if (this.state.selectedMode === DrawMode.Erase) {
            return floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Map);
        }
        return floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Lighting);
    }

    private async finaliseShape(): Promise<void> {
        if (this.shape === undefined) return;
        if (this.shape.points.length <= 1) {
            let mouse: { x: number; y: number } | undefined = undefined;
            if (this.brushHelper !== undefined) {
                mouse = { x: this.brushHelper.refPoint.x, y: this.brushHelper.refPoint.y };
            }
            this.onDeselect();
            await this.onSelect(mouse);
        } else {
            const props = getProperties(this.shape.id)!;

            if (this.shape.floorId !== undefined) {
                if (props.blocksVision !== VisionBlock.No) visionState.recalculateVision(this.shape.floorId);
                if (props.blocksMovement) visionState.recalculateMovement(this.shape.floorId);
            }
            if (!this.shape.preventSync) sendShapeSizeUpdate({ shape: this.shape, temporary: false });
            if (this.state.isDoor) {
                doorSystem.inform(
                    this.shape.id,
                    true,
                    {
                        permissions: this.state.doorPermissions,
                        toggleMode: this.state.toggleMode,
                    },
                    true,
                );
            }
            overrideLastOperation({
                type: "shapeadd",
                shapes: [this.shape.asDict()],
                floor: this.shape.floor!.name,
                layerName: this.shape.layer!.name,
            });
        }
        this.shape = undefined;
        this.active.value = false;
        const layer = this.getLayer();
        if (layer !== undefined) {
            layer.invalidate(false);
        }
    }

    // private async showLayerPoints(): Promise<void> {
    //     const layer = this.getLayer()!;
    //     await layer.postDrawCallback.wait();
    //     if (!this.isActiveTool.value) return;
    //     const dL = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw)!;
    //     for (const point of layer.points.keys()) {
    //         const parsedPoint = JSON.parse(point);
    //         dL.ctx.beginPath();
    //         dL.ctx.arc(g2lx(parsedPoint[0]), g2ly(parsedPoint[1]), 5, 0, 2 * Math.PI);
    //         dL.ctx.fill();
    //     }
    // }

    private onModeChange(newValue: DrawMode, oldValue: DrawMode): void {
        if (this.brushHelper === undefined) return;

        const fowLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Lighting);
        const normalLayer = floorState.currentLayer.value;
        const mapLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Map)!;
        if (fowLayer === undefined || normalLayer === undefined) return;

        // Removal

        if (oldValue === DrawMode.Normal) {
            normalLayer.removeShape(this.brushHelper, {
                sync: SyncMode.NO_SYNC,
                recalculate: true,
                dropShapeId: false,
            });
        } else if (oldValue === DrawMode.Erase) {
            mapLayer.removeShape(this.brushHelper, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: false });
        } else {
            fowLayer.removeShape(this.brushHelper, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: false });
        }

        // Adding

        if (newValue === DrawMode.Normal) {
            normalLayer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        } else if (newValue === DrawMode.Erase) {
            mapLayer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        } else {
            fowLayer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        }

        this.setupBrush();
    }

    private async onFloorChange(oldValue: Floor): Promise<void> {
        if (this.isActiveTool.value) {
            let mouse: { x: number; y: number } | undefined = undefined;
            if (this.brushHelper !== undefined) {
                mouse = { x: this.brushHelper.refPoint.x, y: this.brushHelper.refPoint.y };
            }
            this.onDeselect({ floor: oldValue });
            await this.onSelect(mouse);
        }
    }

    private async onLayerChange(oldValue: DeepReadonly<ILayer>): Promise<void> {
        if (this.isActiveTool.value) {
            let mouse: { x: number; y: number } | undefined = undefined;
            if (this.brushHelper !== undefined) {
                mouse = { x: this.brushHelper.refPoint.x, y: this.brushHelper.refPoint.y };
            }
            this.onDeselect({ layer: oldValue.name });
            await this.onSelect(mouse);
        }
    }

    // STATE HANDLERS

    onSelect(mouse?: { x: number; y: number }): Promise<void> {
        const layer = this.getLayer();
        if (layer === undefined) return Promise.resolve();
        layer.canvas.parentElement!.style.cursor = "none";
        this.brushHelper = this.createBrush(toGP(mouse?.x ?? -1000, mouse?.y ?? -1000));
        layer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL); // during mode change the shape is already added
        this.setupBrush();
        // if (getGameState().isDm) this.showLayerPoints();
        this.pointer = this.createPointer(toGP(mouse?.x ?? -1000, mouse?.y ?? -1000));
        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        drawLayer!.addShape(this.pointer, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        drawLayer!.invalidate(true);
        return Promise.resolve();
    }

    onDeselect(data?: { floor?: Floor; layer?: LayerName }): void {
        const layer = this.getLayer(data);
        if (layer === undefined) return;
        if (this.brushHelper !== undefined) {
            layer.removeShape(this.brushHelper, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            this.brushHelper = undefined;
        }
        if (this.pointer !== undefined) {
            const drawLayer = floorSystem.getLayer(data?.floor ?? floorState.currentFloor.value!, LayerName.Draw);
            drawLayer!.removeShape(this.pointer, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            this.pointer = undefined;
        }
        if (this.ruler !== undefined) {
            layer.removeShape(this.ruler, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            this.ruler = undefined;
        }
        if (this.active.value && this.shape !== undefined) {
            layer.removeShape(this.shape, { sync: SyncMode.FULL_SYNC, recalculate: true, dropShapeId: true });
            this.shape = undefined;
            this.active.value = false;
            layer.invalidate(false);
        }
        layer.canvas.parentElement!.style.removeProperty("cursor");
        floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw)?.invalidate(true);
    }

    // MOUSE HANDLERS

    async onDown(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        const startPoint = l2g(lp);
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        if (this.brushHelper === undefined) return;

        if (!this.active.value) {
            if (event && playerSettingsState.useSnapping(event)) {
                const gridType = locationSettingsState.raw.gridType.value;
                this.startPoint = snapPointToGrid(startPoint, gridType, {
                    snapDistance: Number.MAX_VALUE,
                })[0];
            } else {
                this.startPoint = startPoint;
            }

            this.active.value = true;
            switch (this.state.selectedShape) {
                case DrawShape.Square: {
                    this.shape = new Rect(cloneP(this.startPoint), 0, 0, undefined, {
                        fillColour: this.colours.value.fill,
                        strokeColour: [this.colours.value.stroke],
                    });
                    break;
                }
                case DrawShape.Circle: {
                    this.shape = new Circle(cloneP(this.startPoint), this.helperSize, undefined, {
                        fillColour: this.colours.value.fill,
                        strokeColour: [this.colours.value.stroke],
                    });
                    break;
                }
                case DrawShape.Brush: {
                    this.shape = new Polygon(
                        cloneP(this.startPoint),
                        [],
                        { openPolygon: true, lineWidth: [this.state.brushSize] },
                        {
                            strokeColour: [this.colours.value.fill],
                        },
                    );
                    propertiesSystem.setFillColour(this.shape.id, this.colours.value.fill, NO_SYNC);
                    break;
                }
                case DrawShape.Polygon: {
                    const stroke = this.state.isClosedPolygon ? this.colours.value.stroke : this.colours.value.fill;
                    if (event && playerSettingsState.useSnapping(event) && !this.snappedToPoint) {
                        const gridType = locationSettingsState.raw.gridType.value;
                        this.brushHelper.refPoint = snapPointToGrid(this.startPoint, gridType, {
                            snapDistance: Number.MAX_VALUE,
                        })[0];
                    }
                    this.shape = new Polygon(
                        cloneP(this.brushHelper.refPoint),
                        [],
                        { lineWidth: [this.state.brushSize], openPolygon: !this.state.isClosedPolygon },
                        {
                            fillColour: this.colours.value.fill, // is ignored for open polygons
                            strokeColour: [stroke],
                        },
                    );
                    break;
                }
                case DrawShape.Text: {
                    event?.preventDefault();
                    const text = await this.promptFunction!("What should the text say?", "New text");
                    if (text === undefined) {
                        this.active.value = false;
                        return;
                    }
                    this.shape = new Text(cloneP(this.brushHelper.refPoint), text, this.state.fontSize, undefined, {
                        fillColour: this.colours.value.fill,
                        strokeColour: [this.colours.value.stroke],
                    });
                    break;
                }
                default:
                    return;
            }

            if (this.state.selectedMode === DrawMode.Erase) {
                propertiesSystem.setFillColour(this.shape.id, "rgba(0, 0, 0, 1)", NO_SYNC);
            }
            if (this.state.selectedMode === DrawMode.Hide || this.state.selectedMode === DrawMode.Reveal) {
                this.shape.options.preFogShape = true;
                this.shape.options.skipDraw = true;
                propertiesSystem.setFillColour(this.shape.id, "rgba(0, 0, 0, 1)", NO_SYNC);
            }
            if (this.state.selectedMode === DrawMode.Reveal) this.shape.globalCompositeOperation = "source-over";
            else if (this.state.selectedMode === DrawMode.Hide) this.shape.globalCompositeOperation = "destination-out";
            else if (this.state.selectedMode === DrawMode.Erase)
                this.shape.globalCompositeOperation = "destination-out";

            accessSystem.addAccess(
                this.shape.id,
                playerSystem.getCurrentPlayer()!.name,
                { edit: true, movement: true, vision: true },
                UI_SYNC,
            );
            if (this.state.selectedMode === DrawMode.Normal) {
                if (this.state.blocksMovement) {
                    propertiesSystem.setBlocksMovement(this.shape.id, true, UI_SYNC, false);
                }
                if (this.state.blocksVision !== VisionBlock.No) {
                    propertiesSystem.setBlocksVision(this.shape.id, this.state.blocksVision, UI_SYNC, false);
                }
            }
            layer.addShape(this.shape, SyncMode.FULL_SYNC, InvalidationMode.NO);

            // Push brushhelper to back
            this.pushBrushBack();
        } else if (
            this.shape !== undefined &&
            this.state.selectedShape === DrawShape.Polygon &&
            this.shape instanceof Polygon
        ) {
            // draw tool already active in polygon mode, add a new point to the polygon

            if (event && playerSettingsState.useSnapping(event) && !this.snappedToPoint) {
                const gridType = locationSettingsState.raw.gridType.value;
                this.brushHelper.refPoint = snapPointToGrid(startPoint, gridType, {
                    snapDistance: Number.MAX_VALUE,
                })[0];
            }
            this.shape.pushPoint(cloneP(this.brushHelper.refPoint));
        }

        // Start a ruler in polygon mode from the last point
        if (
            this.shape !== undefined &&
            this.state.selectedShape === DrawShape.Polygon &&
            this.shape instanceof Polygon
        ) {
            const lastPoint = this.brushHelper.refPoint;
            if (this.ruler === undefined) {
                this.ruler = new Line(
                    lastPoint,
                    lastPoint,
                    {
                        lineWidth: this.state.brushSize,
                        isSnappable: false,
                    },
                    { strokeColour: [this.colours.value.fill] },
                );
                layer.addShape(this.ruler, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
            } else {
                this.ruler.refPoint = lastPoint;
                this.ruler.endPoint = lastPoint;
            }
            const points = this.shape.points;
            const props = getProperties(this.shape.id)!;
            if (props.blocksVision !== VisionBlock.No && points.length > 1) {
                visionState.insertConstraint(TriangulationTarget.VISION, this.shape, points.at(-2)!, points.at(-1)!);
                if (this.shape.floorId !== undefined) visionState.recalculateVision(this.shape.floorId);
            }
            if (props.blocksMovement && points.length > 1) {
                visionState.insertConstraint(TriangulationTarget.MOVEMENT, this.shape, points.at(-2)!, points.at(-1)!);
                if (this.shape.floorId !== undefined) visionState.recalculateMovement(this.shape.floorId);
            }

            layer.invalidate(false);
            if (!this.shape.preventSync) sendShapeSizeUpdate({ shape: this.shape, temporary: true });
        }

        // Finalize the text shape
        if (this.shape !== undefined && this.state.selectedShape === DrawShape.Text) {
            await this.finaliseShape();
        }
    }

    onMove(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        let endPoint = l2g(lp);
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return Promise.resolve();
        }

        if (event && playerSettingsState.useSnapping(event)) {
            let ignore = undefined;
            if (this.ruler) ignore = { shape: this.ruler };
            else if (this.shape) ignore = { shape: this.shape };
            [endPoint, this.snappedToPoint] = snapToPoint(this.getLayer()!, endPoint, ignore);
        } else this.snappedToPoint = false;

        if (this.pointer !== undefined) {
            this.pointer.refPoint = endPoint;
            const dl = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw)!;
            dl.invalidate(true);
        }

        if (this.brushHelper !== undefined) {
            this.brushHelper.r = this.helperSize;
            this.brushHelper.refPoint = endPoint;
            if (!this.active.value) layer.invalidate(false);
        }

        if (!this.active.value || this.startPoint === undefined || this.shape === undefined) return Promise.resolve();

        switch (this.state.selectedShape) {
            case DrawShape.Square: {
                const rect = this.shape as IRect;
                const newW = Math.abs(endPoint.x - this.startPoint.x);
                const newH = Math.abs(endPoint.y - this.startPoint.y);
                if ((newW === rect.w && newH === rect.h) || newW === 0 || newH === 0) return Promise.resolve();
                rect.w = newW;
                rect.h = newH;
                if (endPoint.x < this.startPoint.x || endPoint.y < this.startPoint.y) {
                    this.shape.refPoint = toGP(
                        Math.min(this.startPoint.x, endPoint.x),
                        Math.min(this.startPoint.y, endPoint.y),
                    );
                } else {
                    // Force proper refPoint after w/h modification
                    rect.refPoint = cloneP(this.startPoint);
                }
                break;
            }
            case DrawShape.Circle: {
                const circ = this.shape as ICircle;
                const newR = Math.abs(subtractP(endPoint, this.startPoint).length());
                if (circ.r === newR) return Promise.resolve();
                circ.r = newR;
                break;
            }
            case DrawShape.Brush: {
                const br = this.shape as Polygon;
                const points = br.points;
                if (equalPoints(points.at(-1)!, [endPoint.x, endPoint.y])) return Promise.resolve();
                br.pushPoint(endPoint, { simplifyEnd: true });
                break;
            }
            case DrawShape.Polygon: {
                this.ruler!.endPoint = endPoint;
                break;
            }
        }

        if (this.state.selectedShape !== DrawShape.Polygon) {
            const props = getProperties(this.shape.id)!;
            if (!this.shape.preventSync) sendShapeSizeUpdate({ shape: this.shape, temporary: true });
            if (props.blocksVision !== VisionBlock.No) {
                if (this.shape.floorId !== undefined) {
                    const vertices = visionState
                        .getCDT(TriangulationTarget.VISION, this.shape.floorId)
                        .tds.getTriagVertices(this.shape.id);
                    if (vertices.length > 1) {
                        visionState.deleteFromTriangulation({
                            target: TriangulationTarget.VISION,
                            shape: this.shape.id,
                        });
                    }
                    visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: this.shape.id });
                    visionState.recalculateVision(this.shape.floorId);
                }
            }
        }
        layer.invalidate(false);
        return Promise.resolve();
    }

    async onUp(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        if (
            !this.active.value ||
            this.shape === undefined ||
            (this.shape instanceof Polygon && this.state.selectedShape === DrawShape.Polygon)
        ) {
            return;
        }

        let endPoint = l2g(lp);
        if (event && playerSettingsState.useSnapping(event)) {
            const ignore = this.shape !== undefined ? { shape: this.shape } : undefined;
            [endPoint, this.snappedToPoint] = snapToPoint(this.getLayer()!, endPoint, ignore);
        } else this.snappedToPoint = false;

        // TODO: handle touch event different than altKey, long press
        if (
            event &&
            playerSettingsState.useSnapping(event) &&
            locationSettingsState.raw.useGrid.value &&
            !this.snappedToPoint
        ) {
            const props = getProperties(this.shape.id)!;
            if (props.blocksVision !== VisionBlock.No)
                visionState.deleteFromTriangulation({
                    target: TriangulationTarget.VISION,
                    shape: this.shape.id,
                });
            this.shape.resizeToGrid(this.shape.getPointIndex(endPoint, l2gz(5)), ctrlOrCmdPressed(event));
            if (props.blocksVision !== VisionBlock.No) {
                visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: this.shape.id });
                if (this.shape.floorId !== undefined) visionState.recalculateVision(this.shape.floorId);
            }
            if (props.blocksMovement) {
                visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: this.shape.id });
                if (this.shape.floorId !== undefined) visionState.recalculateMovement(this.shape.floorId);
            }
        }

        await this.finaliseShape();
    }

    async onContextMenu(event: MouseEvent): Promise<boolean> {
        if (
            this.active.value &&
            this.shape !== undefined &&
            this.state.selectedShape === DrawShape.Polygon &&
            this.shape instanceof Polygon
        ) {
            const layer = this.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return true;
            }
            layer.removeShape(this.ruler!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            this.ruler = undefined;
            if (this.state.isClosedPolygon) {
                const props = getProperties(this.shape.id)!;
                const points = this.shape.points;
                if (props.blocksVision !== VisionBlock.No && points.length > 1)
                    visionState.insertConstraint(TriangulationTarget.VISION, this.shape, points[0]!, points.at(-1)!);
                if (props.blocksMovement && points.length > 1)
                    visionState.insertConstraint(TriangulationTarget.MOVEMENT, this.shape, points[0]!, points.at(-1)!);
            }
            await this.finaliseShape();
        } else if (!this.active.value) {
            openDefaultContextMenu(event);
        }
        return true;
    }

    async onKeyUp(event: KeyboardEvent, features: ToolFeatures): Promise<void> {
        if (event.defaultPrevented) return;
        if (event.key === "Escape" && this.active.value) {
            let mouse: { x: number; y: number } | undefined = undefined;
            if (this.brushHelper !== undefined) {
                mouse = { x: this.brushHelper.refPoint.x, y: this.brushHelper.refPoint.y };
            }
            this.onDeselect();
            await this.onSelect(mouse);
            event.preventDefault();
        }
        await super.onKeyUp(event, features);
    }

    // BRUSH

    private createBrush(position: GlobalPoint, brushSize?: number): Circle {
        const size = brushSize ?? this.state.brushSize / 2;
        const brush = new Circle(
            position,
            size,
            {
                strokeWidth: Math.max(1, size * 0.05),
                isSnappable: false,
            },
            { fillColour: this.colours.value.fill, strokeColour: [mostReadable(this.colours.value.fill)] },
        );
        // Make sure we can see the border of the reveal brush
        brush.options.borderOperation = "source-over";
        return brush;
    }

    private createPointer(position: GlobalPoint): Polygon {
        const vertices = [toGP(0, 20), toGP(4.2, 12.6), toGP(12, 16)];
        const vec = Vector.fromArray(toArrayP(position));
        const pointer = new Polygon(
            position,
            vertices.map((v) => addP(v, vec)),
            {
                openPolygon: false,
                isSnappable: false,
            },
            { fillColour: "white", strokeColour: ["black"] },
        );
        // Make sure we can see the border of the reveal brush
        pointer.options.borderOperation = "source-over";
        pointer.ignoreZoomSize = true;
        return pointer;
    }

    private setupBrush(): void {
        if (this.brushHelper === undefined) return;
        if (this.state.selectedMode === DrawMode.Reveal || this.state.selectedMode === DrawMode.Hide) {
            this.brushHelper.options.preFogShape = true;
            this.brushHelper.options.skipDraw = true;
            propertiesSystem.setFillColour(this.brushHelper.id, "rgba(0, 0, 0, 1)", NO_SYNC);

            if (this.state.selectedMode === DrawMode.Reveal) this.brushHelper.globalCompositeOperation = "source-over";
            else if (this.state.selectedMode === DrawMode.Hide)
                this.brushHelper.globalCompositeOperation = "destination-out";
        } else {
            delete this.brushHelper.options.preFogShape;
            delete this.brushHelper.options.skipDraw;
            this.brushHelper.globalCompositeOperation = "source-over";
            propertiesSystem.setFillColour(this.brushHelper.id, this.colours.value.fill, NO_SYNC);
        }
        this.brushHelper.r = this.helperSize;
    }

    private pushBrushBack(): void {
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        const refPoint = this.brushHelper?.refPoint;
        const bs = this.brushHelper?.r;
        if (this.brushHelper !== undefined) {
            layer.removeShape(this.brushHelper, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
        }
        this.brushHelper = this.createBrush(toGP(-1000, -1000), bs);
        layer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL); // during mode change the shape is already added
        this.setupBrush();
        if (refPoint) this.brushHelper.refPoint = refPoint;
    }

    // LOGIC

    setDoorPermissions(permissions: Permissions): void {
        this.state.doorPermissions = permissions;
    }
}

export const drawTool = new DrawTool();
