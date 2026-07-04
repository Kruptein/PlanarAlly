import type { IconName } from "@fortawesome/fontawesome-svg-core";
import { reactive, watch } from "vue";

import { g2l, l2g, l2gz } from "../../../core/conversions";
import { addP, cloneP, subtractP, toArrayP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import type { LocalId } from "../../../core/id";
import { InvalidationMode, NO_SYNC, SERVER_SYNC, SyncMode, UI_SYNC } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { sendShapePositionUpdate, sendShapeSizeUpdate } from "../../api/emits/shape/core";
import { getAllShapes, getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { LayerName } from "../../models/floor";
import { ToolName } from "../../models/tools";
import type { ITool, ToolFeatures, ToolPermission } from "../../models/tools";
import { overrideLastOperation } from "../../operations/undo";
import { fromSystemForm } from "../../shapes/transformations";
import { FontAwesomeIcon } from "../../shapes/variants/fontAwesomeIcon";
import { Line } from "../../shapes/variants/line";
import { Polygon } from "../../shapes/variants/polygon";
import { accessSystem } from "../../systems/access";
import { auraSystem } from "../../systems/auras";
import type { Aura } from "../../systems/auras/models";
import { generateAuraId } from "../../systems/auras/utils";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { playerSystem } from "../../systems/players";
import { propertiesSystem } from "../../systems/properties";
import { TriangulationTarget, visionState } from "../../vision/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

export enum LightMode {
    PointLight = "point-light",
    Ambient = "ambient",
    Barrier = "barrier",
}

const MODE_ICONS: Record<LightMode, IconName> = {
    [LightMode.PointLight]: "lightbulb",
    [LightMode.Ambient]: "sun",
    [LightMode.Barrier]: "circle-half-stroke",
};

const CURSOR_ICON_SIZE = 20;
const SNAP_DISTANCE = 20;
const SNAP_DOT_RADIUS = 4;

class LightTool extends Tool implements ITool {
    readonly toolName = ToolName.Light;
    readonly toolTranslation = i18n.global.t("tool.Light");

    state = reactive({
        interactionMode: "place" as "place" | "edit",
        mode: LightMode.PointLight as LightMode,
        barrierActive: false,
        selectedShape: undefined as LocalId | undefined,
        selectedShapeMode: undefined as LightMode | undefined,
        pointLight: {
            create: {
                brightRadius: 20,
                dimRadius: 20,
                colour: "rgba(255, 255, 200, 0.6)",
                angle: 360,
            },
            edit: {
                brightRadius: 0,
                dimRadius: 0,
                colour: "",
                angle: 360,
            },
        },
    });

    private barrierShape: Polygon | undefined;
    private ruler: Line | undefined;
    private cursorIcon: FontAwesomeIcon | undefined;
    private pointer: Polygon | undefined;
    private modeWatchStop: (() => void) | undefined;
    private interactionModeWatchStop: (() => void) | undefined;
    private floorWatchStop: (() => void) | undefined;
    private snapPoints: GlobalPoint[] = [];
    private snappedPoint: GlobalPoint | undefined;
    private dragStartOffset: { x: number; y: number } | undefined;

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    onSelect(): Promise<void> {
        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        if (drawLayer === undefined) return Promise.resolve();

        this.state.interactionMode = "place";
        this.createCursorIcon(toGP(-1000, -1000));
        drawLayer.registerDrawCallback(this.drawLightShapesCb);

        this.modeWatchStop = watch(
            () => this.state.mode,
            (newMode, oldMode) => {
                const oldPos = this.cursorIcon?.refPoint ?? this.pointer?.refPoint;
                this.removeCursorIcon();
                this.createCursorIcon(oldPos ?? toGP(-1000, -1000));
                if (newMode === LightMode.Barrier) {
                    this.showSnapIndicators();
                } else if (oldMode === LightMode.Barrier) {
                    this.removeSnapIndicators();
                    this.snappedPoint = undefined;
                }
            },
        );

        this.interactionModeWatchStop = watch(
            () => this.state.interactionMode,
            () => {
                if (this.state.interactionMode === "edit") {
                    this.removeCursorIcon();
                } else {
                    this.createCursorIcon(toGP(-1000, -1000));
                }
            },
        );

        this.floorWatchStop = watch(
            () => floorState.currentFloor.value,
            () => {
                this.deselectShape();
            },
        );

        if (this.state.mode === LightMode.Barrier) {
            this.showSnapIndicators();
        }

        return Promise.resolve();
    }

    onDeselect(): void {
        this.modeWatchStop?.();
        this.floorWatchStop?.();
        this.interactionModeWatchStop?.();
        this.removeCursorIcon();
        this.removeSnapIndicators();
        this.deselectShape();
        this.state.interactionMode = "place";

        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        drawLayer?.unregisterDrawCallback(this.drawLightShapesCb);

        this.cleanupBarrier();
    }

    onDown(lp: LocalPoint): Promise<void> {
        const gp = l2g(lp);

        if (this.state.interactionMode === "edit") {
            const hit = this.findShapeAt(gp);
            this.state.selectedShapeMode = hit?.mode;
            if (hit !== undefined) {
                this.selectShape(hit.shape);
                this.dragStartOffset = subtractP(gp, hit.shape.center);
            } else if (this.state.selectedShape !== undefined) {
                this.deselectShape();
            }
            floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw)?.invalidate(true);
        } else {
            switch (this.state.mode) {
                case LightMode.PointLight:
                case LightMode.Ambient: {
                    this.placeLight(gp, this.state.mode === LightMode.Ambient);
                    break;
                }
                case LightMode.Barrier:
                    if (!this.active.value) {
                        if (this.snappedPoint !== undefined) {
                            this.barrierDown(this.snappedPoint);
                        }
                    } else if (this.snappedPoint !== undefined) {
                        this.barrierShape?.pushPoint(cloneP(this.snappedPoint));
                        this.finaliseBarrier();
                    } else {
                        this.barrierDown(gp);
                    }
                    break;
            }
        }
        return Promise.resolve();
    }

    onMove(lp: LocalPoint): Promise<void> {
        const gp = l2g(lp);

        if (this.state.interactionMode === "edit") {
            if (this.state.selectedShapeMode === LightMode.Barrier) return Promise.resolve();
            if (this.dragStartOffset !== undefined && this.state.selectedShape !== undefined) {
                const shape = getShape(this.state.selectedShape);
                if (shape) {
                    shape.center = toGP(gp.x - this.dragStartOffset.x, gp.y - this.dragStartOffset.y);
                    shape.invalidate(false);
                }
                return Promise.resolve();
            }
        }

        let targetPoint = gp;

        if (this.state.mode === LightMode.Barrier) {
            const [snapPoint, snapped] = this.findNearestSnapPoint(gp);
            this.snappedPoint = snapped ? snapPoint : undefined;
            targetPoint = snapped ? snapPoint : gp;

            if (this.active.value && this.ruler !== undefined) {
                this.ruler.endPoint = gp;
            }
        }
        if (this.cursorIcon !== undefined) {
            this.cursorIcon.center = targetPoint;
            const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
            drawLayer?.invalidate(true);
        }
        if (this.pointer !== undefined) {
            this.pointer.refPoint = targetPoint;
            const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
            drawLayer?.invalidate(true);
        }
        return Promise.resolve();
    }

    onUp(): Promise<void> {
        if (this.dragStartOffset !== undefined && this.state.selectedShape !== undefined) {
            const shape = getShape(this.state.selectedShape);
            if (shape) {
                sendShapePositionUpdate([shape], false);
                const floor = floorState.currentFloor.value;
                if (floor) {
                    visionState.recalculateVision(floor.id);
                    floorSystem.getLayer(floor, LayerName.Tokens)?.invalidate(false);
                    floorSystem.getLayer(floor, LayerName.Lighting)?.invalidate(false);
                }
            }
        }
        this.dragStartOffset = undefined;
        return Promise.resolve();
    }

    onContextMenu(_event: MouseEvent, _features: ToolFeatures): Promise<boolean> {
        if (this.state.mode === LightMode.Barrier && this.active.value) {
            return Promise.resolve(false);
        }
        return Promise.resolve(true);
    }

    async onKeyUp(event: KeyboardEvent, features: ToolFeatures): Promise<void> {
        if (event.defaultPrevented) return;
        if (event.key === "Escape") {
            if (this.state.selectedShape !== undefined) {
                this.deselectShape();
                event.preventDefault();
                return;
            }
            if (this.state.interactionMode === "edit") {
                this.setInteractionMode("place");
                event.preventDefault();
                return;
            }
            if (this.active.value && this.state.mode === LightMode.Barrier) {
                this.cleanupBarrier();
                event.preventDefault();
                return;
            }
        }
        await super.onKeyUp(event, features);
    }

    // ---- LIGHTS ----
    // always placed on the token layer to en sure colours are setup correctly

    private placeLight(gp: GlobalPoint, floodLight: boolean): void {
        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Tokens);
        if (layer === undefined) return;

        const settings = floodLight
            ? {
                  brightRadius: 0,
                  dimRadius: 0,
                  colour: "rgba(0, 0, 0, 0)",
                  angle: 360,
              }
            : this.state.pointLight.create;

        const iconName: IconName = floodLight ? "sun" : "lightbulb";
        const shape = new FontAwesomeIcon(
            { prefix: "fas", iconName },
            gp,
            (this.state.mode === LightMode.Ambient ? 2 : 1) * CURSOR_ICON_SIZE,
            {
                isSnappable: false,
                strokeWidth: 15,
            },
            { fillColour: "white", strokeColour: ["#000"] },
        );
        propertiesSystem.setName(shape.id, floodLight ? "flood light" : "light source", NO_SYNC);

        shape.options.lightShape = true;
        shape.options.skipDraw = true;
        shape.ignoreZoomSize = true;

        const aura: Aura = {
            uuid: generateAuraId(),
            active: true,
            visionSource: true,
            visible: true,
            name: floodLight ? "flood light" : "light",
            value: settings.brightRadius,
            dim: settings.dimRadius,
            colour: settings.colour,
            borderColour: "rgba(0, 0, 0, 0)",
            angle: settings.angle,
            direction: 0,
            floodLight,
        };

        layer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);

        auraSystem.add(shape.id, aura, SERVER_SYNC);
        accessSystem.addAccess(
            shape.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: false },
            SERVER_SYNC,
        );

        shape.center = gp;

        visionState.recalculateVision(layer.floor);
        layer.invalidate(false);
        floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Lighting)?.invalidate(false);
        floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw)?.invalidate(true);
    }

    // ---- BARRIERS ----
    // these are placed on the lighting layer

    private barrierDown(gp: GlobalPoint): void {
        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Lighting);
        if (layer === undefined) return;

        if (!this.active.value) {
            this.active.value = true;
            this.state.barrierActive = true;
            this.barrierShape = new Polygon(
                cloneP(gp),
                [],
                { openPolygon: true },
                { fillColour: "rgba(0, 0, 0, 1)", strokeColour: ["rgba(0, 0, 0, 1)"] },
            );
            this.barrierShape.options.ambientBarrier = true;
            this.barrierShape.options.skipDraw = true;
            propertiesSystem.setFillColour(this.barrierShape.id, "rgba(0, 0, 0, 1)", NO_SYNC);

            accessSystem.addAccess(
                this.barrierShape.id,
                playerSystem.getCurrentPlayer()!.name,
                { edit: true, movement: true, vision: false },
                UI_SYNC,
            );

            layer.addShape(this.barrierShape, SyncMode.FULL_SYNC, InvalidationMode.NO);
        } else if (this.barrierShape !== undefined) {
            this.barrierShape.pushPoint(cloneP(gp));
        }

        if (this.ruler !== undefined) {
            this.ruler.refPoint = gp;
            this.ruler.endPoint = gp;
        } else {
            this.ruler = new Line(gp, gp, { isSnappable: false }, { strokeColour: ["rgba(255,0,0,1)"] });
            const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
            drawLayer?.addShape(this.ruler, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        }

        layer.invalidate(false);
        if (this.barrierShape && !this.barrierShape.preventSync)
            sendShapeSizeUpdate({ shape: this.barrierShape, temporary: true });
    }

    private finaliseBarrier(): void {
        if (this.barrierShape === undefined) return;

        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Lighting);
        if (layer === undefined) return;
        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);

        if (this.ruler !== undefined) {
            drawLayer?.removeShape(this.ruler, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            this.ruler = undefined;
        }

        if (this.barrierShape.points.length <= 1) {
            layer.removeShape(this.barrierShape, { sync: SyncMode.FULL_SYNC, recalculate: true, dropShapeId: true });
        } else {
            sendShapeSizeUpdate({ shape: this.barrierShape, temporary: false });
            overrideLastOperation({
                type: "shapeadd",
                shapes: [fromSystemForm(this.barrierShape.id)],
                floor: this.barrierShape.floor!.name,
                layerName: this.barrierShape.layer!.name,
            });
        }

        this.barrierShape = undefined;
        this.active.value = false;
        this.state.barrierActive = false;
        visionState.recalculateVision(floorState.currentFloor.value!.id);
        layer.invalidate(false);
        drawLayer?.invalidate(true);
    }

    private cleanupBarrier(): void {
        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Lighting);
        if (layer === undefined) return;
        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);

        if (this.ruler !== undefined) {
            drawLayer?.removeShape(this.ruler, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            this.ruler = undefined;
        }
        if (this.active.value && this.barrierShape !== undefined) {
            layer.removeShape(this.barrierShape, { sync: SyncMode.FULL_SYNC, recalculate: true, dropShapeId: true });
            this.barrierShape = undefined;
            this.active.value = false;
            this.state.barrierActive = false;
        }
        layer.invalidate(false);
        drawLayer?.invalidate(true);
    }

    // --- Light Shape Management ---

    setInteractionMode(mode: "place" | "edit"): void {
        if (this.state.interactionMode === mode) return;
        this.deselectShape();
        this.state.interactionMode = mode;

        if (mode === "edit") {
            this.removeCursorIcon();
        } else {
            this.createCursorIcon(toGP(-1000, -1000));
        }
    }

    private findShapeAt(gp: GlobalPoint): { shape: IShape; mode: LightMode } | undefined {
        const floor = floorState.currentFloor.value;
        if (!floor) return undefined;

        const hitRadius = l2gz(CURSOR_ICON_SIZE) ** 2;
        let closest: { shape: IShape; mode: LightMode } | undefined;
        let closestDist = Infinity;

        const tokenLayer = floorSystem.getLayer(floor, LayerName.Tokens)!;
        const lightingLayer = floorSystem.getLayer(floor, LayerName.Lighting)!;

        for (const shape of [...tokenLayer.shapesInSector, ...lightingLayer.shapesInSector]) {
            if (shape.options.lightShape !== true && shape.options.ambientBarrier !== true) continue;
            const dist = subtractP(gp, shape.center).squaredLength();
            if (dist < closestDist) {
                closestDist = dist;
                let mode = LightMode.PointLight;
                if (shape.options.ambientBarrier === true) mode = LightMode.Barrier;
                else if (auraSystem.getAll(shape.id)?.[0]?.floodLight === true) mode = LightMode.Ambient;
                closest = { shape, mode };
            }
        }

        if (closest !== undefined && closestDist < hitRadius) return closest;
        return undefined;
    }

    selectShape(shape: IShape): void {
        if (this.state.selectedShape !== undefined) {
            const prev = getShape(this.state.selectedShape);
            if (prev) {
                prev.showHighlight = false;
                prev.invalidate(true);
            }
        }

        this.state.selectedShape = shape.id;

        shape.showHighlight = true;
        shape.invalidate(true);

        if (shape.options.lightShape === true) {
            const auras = auraSystem.getAll(shape.id);
            if (auras.length > 0) {
                const aura = auras[0]!;
                this.state.pointLight.edit.brightRadius = aura.value;
                this.state.pointLight.edit.dimRadius = aura.dim;
                this.state.pointLight.edit.colour = aura.colour;
                this.state.pointLight.edit.angle = aura.angle;
            }
        }
    }

    deselectShape(): void {
        if (this.state.selectedShape === undefined) return;
        const shape = getShape(this.state.selectedShape);
        this.state.selectedShape = undefined;
        if (!shape) return;

        shape.showHighlight = false;
        shape.invalidate(true);
        floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw)?.invalidate(true);
    }

    deleteShape(): void {
        if (this.state.selectedShape === undefined) return;

        const shape = getShape(this.state.selectedShape);
        this.state.selectedShape = undefined;
        if (!shape) return;

        shape.layer?.removeShape(shape, { sync: SyncMode.FULL_SYNC, recalculate: true, dropShapeId: true });

        const floor = floorState.currentFloor.value;
        if (floor) {
            visionState.recalculateVision(floor.id);
            floorSystem.getLayer(floor, LayerName.Draw)?.invalidate(true);
        }
    }

    updateSelectedLightAura(): void {
        if (this.state.selectedShape === undefined) return;
        const auras = auraSystem.getAll(this.state.selectedShape);
        if (auras.length === 0) return;
        const e = this.state.pointLight.edit;
        auraSystem.update(
            this.state.selectedShape,
            auras[0]!.uuid,
            {
                value: e.brightRadius,
                dim: e.dimRadius,
                colour: e.colour,
                angle: e.angle,
            },
            SERVER_SYNC,
        );
    }

    // --- Mouse styles ---

    private createCursorIcon(position: GlobalPoint): void {
        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        if (drawLayer === undefined) return;

        let shape: IShape | undefined;

        if (this.state.mode === LightMode.Barrier) {
            const vertices = [toGP(0, 20), toGP(4.2, 12.6), toGP(12, 16)];
            const vec = Vector.fromArray(toArrayP(position));
            this.pointer = new Polygon(
                position,
                vertices.map((v) => addP(v, vec)),
                { openPolygon: false, isSnappable: false },
                { fillColour: "white", strokeColour: ["black"] },
            );
            shape = this.pointer;
        } else {
            this.cursorIcon = new FontAwesomeIcon(
                { prefix: "fas", iconName: MODE_ICONS[this.state.mode] },
                position,
                (this.state.mode === LightMode.Ambient ? 2 : 1) * CURSOR_ICON_SIZE,
                { isSnappable: false, strokeWidth: 15 },
                { fillColour: "#82c8a0", strokeColour: ["#000"] },
            );
            shape = this.cursorIcon;
        }
        console.log("adding shape", shape);
        shape.ignoreZoomSize = true;
        shape.options.borderOperation = "source-over";
        drawLayer.addShape(shape, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        drawLayer.canvas.parentElement!.style.cursor = "none";
        drawLayer.invalidate(true);
    }

    private removeCursorIcon(): void {
        const shape = this.cursorIcon ?? this.pointer;
        if (shape === undefined) return;
        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        console.log("removing shape", shape);
        drawLayer?.removeShape(shape, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
        drawLayer?.canvas.parentElement!.style.removeProperty("cursor");
        this.cursorIcon = undefined;
        this.pointer = undefined;
        drawLayer?.invalidate(true);
    }

    // --- Snap Points ---

    private getVisionBlockerPoints(): GlobalPoint[] {
        const floor = floorState.currentFloor.value!;
        const blockers = visionState.getBlockers(TriangulationTarget.VISION, floor.id);
        const points: GlobalPoint[] = [];

        for (const blockerId of blockers) {
            const shape = getShape(blockerId);
            if (shape === undefined) continue;
            for (const pt of shape.points) {
                points.push(toGP(pt[0], pt[1]));
            }
        }
        return points;
    }

    private showSnapIndicators(): void {
        this.removeSnapIndicators();
        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        if (drawLayer === undefined) return;

        this.snapPoints = this.getVisionBlockerPoints();
        drawLayer.registerDrawCallback(this.drawSnapCb);
        drawLayer.invalidate(true);
    }

    private removeSnapIndicators(): void {
        if (this.snapPoints.length === 0) return;
        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        drawLayer?.unregisterDrawCallback(this.drawSnapCb);
        this.snapPoints = [];
        drawLayer?.invalidate(true);
    }

    private findNearestSnapPoint(gp: GlobalPoint): [GlobalPoint, boolean] {
        const snapDistance = l2gz(SNAP_DISTANCE);
        let closest: GlobalPoint | undefined;
        let closestDist = Infinity;

        for (const pt of this.snapPoints) {
            const dist = subtractP(gp, pt).length();
            if (dist < closestDist) {
                closestDist = dist;
                closest = pt;
            }
        }

        if (closest !== undefined && closestDist < snapDistance) {
            return [closest, true];
        }
        return [gp, false];
    }

    // ---- RENDER CALLBACKS ----
    // arrow notation to not need a bind

    private readonly drawLightShapesCb = (ctx: CanvasRenderingContext2D): void => {
        const floorId = floorState.currentFloor.value?.id;
        if (floorId === undefined) return;
        for (const shape of getAllShapes()) {
            if (shape.floorId !== floorId) continue;
            if (shape.options.lightShape === true || shape.options.ambientBarrier === true) {
                shape.draw(ctx, false);
            }
        }
    };

    private readonly drawSnapCb = (ctx: CanvasRenderingContext2D): void => {
        if (this.snapPoints.length === 0) return;
        ctx.fillStyle = "rgba(130, 200, 160, 0.7)";
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(130, 200, 160, 0.7)";
        ctx.globalCompositeOperation = "source-over";
        for (const pt of this.snapPoints) {
            const lp = g2l(pt);
            ctx.beginPath();
            ctx.arc(lp.x, lp.y, SNAP_DOT_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    };
}

export const lightTool = new LightTool();
