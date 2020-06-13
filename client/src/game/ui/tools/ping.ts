import { InvalidationMode, SyncMode } from "@/core/comm/types";
import { socket } from "@/game/api/socket";
import { GlobalPoint, LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Circle } from "@/game/shapes/circle";
import { gameStore } from "@/game/store";
import Tool from "@/game/ui/tools/tool.vue";
import { l2g } from "@/game/units";
import Component from "vue-class-component";
import { ToolBasics } from "./ToolBasics";
import { ToolName } from "./utils";

@Component
export class PingTool extends Tool implements ToolBasics {
    name = ToolName.Ping;
    active = false;
    startPoint: GlobalPoint | null = null;
    ping: Circle | null = null;
    border: Circle | null = null;

    onDown(lp: LocalPoint): void {
        this.startPoint = l2g(lp);
        const layer = layerManager.getLayer(layerManager.floor!.name, "draw");

        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        this.active = true;
        this.ping = new Circle(this.startPoint, 20, gameStore.rulerColour);
        this.border = new Circle(this.startPoint, 40, "#0000", gameStore.rulerColour);
        this.ping.addOwner({ user: gameStore.username, access: { edit: true } }, false);
        this.border.addOwner({ user: gameStore.username, access: { edit: true } }, false);
        layer.addShape(this.ping, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
        layer.addShape(this.border, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
    }

    onUp(): void {
        if (!this.active || this.ping === null || this.border === null || this.startPoint === null) return;

        const layer = layerManager.getLayer(layerManager.floor!.name, "draw");
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        this.active = false;
        layer.removeShape(this.ping, SyncMode.TEMP_SYNC);
        layer.removeShape(this.border, SyncMode.TEMP_SYNC);
        this.ping = null;
        this.startPoint = null;
    }

    onMove(lp: LocalPoint): void {
        if (!this.active || this.ping === null || this.border === null || this.startPoint === null) return;

        const gp = l2g(lp);

        const layer = layerManager.getLayer(layerManager.floor!.name, "draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        this.ping.center(gp);
        this.border.center(gp);

        socket.emit("Shape.Update", { shape: this.ping.asDict(), redraw: true, temporary: true });
        socket.emit("Shape.Update", { shape: this.border.asDict(), redraw: true, temporary: true });

        layer.invalidate(true);
    }
}
