import { SyncTo } from "../../../../core/models/types";
import { layerManager } from "../../../layers/manager";
import { aurasFromServer, partialAuraFromServer } from "../../../models/conversion/aura";
import { ServerAura, ServerTracker } from "../../../models/shapes";
import { Aura, Tracker } from "../../../shapes/interfaces";
import { Shape } from "../../../shapes/shape";
import { socket } from "../../socket";

function wrapCall<T>(func: (value: T, syncTo: SyncTo) => void): (data: { shape: string; value: T }) => void {
    return (data) => {
        const shape = layerManager.UUIDMap.get(data.shape);
        if (shape === undefined) return;
        func.bind(shape)(data.value, SyncTo.UI);
    };
}

socket.on("Shape.Options.Name.Set", wrapCall(Shape.prototype.setName));
socket.on("Shape.Options.NameVisible.Set", wrapCall(Shape.prototype.setNameVisible));
socket.on("Shape.Options.Token.Set", wrapCall(Shape.prototype.setIsToken));
socket.on("Shape.Options.Invisible.Set", wrapCall(Shape.prototype.setInvisible));
socket.on("Shape.Options.StrokeColour.Set", wrapCall(Shape.prototype.setStrokeColour));
socket.on("Shape.Options.FillColour.Set", wrapCall(Shape.prototype.setFillColour));
socket.on("Shape.Options.VisionBlock.Set", wrapCall(Shape.prototype.setVisionBlock));
socket.on("Shape.Options.MovementBlock.Set", wrapCall(Shape.prototype.setMovementBlock));
socket.on("Shape.Options.Locked.Set", wrapCall(Shape.prototype.setLocked));
socket.on("Shape.Options.ShowBadge.Set", wrapCall(Shape.prototype.setShowBadge));
socket.on("Shape.Options.Invisible.Set", wrapCall(Shape.prototype.setInvisible));

socket.on("Shape.Options.Annotation.Set", wrapCall(Shape.prototype.setAnnotation));
socket.on("Shape.Options.Label.Add", wrapCall(Shape.prototype.addLabel));

socket.on("Shape.Options.Tracker.Remove", wrapCall(Shape.prototype.removeTracker));
socket.on("Shape.Options.Aura.Remove", wrapCall(Shape.prototype.removeAura));
socket.on("Shape.Options.Label.Remove", wrapCall(Shape.prototype.removeLabel));

socket.on("Shape.Options.Tracker.Create", (data: ServerTracker): void => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.pushTracker(data, SyncTo.UI);
});

socket.on("Shape.Options.Tracker.Update", (data: { uuid: string; shape: string } & Partial<Tracker>): void => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.updateTracker(data.uuid, data, SyncTo.UI);
});

socket.on("Shape.Options.Tracker.Move", (data: { shape: string; tracker: string; new_shape: string }): void => {
    const shape = layerManager.UUIDMap.get(data.shape);
    const newShape = layerManager.UUIDMap.get(data.new_shape);
    if (shape === undefined || newShape === undefined) return;
    const tracker = shape.getTrackers(false).find((t) => t.uuid === data.tracker);
    if (tracker === undefined) return;

    shape.removeTracker(tracker.uuid, SyncTo.UI);
    newShape.pushTracker(tracker, SyncTo.UI);
});

socket.on("Shape.Options.Aura.Move", (data: { shape: string; aura: string; new_shape: string }): void => {
    const shape = layerManager.UUIDMap.get(data.shape);
    const newShape = layerManager.UUIDMap.get(data.new_shape);
    if (shape === undefined || newShape === undefined) return;
    const aura = shape.getAuras(false).find((a) => a.uuid === data.aura);
    if (aura === undefined) return;

    shape.removeAura(aura.uuid, SyncTo.UI);
    newShape.pushAura(aura, SyncTo.UI);
});

socket.on("Shape.Options.Aura.Create", (data: ServerAura): void => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.pushAura(aurasFromServer(data)[0], SyncTo.UI);
});

socket.on("Shape.Options.Aura.Update", (data: { uuid: string; shape: string } & Partial<Aura>): void => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.updateAura(data.uuid, partialAuraFromServer(data), SyncTo.UI);
});

socket.on("Shape.Options.Invisible.Set", (data: { shape: string; value: boolean }) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.setInvisible(data.value, SyncTo.UI);
});
