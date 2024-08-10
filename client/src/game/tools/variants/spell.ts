import tinycolor from "tinycolor2";
import { reactive, watch } from "vue";

import { g2l, getUnitDistance, l2g, toRadians } from "../../../core/conversions";
import { toGP, toLP } from "../../../core/geometry";
import type { LocalPoint } from "../../../core/geometry";
import { DEFAULT_HEX_RADIUS, GridType } from "../../../core/grid";
import { InvalidationMode, NO_SYNC, SyncMode, UI_SYNC } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { ICircle } from "../../interfaces/shapes/circle";
import { ToolName } from "../../models/tools";
import type { ITool, ToolPermission } from "../../models/tools";
import { Circle } from "../../shapes/variants/circle";
import { createHexPolygon } from "../../shapes/variants/hex";
import { Rect } from "../../shapes/variants/rect";
import { accessSystem } from "../../systems/access";
import { floorState } from "../../systems/floors/state";
import { playerSystem } from "../../systems/players";
import { propertiesSystem } from "../../systems/properties";
import { selectedSystem } from "../../systems/selected";
import { selectedState } from "../../systems/selected/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";
import { activateTool, toolMap } from "../tools";

export enum SpellShape {
    Square = "square",
    Circle = "circle",
    Cone = "cone",
}

class SpellTool extends Tool implements ITool {
    readonly toolName = ToolName.Spell;
    readonly toolTranslation = i18n.global.t("tool.Spell");

    shape?: IShape;

    state = reactive({
        selectedSpellShape: SpellShape.Square,
        showPublic: true,
        oddHexOrientation: false,

        colour: "rgb(63, 127, 191)",
        size: 5,
    });

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }

    constructor() {
        super();
        watch(
            () => this.state.size,
            async () => {
                if (this.shape !== undefined) await this.drawShape();
            },
        );
        watch(
            () => this.state.oddHexOrientation,
            async () => {
                if (this.shape !== undefined) await this.drawShape();
            },
        );
        watch(
            () => this.state.selectedSpellShape,
            async () => {
                if (selectedState.reactive.focus === undefined && this.state.selectedSpellShape === SpellShape.Cone) {
                    this.state.selectedSpellShape = SpellShape.Circle;
                }
                if (this.shape !== undefined) await this.drawShape();
            },
        );
        watch(
            () => this.state.colour,
            async () => {
                if (this.shape !== undefined) await this.drawShape();
            },
        );
        watch(
            () => this.state.showPublic,
            async () => {
                if (this.shape !== undefined) await this.drawShape(true);
            },
        );
    }

    async drawShape(syncChanged = false): Promise<void> {
        if (!selectedSystem.hasSelection && this.state.selectedSpellShape === SpellShape.Cone) return;
        if (this.state.size <= 0) return;

        const layer = floorState.currentLayer.value!;

        const ogPoint = toGP(0, 0);
        let startPosition = ogPoint;
        let shapeCenter = ogPoint;

        if (this.shape !== undefined) {
            startPosition = this.shape.refPoint;
            shapeCenter = this.shape.center;
            const syncMode = this.state.showPublic !== syncChanged ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC;
            layer.removeShape(this.shape, { sync: syncMode, recalculate: false, dropShapeId: true });
        }

        switch (this.state.selectedSpellShape) {
            case SpellShape.Circle:
                this.shape = new Circle(startPosition, getUnitDistance(this.state.size), { isSnappable: false });
                break;
            case SpellShape.Square:
                {
                    const gridType = locationSettingsState.raw.gridType.value;
                    if (gridType === GridType.Square) {
                        this.shape = new Rect(
                            startPosition,
                            getUnitDistance(this.state.size),
                            getUnitDistance(this.state.size),
                            { isSnappable: false },
                        );
                    } else {
                        this.shape = createHexPolygon(shapeCenter, this.state.size, {
                            type: gridType,
                            oddHexOrientation: this.state.oddHexOrientation,
                            radius: DEFAULT_HEX_RADIUS,
                        });
                    }
                }
                break;
            case SpellShape.Cone:
                this.shape = new Circle(startPosition, getUnitDistance(this.state.size), {
                    viewingAngle: toRadians(60),
                    isSnappable: false,
                });
                break;
        }

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

        if (this.state.selectedSpellShape === SpellShape.Cone) {
            const selection = selectedState.raw.focus;
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

        await this.drawRangeShape();
    }

    async drawRangeShape(): Promise<void> {
        const focus = selectedState.raw.focus;

        if (focus === undefined || this.shape === undefined) return;

        const focusShape = getShape(focus);
        if (focusShape === undefined) return;

        const ruler = toolMap[ToolName.Ruler];
        await ruler.onDown(g2l(focusShape.center), undefined, {});
    }

    async onSelect(): Promise<void> {
        if (!selectedSystem.hasSelection && this.state.selectedSpellShape === SpellShape.Cone) {
            this.state.selectedSpellShape = SpellShape.Circle;
        }
        await this.drawShape();
    }

    async onDeselect(): Promise<void> {
        await this.close({ dropShapeId: true, deselectTool: false });
    }

    async onDown(): Promise<void> {
        await this.close({ dropShapeId: false, deselectTool: true });
    }

    async onMove(lp: LocalPoint): Promise<void> {
        if (this.shape === undefined) return Promise.resolve();

        const endPoint = l2g(lp);
        const layer = floorState.currentLayer.value!;

        if (this.state.selectedSpellShape === SpellShape.Cone) {
            const center = g2l(this.shape.center);
            (this.shape as ICircle).angle = -Math.atan2(lp.y - center.y, center.x - lp.x) + Math.PI;
            if (this.state.showPublic) sendShapePositionUpdate([this.shape], true);
            layer.invalidate(true);
        } else {
            this.shape.center = endPoint;
            if (this.state.showPublic) sendShapePositionUpdate([this.shape], true);

            const focus = selectedState.raw.focus;

            if (focus !== undefined) {
                const ruler = toolMap[ToolName.Ruler];
                await ruler.onMove(g2l(this.shape.center), undefined, {});
            }

            layer.invalidate(true);
        }
    }

    async onContextMenu(): Promise<boolean> {
        await this.close({ dropShapeId: true, deselectTool: true });
        return false;
    }

    async close(options: { dropShapeId: boolean; deselectTool: boolean }): Promise<void> {
        if (this.shape !== undefined) {
            const layer = floorState.currentLayer.value;
            if (layer === undefined) return;

            const { dropShapeId } = options;

            layer.removeShape(this.shape, {
                sync: this.state.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC,
                recalculate: false,
                dropShapeId,
            });

            if (!dropShapeId) {
                propertiesSystem.setIsInvisible(this.shape.id, !this.state.showPublic, NO_SYNC);
                layer.addShape(this.shape, SyncMode.FULL_SYNC, InvalidationMode.NORMAL);
            }
            this.shape = undefined;

            const ruler = toolMap[ToolName.Ruler];
            await ruler.onUp(toLP(0, 0), undefined, {});
        }
        if (options.deselectTool) activateTool(ToolName.Select);
    }
}

export const spellTool = new SpellTool();
