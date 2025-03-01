import { l2g } from "../../../core/conversions";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { LayerName } from "../../models/floor";
import { ToolName } from "../../models/tools";
import type { ITool, ToolPermission } from "../../models/tools";
import { deleteShapes } from "../../shapes/utils";
import { Circle } from "../../shapes/variants/circle";
import { accessSystem } from "../../systems/access";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { playerSystem } from "../../systems/players";
import { playerSettingsState } from "../../systems/settings/players/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

class PingTool extends Tool implements ITool {
    readonly toolName = ToolName.Ping;
    readonly toolTranslation = i18n.global.t("tool.Ping");

    ping?: Circle;
    border?: Circle;
    startPoint?: GlobalPoint;

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    cleanup(): void {
        if (!this.active.value || this.ping === undefined || this.border === undefined || this.startPoint === undefined)
            return;

        this.active.value = false;
        deleteShapes([this.ping, this.border], SyncMode.TEMP_SYNC);
        this.ping = undefined;
        this.startPoint = undefined;
    }

    onDeselect(): void {
        this.cleanup();
    }

    onDown(lp: LocalPoint): Promise<void> {
        this.cleanup();
        this.startPoint = l2g(lp);
        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);

        if (layer === undefined) {
            console.log("No draw layer!");
            return Promise.resolve();
        }

        this.active.value = true;
        this.ping = new Circle(
            this.startPoint,
            20,
            { isSnappable: false },
            { fillColour: playerSettingsState.raw.rulerColour.value },
        );
        this.border = new Circle(
            this.startPoint,
            40,
            {
                isSnappable: false,
            },
            { fillColour: "#0000", strokeColour: [playerSettingsState.raw.rulerColour.value] },
        );
        this.ping.ignoreZoomSize = true;
        this.border.ignoreZoomSize = true;
        accessSystem.addAccess(
            this.ping.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: false, movement: false, vision: false },
            NO_SYNC,
        );
        accessSystem.addAccess(
            this.border.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: false, movement: false, vision: false },
            NO_SYNC,
        );
        layer.addShape(this.ping, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
        layer.addShape(this.border, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
        return Promise.resolve();
    }

    onMove(lp: LocalPoint): Promise<void> {
        if (!this.active.value || this.ping === undefined || this.border === undefined || this.startPoint === undefined)
            return Promise.resolve();

        const gp = l2g(lp);

        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
        if (layer === undefined) {
            console.log("No draw layer!");
            return Promise.resolve();
        }

        this.ping.center = gp;
        this.border.center = gp;

        sendShapePositionUpdate([this.ping, this.border], true);

        layer.invalidate(true);
        return Promise.resolve();
    }

    onUp(): Promise<void> {
        this.cleanup();
        return Promise.resolve();
    }
}

export const pingTool = new PingTool();
