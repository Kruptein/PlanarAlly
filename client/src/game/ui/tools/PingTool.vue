<script lang="ts">
import Component from "vue-class-component";

import { InvalidationMode, SyncMode, SyncTo } from "@/core/models/types";
import { GlobalPoint, LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Circle } from "@/game/shapes/variants/circle";
import { gameStore } from "@/game/store";
import Tool from "@/game/ui/tools/Tool.vue";
import { l2g } from "@/game/units";

import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { floorStore } from "../../layers/store";
import { deleteShapes } from "../../shapes/utils";

import { SelectFeatures } from "./SelectTool.vue";
import { ToolBasics } from "./ToolBasics";
import { ToolName, ToolPermission } from "./utils";

@Component
export default class PingTool extends Tool implements ToolBasics {
    name = ToolName.Ping;
    active = false;
    startPoint: GlobalPoint | undefined = undefined;
    ping: Circle | undefined = undefined;
    border: Circle | undefined = undefined;

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    cleanup(): void {
        if (!this.active || this.ping === undefined || this.border === undefined || this.startPoint === undefined)
            return;
        const layer = layerManager.getLayer(floorStore.currentFloor, "draw");
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        this.active = false;
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
        const layer = layerManager.getLayer(floorStore.currentFloor, "draw");

        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        this.active = true;
        this.ping = new Circle(this.startPoint, 20, { fillColour: gameStore.rulerColour });
        this.border = new Circle(this.startPoint, 40, { fillColour: "#0000", strokeColour: gameStore.rulerColour });
        this.ping.ignoreZoomSize = true;
        this.border.ignoreZoomSize = true;
        this.ping.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.SHAPE);
        this.border.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.SHAPE);
        layer.addShape(this.ping, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
        layer.addShape(this.border, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
    }

    onUp(): void {
        this.cleanup();
    }

    onMove(lp: LocalPoint): void {
        if (!this.active || this.ping === undefined || this.border === undefined || this.startPoint === undefined)
            return;

        const gp = l2g(lp);

        const layer = layerManager.getLayer(floorStore.currentFloor, "draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        this.ping.center(gp);
        this.border.center(gp);

        sendShapePositionUpdate([this.ping, this.border], true);

        layer.invalidate(true);
    }
}
</script>
