import { ref } from "vue";

import { l2g } from "../../../core/conversions";
import { cloneP, toGP } from "../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import { snapToGridPoint } from "../../../core/math";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { clientStore, DEFAULT_GRID_SIZE } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { settingsStore } from "../../../store/settings";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { LayerName } from "../../models/floor";
import { ToolName } from "../../models/tools";
import type { ToolFeatures, ToolPermission } from "../../models/tools";
import { Line } from "../../shapes/variants/line";
import { Text } from "../../shapes/variants/text";
import { accessSystem } from "../../systems/access";
import { Tool } from "../tool";

import { SelectFeatures } from "./select";

export enum RulerFeatures {
    All,
}

class RulerTool extends Tool {
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

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    private get syncMode(): SyncMode {
        if (this.showPublic.value) return SyncMode.TEMP_SYNC;
        return SyncMode.NO_SYNC;
    }

    private createNewRuler(start: GlobalPoint, end: GlobalPoint): void {
        const ruler = new Line(start, end, {
            lineWidth: 5,
            strokeColour: [clientStore.state.rulerColour],
            isSnappable: false,
        });
        ruler.ignoreZoomSize = true;

        const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw);
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        accessSystem.addAccess(
            ruler.id,
            clientStore.state.username,
            { edit: true, movement: true, vision: true },
            NO_SYNC,
        );
        layer.addShape(ruler, this.syncMode, InvalidationMode.NORMAL);
        this.rulers.push(ruler);
    }

    // EVENT HANDLERS

    // eslint-disable-next-line @typescript-eslint/require-await
    async onDown(lp: LocalPoint, event: MouseEvent | TouchEvent): Promise<void> {
        this.cleanup();
        this.startPoint = l2g(lp);

        if (clientStore.useSnapping(event)) [this.startPoint] = snapToGridPoint(this.startPoint);

        const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw);
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }
        this.active.value = true;
        this.createNewRuler(cloneP(this.startPoint), cloneP(this.startPoint));
        this.text = new Text(cloneP(this.startPoint), "", 20, {
            fillColour: "#000",
            strokeColour: ["#fff"],
            isSnappable: false,
        });
        this.text.ignoreZoomSize = true;
        accessSystem.addAccess(
            this.text.id,
            clientStore.state.username,
            { edit: true, movement: true, vision: true },
            NO_SYNC,
        );
        layer.addShape(this.text, this.syncMode, InvalidationMode.NORMAL);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onMove(lp: LocalPoint, event: MouseEvent | TouchEvent): Promise<void> {
        let endPoint = l2g(lp);
        if (!this.active.value || this.rulers.length === 0 || this.startPoint === undefined || this.text === undefined)
            return;

        const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw);
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        if (clientStore.useSnapping(event)) [endPoint] = snapToGridPoint(endPoint);

        const ruler = this.rulers.at(-1)!;
        ruler.endPoint = endPoint;
        sendShapePositionUpdate([ruler], true);

        const start = ruler.refPoint;
        const end = ruler.endPoint;

        const diffsign = Math.sign(end.x - start.x) * Math.sign(end.y - start.y);
        const xdiff = Math.abs(end.x - start.x);
        const ydiff = Math.abs(end.y - start.y);
        let distance = (Math.sqrt(xdiff ** 2 + ydiff ** 2) * settingsStore.unitSize.value) / DEFAULT_GRID_SIZE;
        this.currentLength = distance;
        distance += this.previousLength;

        // round to 1 decimal
        const label = i18n.global.n(Math.round(10 * distance) / 10) + " " + settingsStore.unitSizeUnit.value;
        const angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(start.x, end.x) + xdiff / 2;
        const ymid = Math.min(start.y, end.y) + ydiff / 2;
        this.text.refPoint = toGP(xmid, ymid);
        this.text.setText(label, SyncMode.TEMP_SYNC);
        this.text.angle = angle;
        sendShapePositionUpdate([this.text], true);
        layer.invalidate(true);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onUp(): Promise<void> {
        this.cleanup();
    }

    onKeyUp(event: KeyboardEvent, features: ToolFeatures): void {
        if (event.defaultPrevented) return;
        if (event.key === " " && this.active.value) {
            const lastRuler = this.rulers.at(-1)!;
            this.createNewRuler(lastRuler.endPoint, lastRuler.endPoint);
            this.previousLength += this.currentLength;

            const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw);
            if (layer === undefined) {
                console.log("No draw layer!");
                return;
            }

            layer.moveShapeOrder(this.text!, layer.size({ includeComposites: true }) - 1, SyncMode.TEMP_SYNC);

            event.preventDefault();
        }
        super.onKeyUp(event, features);
    }

    // HELPERS

    private cleanup(): void {
        if (!this.active.value || this.rulers.length === 0 || this.startPoint === undefined || this.text === undefined)
            return;

        const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw);
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
