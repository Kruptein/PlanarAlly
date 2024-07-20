import tinycolor from "tinycolor2";
import { computed, ref } from "vue";

import { l2g } from "../../../core/conversions";
import { Ray, cloneP, equalsP, toArrayP, toGP } from "../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import {
    DEFAULT_GRID_SIZE,
    getCellCenter,
    getCellDistance,
    getCellFromPoint,
    getCellVertices,
    getClosestCellCenter,
    snapPointToGrid,
} from "../../../core/grid";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import type { ILayer } from "../../interfaces/layer";
import { LayerName } from "../../models/floor";
import { ToolName } from "../../models/tools";
import type { ITool, ToolFeatures, ToolPermission } from "../../models/tools";
import { drawPolygon } from "../../rendering/basic";
import { Line } from "../../shapes/variants/line";
import { Text } from "../../shapes/variants/text";
import { accessSystem } from "../../systems/access";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { playerSystem } from "../../systems/players";
import { locationSettingsState } from "../../systems/settings/location/state";
import { GridModeLabelFormat } from "../../systems/settings/players/models";
import { playerSettingsState } from "../../systems/settings/players/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

export enum RulerFeatures {
    All,
}

const gridHighlightColours = computed(() => {
    const rulerColour = tinycolor(playerSettingsState.reactive.rulerColour.value);
    const alpha = rulerColour.getAlpha();
    return {
        default: rulerColour.setAlpha(alpha * 0.25).toRgbString(),
        start: rulerColour.setAlpha(alpha * 0.75).toRgbString(),
    };
});

class RulerTool extends Tool implements ITool {
    readonly toolName = ToolName.Ruler;
    readonly toolTranslation = i18n.global.t("tool.Ruler");

    // REACTIVE PROPERTIES
    showPublic = ref(false);
    gridMode = ref(false);

    // NON REACTIVE PROPERTIES

    private startPoint: GlobalPoint | undefined = undefined;
    private rulers: { ruler: Line; cells: GlobalPoint[] }[] = [];
    private text: Text | undefined = undefined;

    private currentLength = 0;
    private currentCellDistance = 0;
    private previousLength = 0;
    private previousCellDistance = 0;

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
        this.rulers.push({ ruler, cells: [] });
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

        if (this.gridMode.value) {
            this.startPoint = getClosestCellCenter(this.startPoint, locationSettingsState.raw.gridType.value);
        } else if (event && playerSettingsState.useSnapping(event)) {
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

        return Promise.resolve();
    }

    async onMove(lp: LocalPoint, event: MouseEvent | TouchEvent | undefined): Promise<void> {
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

        const { cells, ruler } = this.rulers.at(-1)!;
        ruler.endPoint = endPoint;
        sendShapePositionUpdate([ruler], true);

        const start = ruler.refPoint;
        const end = ruler.endPoint;

        if (this.gridMode.value) {
            cells.length = 0;
            const gridType = locationSettingsState.raw.gridType.value;

            const startCell = getCellFromPoint(start, gridType);
            const startCenter = getCellCenter(startCell, gridType);
            const endCell = getCellFromPoint(end, gridType);
            const endCenter = getCellCenter(endCell, gridType);

            const iterations = getCellDistance(startCell, endCell, gridType);

            const ray = Ray.fromPoints(startCenter, endCenter);

            const step = ray.tMax / iterations;
            for (let i = 0; i <= iterations; i++) {
                const cellCenter = getClosestCellCenter(ray.get(step * i), gridType);
                if (Number.isNaN(cellCenter.x)) continue;
                const lastCenter = cells.at(-1) ?? this.rulers.at(-2)?.cells.at(-1);
                if (lastCenter !== undefined && equalsP(cellCenter, lastCenter)) continue;

                cells.push(cellCenter);
            }
        }

        const diffsign = Math.sign(end.x - start.x) * Math.sign(end.y - start.y);
        const xdiff = Math.abs(end.x - start.x);
        const ydiff = Math.abs(end.y - start.y);

        let cellDistance = cells.length;
        let unitDistance = cellDistance;
        if (!this.gridMode.value) {
            unitDistance =
                (Math.sqrt(xdiff ** 2 + ydiff ** 2) * locationSettingsState.raw.unitSize.value) / DEFAULT_GRID_SIZE;
        } else {
            if (!this.previousCellDistance) {
                cellDistance = Math.max(cellDistance - 1, 0);
            }
            unitDistance = cellDistance * locationSettingsState.raw.unitSize.value;
        }

        this.currentLength = unitDistance;
        this.currentCellDistance = cellDistance;
        unitDistance += this.previousLength;
        cellDistance += this.previousCellDistance;

        const angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(start.x, end.x) + xdiff / 2;
        const ymid = Math.min(start.y, end.y) + ydiff / 2;
        this.text.refPoint = toGP(xmid, ymid);
        this.text.angle = angle;
        sendShapePositionUpdate([this.text], true);

        let label: string;
        const unit = locationSettingsState.raw.unitSizeUnit.value;

        // round to decimal precision 1 greater than the precision of unitSize
        const unitSize = locationSettingsState.raw.unitSize.value;
        const unitDecimal = unitSize - Math.floor(unitSize);
        const powerCount = unitDecimal ? -Math.floor(Math.log10(unitDecimal)) + 1 : 1;
        const powerOfTen = 10 ** powerCount;
        const displayDistance = i18n.global.n(Math.round(powerOfTen * unitDistance) / powerOfTen);

        if (this.gridMode.value) {
            const cellCount = cellDistance;

            const labelMode = playerSettingsState.raw.gridModeLabelFormat.value;
            if (labelMode === GridModeLabelFormat.Both) {
                label = `${cellCount} - ${displayDistance} ${unit}`;
            } else if (labelMode === GridModeLabelFormat.Distance) {
                label = `${displayDistance} ${unit}`;
            } else {
                label = `${cellCount}`;
            }
        } else {
            label = `${displayDistance} ${unit}`;
        }
        this.text.setText(label, SyncMode.TEMP_SYNC);

        layer.invalidate(true);

        // When using grid mode, we don't add the rectangles to the core PA shape system
        // this would induce a lot of overhead as we would have to constantly add/remove shapes onMove.
        // instead we draw the rectangles on the draw layer directly.
        if (this.gridMode.value) {
            this.registerHighlightedCellDraw(layer);
        }

        return Promise.resolve();
    }

    onUp(): Promise<void> {
        this.cleanup();
        return Promise.resolve();
    }

    async onKeyUp(event: KeyboardEvent, features: ToolFeatures): Promise<void> {
        if (event.defaultPrevented) return;
        if (event.key === " " && this.active.value) {
            const { ruler: lastRuler } = this.rulers.at(-1)!;

            const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
            if (layer === undefined) {
                console.log("No draw layer!");
                return;
            }

            if (this.gridMode.value) {
                lastRuler.endPoint = getClosestCellCenter(lastRuler.endPoint, locationSettingsState.raw.gridType.value);
                this.registerHighlightedCellDraw(layer);
            }

            this.createNewRuler(lastRuler.endPoint, lastRuler.endPoint);
            this.previousLength += this.currentLength;
            this.previousCellDistance += this.currentCellDistance;

            layer.moveShapeOrder(
                this.text!,
                layer.size({ includeComposites: true, onlyInView: false }) - 1,
                SyncMode.TEMP_SYNC,
            );

            event.preventDefault();
        }
        await super.onKeyUp(event, features);
    }

    private registerHighlightedCellDraw(layer: ILayer): void {
        layer.postDrawCallback
            .wait("grid-cells")
            .then(() => {
                layer.ctx.globalCompositeOperation = "destination-over";

                const gridType = locationSettingsState.raw.gridType.value;
                let firstCell = true;
                const handledCells: GlobalPoint[] = [];
                for (const { cells } of this.rulers) {
                    for (const cellCenter of cells) {
                        if (handledCells.some((c) => equalsP(c, cellCenter))) continue;

                        drawPolygon(
                            getCellVertices(getCellFromPoint(cellCenter, gridType), gridType).map((p) => toArrayP(p)),
                            { fillColour: gridHighlightColours.value[firstCell ? "start" : "default"] },
                        );
                        firstCell = false;
                        handledCells.push(cellCenter);
                    }
                }

                layer.ctx.globalCompositeOperation = "source-over";
            })
            // this throws if we request cb multiple times before a draw has completed
            // we don't care about that, so we just catch it and ignore it
            .catch(() => {});
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

        for (const { ruler } of this.rulers) {
            layer.removeShape(ruler, { sync: this.syncMode, recalculate: true, dropShapeId: true });
        }
        layer.removeShape(this.text, { sync: this.syncMode, recalculate: true, dropShapeId: true });
        this.startPoint = this.text = undefined;
        this.rulers = [];
        this.previousLength = 0;
        this.previousCellDistance = 0;
    }
}

export const rulerTool = new RulerTool();
