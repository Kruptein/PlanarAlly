import { reactive } from "vue";

import { l2g } from "../../../core/conversions";
import { addP, cloneP, subtractP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import { getAspectRatio, getCellCountFromHeight, getCellCountFromWidth } from "../../../core/grid";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { sendShapePositionUpdate, sendShapeSizeUpdate } from "../../api/emits/shape/core";
import type { IShape } from "../../interfaces/shape";
import type { IRect } from "../../interfaces/shapes/rect";
import { ToolName } from "../../models/tools";
import type { ITool, ToolPermission } from "../../models/tools";
import { Rect } from "../../shapes/variants/rect";
import { floorState } from "../../systems/floors/state";
import { selectedSystem } from "../../systems/selected";
import { selectedState } from "../../systems/selected/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

class MapTool extends Tool implements ITool {
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

    shape?: IRect;
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
        if (shapes.length === 1 && this.shape === undefined && ["assetrect", "rect"].includes(shapes[0]!.type)) {
            this.shape = shapes[0] as IRect;
            this.state.hasShape = true;
            this.ogRP = this.shape.refPoint;
            this.ogW = this.shape.w;
            this.ogH = this.shape.h;
            this.state.aspectRatio = getAspectRatio(
                this.shape.w,
                this.shape.h,
                locationSettingsState.raw.gridType.value,
            );
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
            const layer = floorState.currentLayer.value!;
            layer.removeShape(this.rect, {
                sync: SyncMode.NO_SYNC,
                recalculate: true,
                dropShapeId: true,
            });
            this.rect = undefined;
            this.state.hasRect = false;
        }
        this.permittedTools_ = [{ name: ToolName.Select, features: { enabled: [SelectFeatures.ChangeSelection] } }];
        this.shape = undefined;
        this.state.hasShape = false;
        this.state.error = "";
        this.state.manualDrag = true;
    }

    onDown(lp: LocalPoint): Promise<void> {
        if (!this.state.manualDrag) return Promise.resolve();
        if (this.rect !== undefined || !selectedSystem.hasSelection) return Promise.resolve();

        const startPoint = l2g(lp);

        this.startPoint = startPoint;
        const layer = floorState.currentLayer.value!;

        this.active.value = true;

        this.rect = new Rect(
            cloneP(this.startPoint),
            0,
            0,
            {
                isSnappable: false,
            },
            { fillColour: "rgba(0,0,0,0)", strokeColour: ["black"] },
        );
        this.state.hasRect = true;
        this.rect.preventSync = true;
        layer.addShape(this.rect, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        selectedSystem.set(this.rect.id);
        return Promise.resolve();
    }

    onMove(lp: LocalPoint): Promise<void> {
        if (!this.active.value || this.rect === undefined || this.startPoint === undefined) return Promise.resolve();

        const endPoint = l2g(lp);

        const layer = floorState.currentLayer.value!;

        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint = toGP(Math.min(this.startPoint.x, endPoint.x), Math.min(this.startPoint.y, endPoint.y));
        layer.invalidate(false);
        return Promise.resolve();
    }

    onUp(): Promise<void> {
        if (!this.active.value || this.rect === undefined) return Promise.resolve();

        this.active.value = false;

        if (selectedState.raw.selected.size !== 1) {
            this.removeRect();
            return Promise.resolve();
        }

        this.permittedTools_ = [
            {
                name: ToolName.Select,
                features: { enabled: [SelectFeatures.Drag, SelectFeatures.Resize] },
            },
        ];
        return Promise.resolve();
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
            const xFactor = this.state.sizeX / this.rect.w;
            const yFactor = this.state.sizeY / this.rect.h;

            this.shape.w *= xFactor;
            this.shape.h *= yFactor;

            const oldRefpoint = this.shape.refPoint;
            const oldCenter = this.rect.center;

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

        const gridType = locationSettingsState.raw.gridType.value;

        this.state.manualDrag = false;
        this.state.gridX = getCellCountFromWidth(this.shape.w, gridType);
        this.state.gridY = getCellCountFromHeight(this.shape.h, gridType);
        this.state.sizeX = this.shape.w;
        this.state.sizeY = this.shape.h;
    }
}

export const mapTool = new MapTool();
