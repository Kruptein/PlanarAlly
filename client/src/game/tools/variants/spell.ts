import tinycolor from "tinycolor2";
import { reactive, watch, watchEffect } from "vue";

import { g2l, getUnitDistance, l2g, toRadians } from "../../../core/conversions";
import { equalsP, toGP } from "../../../core/geometry";
import type { LocalPoint } from "../../../core/geometry";
import { InvalidationMode, NO_SYNC, SyncMode, UI_SYNC } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { ICircle } from "../../interfaces/shapes/circle";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { Circle } from "../../shapes/variants/circle";
import { Rect } from "../../shapes/variants/rect";
import { accessSystem } from "../../systems/access";
import { floorState } from "../../systems/floors/state";
import { playerSystem } from "../../systems/players";
import { propertiesSystem } from "../../systems/properties";
import { selectedSystem } from "../../systems/selected";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";
import { activateTool } from "../tools";

export enum SpellShape {
    Square = "square",
    Circle = "circle",
    Cone = "cone",
}

class SpellTool extends Tool {
    readonly toolName = ToolName.Spell;
    readonly toolTranslation = i18n.global.t("tool.Spell");

    shape?: IShape;
    rangeShape?: Circle;

    state = reactive({
        selectedSpellShape: SpellShape.Square,
        showPublic: true,

        colour: "rgb(63, 127, 191)",
        size: 5,
        range: 0,
    });

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }

    constructor() {
        super();
        watch(
            () => this.state.size,
            () => {
                if (this.state.size <= 0) this.state.size = 1;
                if (this.shape !== undefined) this.drawShape();
            },
        );
        watchEffect(() => {
            if (this.state.range < 0) this.state.range = 0;
            if (this.state.range > 0 && this.state.selectedSpellShape === SpellShape.Cone) {
                this.state.selectedSpellShape = SpellShape.Circle;
            }
            if (this.shape !== undefined) this.drawShape();
            else if (this.rangeShape !== undefined) this.drawRangeShape();
        });
        watch(
            () => this.state.colour,
            () => {
                if (this.shape !== undefined) this.drawShape();
            },
        );
        watch(
            () => this.state.showPublic,
            () => {
                if (this.shape !== undefined) this.drawShape(true);
            },
        );
    }

    drawShape(syncChanged = false): void {
        if (!selectedSystem.hasSelection && this.state.selectedSpellShape === SpellShape.Cone) return;

        const layer = floorState.currentLayer.value!;

        const ogPoint = toGP(0, 0);
        let startPosition = ogPoint;

        if (this.shape !== undefined) {
            startPosition = this.shape.refPoint;
            const syncMode = this.state.showPublic !== syncChanged ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC;
            layer.removeShape(this.shape, { sync: syncMode, recalculate: false, dropShapeId: true });
        }

        switch (this.state.selectedSpellShape) {
            case SpellShape.Circle:
                this.shape = new Circle(startPosition, getUnitDistance(this.state.size), { isSnappable: false });
                break;
            case SpellShape.Square:
                this.shape = new Rect(
                    startPosition,
                    getUnitDistance(this.state.size),
                    getUnitDistance(this.state.size),
                    { isSnappable: false },
                );
                break;
            case SpellShape.Cone:
                this.shape = new Circle(startPosition, getUnitDistance(this.state.size), {
                    viewingAngle: toRadians(60),
                    isSnappable: false,
                });
                break;
        }

        if (this.shape === undefined) return;

        const c = tinycolor(this.state.colour);
        c.setAlpha(c.getAlpha() * 0.7);
        propertiesSystem.setFillColour(this.shape.id, c.toRgbString(), NO_SYNC);
        propertiesSystem.setStrokeColour(this.shape.id, this.state.colour, NO_SYNC);

        accessSystem.addAccess(
            this.shape.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: true },
            UI_SYNC,
        );

        layer.addShape(
            this.shape,
            this.state.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC,
            InvalidationMode.NORMAL,
        );

        if (selectedSystem.hasSelection && (this.state.range === 0 || equalsP(startPosition, ogPoint))) {
            const selection = selectedSystem.getFocus().value;
            if (selection === undefined) {
                console.error("SpellTool: No selection found.");
            } else {
                const selectionShape = getShape(selection);
                if (selectionShape === undefined) {
                    console.error("SpellTool: Selected shape does not exist.");
                } else {
                    this.shape.center = selectionShape.center;
                }
            }
        }

        this.drawRangeShape();
    }

    drawRangeShape(): void {
        const layer = floorState.currentLayer.value!;

        if (this.rangeShape !== undefined) {
            layer.removeShape(this.rangeShape, { sync: SyncMode.NO_SYNC, recalculate: false, dropShapeId: true });
        }

        if (!selectedSystem.hasSelection || this.state.range === 0) return;

        const selection = [...selectedSystem.$.value];
        this.rangeShape = new Circle(
            getShape(selection[0])!.center,
            getUnitDistance(this.state.range),
            {
                isSnappable: false,
            },
            { fillColour: "rgba(0,0,0,0)", strokeColour: ["black"] },
        );
        layer.addShape(this.rangeShape, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
    }

    onSelect(): Promise<void> {
        if (!selectedSystem.hasSelection && this.state.selectedSpellShape === SpellShape.Cone) {
            this.state.selectedSpellShape = SpellShape.Circle;
        }
        this.drawShape();
        return Promise.resolve();
    }

    onDeselect(): void {
        const layer = floorState.currentLayer.value!;

        if (this.shape !== undefined) {
            layer.removeShape(this.shape, {
                sync: this.state.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC,
                recalculate: false,
                dropShapeId: true,
            });
            this.shape = undefined;
        }
        if (this.rangeShape !== undefined) {
            layer.removeShape(this.rangeShape, {
                sync: this.state.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC,
                recalculate: false,
                dropShapeId: true,
            });
            this.rangeShape = undefined;
        }
    }

    onDown(): Promise<void> {
        if (this.shape === undefined) return Promise.resolve();
        const layer = floorState.currentLayer.value!;

        layer.removeShape(this.shape, {
            sync: this.state.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC,
            recalculate: false,
            dropShapeId: false,
        });
        propertiesSystem.setIsInvisible(this.shape.id, !this.state.showPublic, NO_SYNC);
        layer.addShape(this.shape, SyncMode.FULL_SYNC, InvalidationMode.NORMAL);
        this.shape = undefined;
        activateTool(ToolName.Select);
        return Promise.resolve();
    }

    onMove(lp: LocalPoint): Promise<void> {
        if (this.shape === undefined) return Promise.resolve();

        const endPoint = l2g(lp);
        const layer = floorState.currentLayer.value!;

        if (selectedSystem.hasSelection && this.state.range === 0) {
            if (this.state.selectedSpellShape === SpellShape.Cone) {
                const center = g2l(this.shape.center);
                (this.shape as ICircle).angle = -Math.atan2(lp.y - center.y, center.x - lp.x) + Math.PI;
                if (this.state.showPublic) sendShapePositionUpdate([this.shape], true);
                layer.invalidate(true);
            }
        } else {
            this.shape.center = endPoint;
            if (this.state.showPublic) sendShapePositionUpdate([this.shape], true);
            layer.invalidate(true);
        }
        return Promise.resolve();
    }

    onContextMenu(): void {
        if (this.shape !== undefined) {
            const layer = floorState.currentLayer.value!;

            layer.removeShape(this.shape, {
                sync: this.state.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC,
                recalculate: false,
                dropShapeId: true,
            });
            this.shape = undefined;
        }
        activateTool(ToolName.Select);
    }
}

export const spellTool = new SpellTool();
