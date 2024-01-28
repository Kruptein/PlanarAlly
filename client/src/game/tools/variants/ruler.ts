import tinycolor from "tinycolor2";
import { computed, ref } from "vue";

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
import { drawPolygon } from "../../rendering/basic";
import { Line } from "../../shapes/variants/line";
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

const gridHighlightColour = computed(() => {
    const rulerColour = tinycolor(playerSettingsState.reactive.rulerColour.value);
    console.log(rulerColour.toRgbString());
    const a = rulerColour.setAlpha(rulerColour.getAlpha() * 0.25).toRgbString();
    console.log(a);
    return a;
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
    private previousLength = 0;

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

            const startCenter = getCellCenter(start);
            const endCenter = getCellCenter(end);
            const ray = Ray.fromPoints(startCenter, endCenter);

            const iterations = Math.round(
                Math.max(
                    Math.abs(endCenter.x - startCenter.x) / DEFAULT_GRID_SIZE,
                    Math.abs(endCenter.y - startCenter.y) / DEFAULT_GRID_SIZE,
                ),
            );

            const step = ray.tMax / iterations;
            for (let i = 0; i <= iterations; i++) {
                const cellCenter = getCellCenter(ray.get(step * i));
                if (Number.isNaN(cellCenter.x)) continue;
                const lastCenter = cells.at(-1) ?? this.rulers.at(-2)?.cells.at(-1);
                if (lastCenter !== undefined && equalsP(cellCenter, lastCenter)) continue;

                cells.push(cellCenter);
            }
        }

        const diffsign = Math.sign(end.x - start.x) * Math.sign(end.y - start.y);
        const xdiff = Math.abs(end.x - start.x);
        const ydiff = Math.abs(end.y - start.y);

        let distance = cells.length;
        if (!this.gridMode.value) {
            distance =
                (Math.sqrt(xdiff ** 2 + ydiff ** 2) * locationSettingsState.raw.unitSize.value) / DEFAULT_GRID_SIZE;
        }

        this.currentLength = distance;
        distance += this.previousLength;

        const angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(start.x, end.x) + xdiff / 2;
        const ymid = Math.min(start.y, end.y) + ydiff / 2;
        this.text.refPoint = toGP(xmid, ymid);
        this.text.angle = angle;
        sendShapePositionUpdate([this.text], true);

        let label: string;
        const unit = locationSettingsState.raw.unitSizeUnit.value;
        if (this.gridMode.value) {
            const cellCount = distance - 1;
            const distanceInUnits = distance * locationSettingsState.raw.unitSize.value;
            label = `${cellCount} (${distanceInUnits} ${unit})`;
        } else {
            // round to 1 decimal
            const distanceInUnits = i18n.global.n(Math.round(10 * distance) / 10);
            label = `${distanceInUnits} ${unit}`;
        }
        this.text.setText(label, SyncMode.TEMP_SYNC);

        layer.invalidate(true);

        // When using grid mode, we don't add the rectangles to the core PA shape system
        // this would induce a lot of overhead as we would have to constantly add/remove shapes onMove.
        // instead we draw the rectangles on the draw layer directly.
        if (this.gridMode.value) {
            layer.postDrawCallback
                .wait("grid-cells")
                .then(() => {
                    layer.ctx.globalCompositeOperation = "destination-over";

                    const half = DEFAULT_GRID_SIZE / 2;
                    for (const { cells } of this.rulers) {
                        for (const cell of cells) {
                            drawPolygon(
                                [
                                    [cell.x - half, cell.y - half],
                                    [cell.x + half, cell.y - half],
                                    [cell.x + half, cell.y + half],
                                    [cell.x - half, cell.y + half],
                                ],
                                { fillColour: gridHighlightColour.value },
                            );
                        }
                    }

                    layer.ctx.globalCompositeOperation = "source-over";
                })
                // this throws if we request cb multiple times before a draw has completed
                // we don't care about that, so we just catch it and ignore it
                .catch(() => {});
        }

        return Promise.resolve();
    }

    onUp(): Promise<void> {
        this.cleanup();
        return Promise.resolve();
    }

    onKeyUp(event: KeyboardEvent, features: ToolFeatures): void {
        if (event.defaultPrevented) return;
        if (event.key === " " && this.active.value) {
            const { ruler: lastRuler } = this.rulers.at(-1)!;
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

        for (const { ruler } of this.rulers) {
            layer.removeShape(ruler, { sync: this.syncMode, recalculate: true, dropShapeId: true });
        }
        layer.removeShape(this.text, { sync: this.syncMode, recalculate: true, dropShapeId: true });
        this.startPoint = this.text = undefined;
        this.rulers = [];
        this.previousLength = 0;
    }
}

export const rulerTool = new RulerTool();
