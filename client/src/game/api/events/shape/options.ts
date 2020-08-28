import { aurasFromServer, partialAuraFromServer } from "../../../comm/conversion/aura";
import { ServerAura, ServerTracker } from "../../../comm/types/shapes";
import { layerManager } from "../../../layers/manager";
import { Shape } from "../../../shapes/shape";
import { socket } from "../../socket";

function wrapCall<T>(func: (value: T, sync: boolean) => void): (data: { shape: string; value: T }) => void {
    return data => {
        const shape = layerManager.UUIDMap.get(data.shape);
        if (shape === undefined) return;
        func.bind(shape)(data.value, false);
    };
}

socket.on("Shape.Options.Invisible.Set", wrapCall(Shape.prototype.setInvisible));
socket.on("Shape.Options.Locked.Set", wrapCall(Shape.prototype.setLocked));
socket.on("Shape.Options.Token.Set", wrapCall(Shape.prototype.setIsToken));
socket.on("Shape.Options.MovementBlock.Set", wrapCall(Shape.prototype.setMovementBlock));
socket.on("Shape.Options.VisionBlock.Set", wrapCall(Shape.prototype.setVisionBlock));
socket.on("Shape.Options.Annotation.Set", wrapCall(Shape.prototype.setAnnotation));
socket.on("Shape.Options.Name.Set", wrapCall(Shape.prototype.setName));
socket.on("Shape.Options.NameVisible.Set", wrapCall(Shape.prototype.setNameVisible));
socket.on("Shape.Options.StrokeColour.Set", wrapCall(Shape.prototype.setStrokeColour));
socket.on("Shape.Options.FillColour.Set", wrapCall(Shape.prototype.setFillColour));
socket.on("Shape.Options.ShowBadge.Set", wrapCall(Shape.prototype.setShowBadge));

socket.on("Shape.Options.Tracker.Remove", wrapCall(Shape.prototype.removeTracker));
socket.on("Shape.Options.Aura.Remove", wrapCall(Shape.prototype.removeAura));
socket.on("Shape.Options.Label.Remove", wrapCall(Shape.prototype.removeLabel));

socket.on("Shape.Options.Tracker.Create", (data: ServerTracker): void => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.pushTracker({ temporary: false, ...data });
});

socket.on("Shape.Options.Tracker.Update", (data: { uuid: string; shape: string } & Partial<Tracker>): void => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.updateTracker(data.uuid, data, false);
});

socket.on("Shape.Options.Aura.Create", (data: ServerAura): void => {
    console.log(data);
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.pushAura(aurasFromServer([data])[0]);
});

socket.on("Shape.Options.Aura.Update", (data: { uuid: string; shape: string } & Partial<Aura>): void => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.updateAura(data.uuid, partialAuraFromServer(data), false);
});

socket.on("Shape.Options.Invisible.Set", (data: { shape: string; value: boolean }) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.setInvisible(data.value, false);
});
socket.on("Shape.Options.Invisible.Set", wrapCall(Shape.prototype.setInvisible));
