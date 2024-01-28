import { ref } from "vue";

import { l2g } from "../../../core/conversions";
import { Ray, cloneP, equalsP, toGP } from "../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import { DEFAULT_GRID_SIZE, snapPointToGrid } from "../../../core/grid";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { LayerName } from "../../models/floor";
import { ToolName } from "../../models/tools";
import type { ITool, ToolFeatures, ToolPermission } from "../../models/tools";
import { Circle } from "../../shapes/variants/circle";
import { Line } from "../../shapes/variants/line";
import { Rect } from "../../shapes/variants/rect";
import { Text } from "../../shapes/variants/text";
import { accessSystem } from "../../systems/access";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { playerSystem } from "../../systems/players";
import { locationSettingsState } from "../../systems/settings/location/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

export enum RulerFeatures {
    All,
}

function getCellCenter(point: GlobalPoint): GlobalPoint {
    const gs = DEFAULT_GRID_SIZE;
    return toGP(Math.floor(point.x / gs) * gs + gs / 2, Math.floor(point.y / gs) * gs + gs / 2);
}

class RulerTool extends Tool implements ITool {
    readonly toolName = ToolName.Ruler;
    readonly toolTranslation = i18n.global.t("tool.Ruler");

    // REACTIVE PROPERTIES
    showPublic = ref(false);

    // NON REACTIVE PROPERTIES

    private startPoint: GlobalPoint | undefined = undefined;
    private rulers: Line[] = [];
    private text: Text | undefined = undefined;

    private currentLength = 0;
    private previousLength = 0;

    private highlightedCells: Rect[] = [];
    private highlightedCellss: Circle[] = [];

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    private get syncMode(): SyncMode {
        if (this.showPublic.value) return SyncMode.TEMP_SYNC;
        return SyncMode.NO_SYNC;
    }

    private createNewRuler(start: GlobalPoint, end: GlobalPoint): void {
        const ruler = new Line(
            start,
            end,
            {
                lineWidth: 5,
                isSnappable: false,
            },
            { strokeColour: [playerSettingsState.raw.rulerColour.value] },
        );
        ruler.ignoreZoomSize = true;

        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        accessSystem.addAccess(
            ruler.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: true },
            NO_SYNC,
        );
        layer.addShape(ruler, this.syncMode, InvalidationMode.NORMAL);
        this.rulers.push(ruler);
    }

    // EVENT HANDLERS

    onSelect(): Promise<void> {
        this.cleanup();
        return Promise.resolve();
    }

    onDeselect(): void {
        this.cleanup();
    }

    onDown(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        this.cleanup();
        this.startPoint = l2g(lp);

        if (event && playerSettingsState.useSnapping(event)) {
            const gridType = locationSettingsState.raw.gridType.value;
            [this.startPoint] = snapPointToGrid(this.startPoint, gridType, {
                snapDistance: Number.MAX_VALUE,
                includeCellCenter: true,
                includeEdgeCenters: true,
            });
        }

        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        if (layer === undefined) {
            console.log("No draw layer!");
            return Promise.resolve();
        }
        this.active.value = true;
        this.createNewRuler(cloneP(this.startPoint), cloneP(this.startPoint));
        this.text = new Text(
            cloneP(this.startPoint),
            "",
            20,
            {
                isSnappable: false,
            },
            { fillColour: "#000", strokeColour: ["#fff"] },
        );
        this.text.ignoreZoomSize = true;
        accessSystem.addAccess(
            this.text.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: true },
            NO_SYNC,
        );
        layer.addShape(this.text, this.syncMode, InvalidationMode.NORMAL);

        const cellCenter = getCellCenter(this.startPoint);
        const rect = new Rect(cellCenter, DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE, undefined, {
            fillColour: "lightblue",
        });
        rect.center = cellCenter;
        this.highlightedCells.push(rect);
        layer.addShape(rect, SyncMode.NO_SYNC, InvalidationMode.NORMAL);

        return Promise.resolve();
    }

    onMove(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
        let endPoint = l2g(lp);
        if (!this.active.value || this.rulers.length === 0 || this.startPoint === undefined || this.text === undefined)
            return Promise.resolve();

        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        if (layer === undefined) {
            console.log("No draw layer!");
            return Promise.resolve();
        }

        if (event && playerSettingsState.useSnapping(event)) {
            const gridType = locationSettingsState.raw.gridType.value;
            [endPoint] = snapPointToGrid(endPoint, gridType, {
                snapDistance: Number.MAX_VALUE,
                includeCellCenter: true,
                includeEdgeCenters: true,
            });
        }

        for (const shape of this.highlightedCells) {
            layer.removeShape(shape, { sync: SyncMode.NO_SYNC, recalculate: false, dropShapeId: true });
        }
        this.highlightedCells = [];
        for (const shape of this.highlightedCellss) {
            layer.removeShape(shape, { sync: SyncMode.NO_SYNC, recalculate: false, dropShapeId: true });
        }
        this.highlightedCellss = [];
        const ray = Ray.fromPoints(getCellCenter(this.startPoint), getCellCenter(endPoint));
        // const iterations = Math.round(ray.getDistance(0, ray.tMax) / DEFAULT_GRID_SIZE);
        const iterations = Math.round(
            Math.max(
                Math.abs(endPoint.x - this.startPoint.x) / DEFAULT_GRID_SIZE,
                Math.abs(endPoint.y - this.startPoint.y) / DEFAULT_GRID_SIZE,
            ),
        );
        const step = ray.tMax / iterations;
        for (let i = 0; i <= iterations; i++) {
            const cellCenter = getCellCenter(ray.get(step * i));
            const lastCenter = this.highlightedCells.at(-1)?.center;
            if (lastCenter !== undefined && equalsP(cellCenter, lastCenter)) continue;
            const rect = new Rect(cellCenter, DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE, undefined, {
                fillColour: "rgba(173, 216, 230, 0.25)",
            });
            rect.center = cellCenter;
            this.highlightedCells.push(rect);
            layer.addShape(rect, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        }
        for (let i = 0; i <= iterations; i++) {
            const blob = new Circle(ray.get(step * i), 5, undefined, { fillColour: "red" });
            this.highlightedCellss.push(blob);
            layer.addShape(blob, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        }

        const ruler = this.rulers.at(-1)!;
        ruler.endPoint = endPoint;
        sendShapePositionUpdate([ruler], true);

        const start = ruler.refPoint;
        const end = ruler.endPoint;

        const diffsign = Math.sign(end.x - start.x) * Math.sign(end.y - start.y);
        const xdiff = Math.abs(end.x - start.x);
        const ydiff = Math.abs(end.y - start.y);
        // let distance =
        // (Math.sqrt(xdiff ** 2 + ydiff ** 2) * locationSettingsState.raw.unitSize.value) / DEFAULT_GRID_SIZE;
        let distance = this.highlightedCells.length;
        this.currentLength = distance;
        distance += this.previousLength;

        // round to 1 decimal
        // const label =
        //     i18n.global.n(Math.round(10 * distance) / 10) + " " + locationSettingsState.raw.unitSizeUnit.value;
        const label =
            i18n.global.n(distance) +
            " (" +
            distance * locationSettingsState.raw.unitSize.value +
            " " +
            locationSettingsState.raw.unitSizeUnit.value +
            ")";
        const angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(start.x, end.x) + xdiff / 2;
        const ymid = Math.min(start.y, end.y) + ydiff / 2;
        this.text.refPoint = toGP(xmid, ymid);
        this.text.setText(label, SyncMode.TEMP_SYNC);
        this.text.angle = angle;
        sendShapePositionUpdate([this.text], true);

        layer.invalidate(true);
        return Promise.resolve();
    }

    onUp(): Promise<void> {
        this.cleanup();
        return Promise.resolve();
    }

    onKeyUp(event: KeyboardEvent, features: ToolFeatures): void {
        if (event.defaultPrevented) return;
        if (event.key === " " && this.active.value) {
            const lastRuler = this.rulers.at(-1)!;
            this.createNewRuler(lastRuler.endPoint, lastRuler.endPoint);
            this.previousLength += this.currentLength;

            const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
            if (layer === undefined) {
                console.log("No draw layer!");
                return;
            }

            layer.moveShapeOrder(
                this.text!,
                layer.size({ includeComposites: true, onlyInView: false }) - 1,
                SyncMode.TEMP_SYNC,
            );

            event.preventDefault();
        }
        super.onKeyUp(event, features);
    }

    // HELPERS

    private cleanup(): void {
        if (!this.active.value || this.rulers.length === 0 || this.startPoint === undefined || this.text === undefined)
            return;

        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active.value = false;

        for (const ruler of this.rulers) {
            layer.removeShape(ruler, { sync: this.syncMode, recalculate: true, dropShapeId: true });
        }
        layer.removeShape(this.text, { sync: this.syncMode, recalculate: true, dropShapeId: true });
        this.startPoint = this.text = undefined;
        this.rulers = [];
        this.previousLength = 0;
    }
}

export const rulerTool = new RulerTool();
