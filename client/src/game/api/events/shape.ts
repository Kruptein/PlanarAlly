import { SyncMode } from "../../../core/comm/types";
import { ServerShape } from "../../comm/types/shapes";
import { layerManager } from "../../layers/manager";
import { gameManager } from "../../manager";
import { socket } from "../socket";
import { EventBus } from "../../event-bus";

socket.on("Shape.Set", (data: ServerShape) => {
    // hard reset a shape
    const old = layerManager.UUIDMap.get(data.uuid);
    if (old) layerManager.getLayer(old.floor, old.layer)?.removeShape(old, SyncMode.NO_SYNC);
    const shape = gameManager.addShape(data);
    if (shape) EventBus.$emit("Shape.Set", shape);
});

socket.on("Shape.Options.Invisible.Set", (data: { shape: string; is_invisible: boolean }) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.setInvisible(data.is_invisible, false);
});
