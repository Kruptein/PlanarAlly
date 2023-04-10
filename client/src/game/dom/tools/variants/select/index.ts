import type { GlobalPoint, LocalPoint } from "../../../../../core/geometry";
import { i18n } from "../../../../../i18n";
import type { ISelectTool, ToolFeatures, ToolPermission } from "../../../../core/models/tools";
import { ToolMode, ToolName } from "../../../../core/models/tools";
import { postRender } from "../../../../messages/render";
import { getPressedModifiers } from "../../../input/events";
import { SelectFeatures } from "../../models/select";
import { Tool } from "../../tool";
import { getFeatures } from "../../tools";
import { RulerFeatures } from "../ruler";

// const toast = useToast();

const rulerPermission = { name: ToolName.Ruler, features: { enabled: [RulerFeatures.All] }, early: true };

// const { _, _$ } = selectToolState;

class SelectTool extends Tool implements ISelectTool {
    readonly toolName = ToolName.Select;
    readonly toolTranslation = i18n.global.t("tool.Select");

    // NON REACTIVE PROPERTIES

    // lastMousePosition = toGP(0, 0);

    // polygon-edit related
    // polygonTracer: Circle | null = null;

    private permittedTools_: ToolPermission[] = [];

    get permittedTools(): ToolPermission[] {
        return this.permittedTools_;
    }

    // constructor() {
    // super();

    // Zoom changes
    // watch(
    //     () => positionState.reactive.zoomDisplay,
    //     () => {
    //         if (this.rotationUiActive) {
    //             this.resetRotationHelper();
    //         }
    //     },
    // );

    // Selection changes
    // watchEffect(() => {
    //     const selection = selectedSystem.$.value;

    //     // rotation logic
    //     if (selection.size === 0) {
    //         this.removeRotationUi();
    //     }

    //     // polygon edit ui logic
    //     if (this.active.value || selection.size !== 1) {
    //         this.removePolygonEditUi();
    //     } else {
    //         const features = getFeatures(this.toolName);
    //         if (this.hasFeature(SelectFeatures.PolygonEdit, features)) {
    //             const uuid = [...selection.values()][0];
    //             if (uuid && getShape(uuid)!.type === "polygon") {
    //                 return this.createPolygonEditUi();
    //             }
    //         }
    //         this.removePolygonEditUi();
    //     }
    // });
    // }

    checkRuler(): boolean {
        // const rulerEnabled = this.permittedTools_.some((t) => t.name === ToolName.Ruler);
        // if (_$.showRuler && _$.hasSelection) {
        //     if (!rulerEnabled) {
        //         this.permittedTools_.push(rulerPermission);
        //         return true;
        //     }
        // } else if (rulerEnabled) {
        //     this.permittedTools_ = this.permittedTools_.filter((t) => t.name !== ToolName.Ruler);
        // }
        return false;
    }

    async onToolsModeChange(mode: ToolMode, features: ToolFeatures<SelectFeatures>): Promise<void> {
        if (mode === ToolMode.Play) {
            document.body.style.cursor = "default";
            await postRender("Tool.Select.Rotation.Ui", { show: false });
            //     this.removePolygonEditUi();
        } else {
            if (this.hasFeature(SelectFeatures.Rotate, features)) {
                await postRender("Tool.Select.Rotation.Ui", { show: true, features });
            }
            //     if (this.hasFeature(SelectFeatures.PolygonEdit, features)) {
            //         this.createPolygonEditUi();
            //     }
        }
    }

    onPanStart(): void {
        // if (this.polygonTracer !== null) _$.polygonUiVisible = "hidden";
    }

    onPanEnd(): void {
        // if (this.polygonTracer !== null) {
        //     this.updatePolygonEditUi(this.polygonTracer.refPoint);
        //     _$.polygonUiVisible = "visible";
        // }
    }

    async onDeselect(): Promise<void> {
        await postRender("Tool.Select.Rotation.Ui", { show: false });
        // this.removePolygonEditUi();
    }

    async onSelect(): Promise<void> {
        const features = getFeatures(this.toolName);
        // if (this.hasFeature(SelectFeatures.PolygonEdit, features)) {
        //     this.createPolygonEditUi();
        //     _$.polygonUiVisible = "hidden";
        // }
        if (this.hasFeature(SelectFeatures.Rotate, features)) {
            await postRender("Tool.Select.Rotation.Ui", { show: true, features });
        }
    }

    // INPUT HANDLERS

    async onDown(
        lp: LocalPoint,
        event: MouseEvent | TouchEvent | undefined,
        features: ToolFeatures<SelectFeatures>,
    ): Promise<void> {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) return;

        await postRender("Tool.Select.Down", { lp, features, pressed: getPressedModifiers(event) });
    }

    async onMove(
        lp: LocalPoint,
        event: MouseEvent | TouchEvent | undefined,
        features: ToolFeatures<SelectFeatures>,
    ): Promise<void> {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) return;

        // todo: see if we can do some prefiltering here to skip sending every move to worker
        await postRender("Tool.Select.Move", { lp, features, pressed: getPressedModifiers(event) });
    }

    async onUp(
        lp: LocalPoint,
        event: MouseEvent | TouchEvent | undefined,
        features: ToolFeatures<SelectFeatures>,
    ): Promise<void> {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) {
            //     // When using pan during select, the dragray will use a wrong lp to to the drag calculation in move
            //     // Maybe consider using a gp for the ray instead to avoid this in the future ?
            //     this.dragRay = Ray.fromPoints(this.dragRay.origin, lp);
            return;
        }
        if (!this.active.value) return;
        this.active.value = false;

        await postRender("Tool.Select.Up", { lp, features, pressed: getPressedModifiers(event) });
    }

    onContextMenu(event: MouseEvent, features: ToolFeatures<SelectFeatures>): Promise<boolean> {
        // if (!this.hasFeature(SelectFeatures.Context, features)) return Promise.resolve(true);
        // if (floorState.currentLayer.value === undefined) {
        //     console.log("No active layer!");
        //     return Promise.resolve(true);
        // }
        // const layer = floorState.currentLayer.value;
        // const layerSelection = selectedSystem.get({ includeComposites: false });
        // const mouse = getLocalPointFromEvent(event);
        // const globalMouse = l2g(mouse);
        // for (const shape of layerSelection) {
        //     if (shape.contains(globalMouse)) {
        //         layer.invalidate(true);
        //         openShapeContextMenu(event);
        //         return Promise.resolve(true);
        //     }
        // }
        // // Check if any other shapes are under the mouse
        // for (let i = layer.size({ includeComposites: false }) - 1; i >= 0; i--) {
        //     const shape = layer.getShapes({ includeComposites: false })[i];
        //     if (shape?.contains(globalMouse) === true) {
        //         selectedSystem.set(shape.id);
        //         layer.invalidate(true);
        //         openShapeContextMenu(event);
        //         return Promise.resolve(true);
        //     }
        // }
        // // Fallback to default context menu
        // openDefaultContextMenu(event);
        // return Promise.resolve(true);
    }

    onKeyUp(event: KeyboardEvent, features: ToolFeatures): Promise<void> {
        if (event.defaultPrevented) return Promise.resolve();
        if (event.key === " " && this.active.value) {
            event.preventDefault();
        }
        super.onKeyUp(event, features);
        return Promise.resolve();
    }

    // ROTATION

    resetRotationHelper(): void {
        // selectTool.removeRotationUi();
        // if (activeToolMode.value === ToolMode.Build) {
        //     selectTool.createRotationUi({});
        // }
    }

    // POLYGON EDIT

    createPolygonEditUi(): void {
        // const selection = selectedSystem.get({ includeComposites: false });
        // if (selection.length !== 1 || selection[0]!.type !== "polygon") return;
        // this.removePolygonEditUi();
        // this.polygonTracer = new Circle(
        //     toGP(0, 0),
        //     3,
        //     {
        //         isSnappable: false,
        //     },
        //     { fillColour: "rgba(0,0,0,0)", strokeColour: ["black"] },
        // );
        // const drawLayer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw)!;
        // drawLayer.addShape(this.polygonTracer, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        // this.updatePolygonEditUi(this.lastMousePosition);
        // drawLayer.invalidate(true);
    }

    removePolygonEditUi(): void {
        // if (this.polygonTracer !== null) {
        //     const drawLayer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw)!;
        //     drawLayer.removeShape(this.polygonTracer, {
        //         sync: SyncMode.NO_SYNC,
        //         recalculate: false,
        //         dropShapeId: true,
        //     });
        //     drawLayer.invalidate(true);
        //     this.polygonTracer = null;
        //     _$.polygonUiVisible = "hidden";
        // }
    }

    updatePolygonEditUi(gp: GlobalPoint): void {
        // if (this.polygonTracer === null) return;
        // const selection = selectedSystem.get({ includeComposites: false });
        // const polygon = selection[0] as Polygon;
        // const pw = g2lz(polygon.lineWidth[0]!);
        // const pv = polygon.vertices;
        // let smallest = { distance: polygon.lineWidth[0]! * 2, nearest: gp, angle: 0, point: false };
        // for (let i = 1; i < pv.length; i++) {
        //     const prevVertex = pv[i - 1]!;
        //     const vertex = pv[i]!;
        //     // check prev-vertex
        //     if (getPointDistance(prevVertex, gp) < polygon.lineWidth[0]! / 1.5) {
        //         const vec = Vector.fromPoints(prevVertex, vertex);
        //         let angle;
        //         if (i === 1) {
        //             angle = vec.deg();
        //         } else {
        //             const between = getAngleBetween(Vector.fromPoints(prevVertex, pv[i - 2]!), vec) / 2;
        //             angle = (Math.abs(between) < Math.PI / 2 ? 1 : -1) * 90 - toDegrees(-vec.angle() + between);
        //         }
        //         smallest = { distance: 0, nearest: prevVertex, point: true, angle };
        //         break;
        //     }
        //     // check edge
        //     const info = getDistanceToSegment(gp, [prevVertex, vertex]);
        //     if (info.distance < polygon.lineWidth[0]! / 1.5 && info.distance < smallest.distance) {
        //         smallest = { ...info, angle: Vector.fromPoints(prevVertex, vertex).deg(), point: false };
        //     }
        // }
        // //check last vertex
        // if (getPointDistance(pv.at(-1)!, gp) < polygon.lineWidth[0]! / 2) {
        //     smallest = { distance: 0, nearest: pv.at(-1)!, point: true, angle: smallest.angle };
        // }
        // // Show the UI
        // if (smallest.distance <= polygon.lineWidth[0]!) {
        //     _$.polygonUiVisible = "visible";
        //     this.polygonTracer.refPoint = smallest.nearest;
        //     this.polygonTracer.layer?.invalidate(true);
        //     const lp = g2l(smallest.nearest);
        //     const radians = toRadians(smallest.angle);
        //     _$.polygonUiLeft = `${lp.x - 25}px`;
        //     _$.polygonUiTop = `${lp.y - 25 / 2}px`;
        //     _$.polygonUiAngle = `${smallest.angle}deg`;
        //     // 12.5 + pw/2 is the exact border, additional scaling to give a bit of air
        //     _$.polygonUiSizeX = `${-Math.sin(radians) * (15 + (1.5 * pw) / 2)}px`;
        //     _$.polygonUiSizeY = `${Math.cos(radians) * (15 + (1.5 * pw) / 2)}px`;
        //     _$.polygonUiVertex = smallest.point;
        // }
    }
}

export const selectTool = new SelectTool();
