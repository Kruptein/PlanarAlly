import { l2g } from "../../../core/conversions";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import { clientStore } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { LayerName } from "../../models/floor";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { deleteShapes } from "../../shapes/utils";
import { Circle } from "../../shapes/variants/circle";
import { accessSystem } from "../../systems/access";
import { Tool } from "../tool";

import { SelectFeatures } from "./select";

class PingTool extends Tool {
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

    // eslint-disable-next-line @typescript-eslint/require-await
    async onDown(lp: LocalPoint): Promise<void> {
        this.cleanup();
        this.startPoint = l2g(lp);
        const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw);

        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        this.active.value = true;
        this.ping = new Circle(this.startPoint, 20, { fillColour: clientStore.state.rulerColour, isSnappable: false });
        this.border = new Circle(this.startPoint, 40, {
            fillColour: "#0000",
            strokeColour: [clientStore.state.rulerColour],
            isSnappable: false,
        });
        this.ping.ignoreZoomSize = true;
        this.border.ignoreZoomSize = true;
        accessSystem.addAccess(
            this.ping.id,
            clientStore.state.username,
            { edit: true, movement: true, vision: true },
            NO_SYNC,
        );
        accessSystem.addAccess(
            this.border.id,
            clientStore.state.username,
            { edit: true, movement: true, vision: true },
            NO_SYNC,
        );
        layer.addShape(this.ping, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
        layer.addShape(this.border, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onMove(lp: LocalPoint): Promise<void> {
        if (!this.active.value || this.ping === undefined || this.border === undefined || this.startPoint === undefined)
            return;

        const gp = l2g(lp);

        const layer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw);
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        this.ping.center(gp);
        this.border.center(gp);

        sendShapePositionUpdate([this.ping, this.border], true);

        layer.invalidate(true);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onUp(): Promise<void> {
        this.cleanup();
    }
}

export const pingTool = new PingTool();
