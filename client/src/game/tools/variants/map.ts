import { reactive } from "vue";

import { l2g } from "../../../core/conversions";
import { addP, cloneP, subtractP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { DEFAULT_GRID_SIZE } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { sendShapePositionUpdate, sendShapeSizeUpdate } from "../../api/emits/shape/core";
import { selectionState } from "../../layers/selection";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import type { IShape } from "../../shapes/interfaces";
import { Rect } from "../../shapes/variants/rect";
import { Tool } from "../tool";

import { SelectFeatures } from "./select";

class MapTool extends Tool {
    readonly toolName = ToolName.Map;
    readonly toolTranslation = i18n.global.t("tool.Map");

    state = reactive({
        hasRect: false,
        hasShape: false,

        manualDrag: true,
        aspectRatio: 1,

        gridX: 3,
        gridY: 3,
        sizeX: 0,
        sizeY: 0,

        error: "",
    });

    shape?: Rect;
    rect?: Rect;
    startPoint?: GlobalPoint;
    ogRP?: GlobalPoint;
    ogW?: number;
    ogH?: number;

    permittedTools_: ToolPermission[] = [
        { name: ToolName.Select, features: { enabled: [SelectFeatures.ChangeSelection] } },
    ];

    get permittedTools(): ToolPermission[] {
        return this.permittedTools_;
    }

    setSelection(shapes: readonly IShape[]): void {
        if (shapes.length === 1 && this.shape === undefined && ["assetrect", "rect"].includes(shapes[0].type)) {
            this.shape = shapes[0] as Rect;
            this.state.hasShape = true;
            this.ogRP = this.shape.refPoint;
            this.ogW = this.shape.w;
            this.ogH = this.shape.h;
            this.state.aspectRatio = this.shape.w / this.shape.h;
        } else if (shapes.length === 0) {
            this.removeRect();
        }
    }

    onDeselect(): void {
        this.removeRect();
    }

    removeRect(reset = true): void {
        if (this.shape && reset && this.active.value) {
            this.shape.refPoint = this.ogRP!;
            this.shape.w = this.ogW!;
            this.shape.h = this.ogH!;

            sendShapePositionUpdate([this.shape], true);
            sendShapeSizeUpdate({ shape: this.shape, temporary: true });
            this.shape.invalidate(true);
        }
        if (this.rect !== undefined) {
            const layer = floorStore.currentLayer.value!;
            layer.removeShape(this.rect, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            this.rect = undefined;
            this.state.hasRect = false;
        }
        this.permittedTools_ = [{ name: ToolName.Select, features: { enabled: [SelectFeatures.ChangeSelection] } }];
        this.shape = undefined;
        this.state.hasShape = false;
        this.state.error = "";
        this.state.manualDrag = true;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onDown(lp: LocalPoint): Promise<void> {
        if (!this.state.manualDrag) return;
        if (this.rect !== undefined || !selectionState.hasSelection) return;

        const startPoint = l2g(lp);

        this.startPoint = startPoint;
        const layer = floorStore.currentLayer.value!;

        this.active.value = true;

        this.rect = new Rect(cloneP(this.startPoint), 0, 0, {
            fillColour: "rgba(0,0,0,0)",
            strokeColour: ["black"],
            isSnappable: false,
        });
        this.state.hasRect = true;
        this.rect.preventSync = true;
        layer.addShape(this.rect, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        selectionState.set(this.rect);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onMove(lp: LocalPoint): Promise<void> {
        if (!this.active.value || this.rect === undefined || this.startPoint === undefined) return;

        const endPoint = l2g(lp);

        const layer = floorStore.currentLayer.value!;

        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint = toGP(Math.min(this.startPoint.x, endPoint.x), Math.min(this.startPoint.y, endPoint.y));
        layer.invalidate(false);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onUp(): Promise<void> {
        if (!this.active.value || this.rect === undefined) return;

        this.active.value = false;

        if (selectionState.state.selection.size !== 1) {
            this.removeRect();
            return;
        }

        this.permittedTools_ = [
            { name: ToolName.Select, features: { enabled: [SelectFeatures.Drag, SelectFeatures.Resize] } },
        ];
    }

    preview(temporary: boolean): void {
        if (this.shape === undefined || (this.rect === undefined && this.state.manualDrag)) return;
        if (
            !Number.isFinite(this.state.gridX) ||
            !Number.isFinite(this.state.gridY) ||
            this.state.gridX <= 0 ||
            this.state.gridY <= 0
        ) {
            this.state.error = "Input should be a positive number";
            return;
        }

        if (this.rect !== undefined) {
            const xFactor = (this.state.gridX * DEFAULT_GRID_SIZE) / this.rect.w;
            const yFactor = (this.state.gridY * DEFAULT_GRID_SIZE) / this.rect.h;

            this.shape.w *= xFactor;
            this.shape.h *= yFactor;

            const oldRefpoint = this.shape.refPoint;
            const oldCenter = this.rect.center();

            const delta = subtractP(oldCenter, oldRefpoint);
            const newCenter = addP(oldRefpoint, new Vector(xFactor * delta.x, yFactor * delta.y));
            this.shape.refPoint = addP(this.shape.refPoint, subtractP(oldCenter, newCenter));
        } else {
            this.shape.w = this.state.sizeX;
            this.shape.h = this.state.sizeY;
        }

        sendShapePositionUpdate([this.shape], temporary);
        sendShapeSizeUpdate({ shape: this.shape, temporary: temporary });
        this.shape.invalidate(true);
    }

    skipManualDrag(): void {
        if (this.shape === undefined) return;

        this.state.manualDrag = false;
        this.state.gridX = this.shape.w / DEFAULT_GRID_SIZE;
        this.state.gridY = this.shape.h / DEFAULT_GRID_SIZE;
        this.state.sizeX = this.shape.w;
        this.state.sizeY = this.shape.h;
    }
}

export const mapTool = new MapTool();
