import { SyncTo } from "../../../../core/models/types";
import { getLocalId, getShape } from "../../../id";
import type { GlobalId } from "../../../id";
import { aurasFromServer, partialAuraFromServer } from "../../../models/conversion/aura";
import { trackersFromServer, partialTrackerFromServer } from "../../../models/conversion/tracker";
import type { ServerAura, ServerTracker } from "../../../models/shapes";
import type { Aura, Tracker } from "../../../shapes/interfaces";
import { Shape } from "../../../shapes/shape";
import { doorSystem } from "../../../systems/logic/door";
import { socket } from "../../socket";

function wrapCall<T>(func: (value: T, syncTo: SyncTo) => void): (data: { shape: GlobalId; value: T }) => void {
    return (data) => {
        const shape = getShape(getLocalId(data.shape)!);
        if (shape === undefined) return;
        func.bind(shape)(data.value, SyncTo.UI);
    };
}

socket.on("Shape.Options.Name.Set", wrapCall(Shape.prototype.setName));
socket.on("Shape.Options.NameVisible.Set", wrapCall(Shape.prototype.setNameVisible));
socket.on("Shape.Options.Token.Set", wrapCall(Shape.prototype.setIsToken));
socket.on("Shape.Options.Invisible.Set", wrapCall(Shape.prototype.setInvisible));
socket.on("Shape.Options.Defeated.Set", wrapCall(Shape.prototype.setDefeated));
socket.on("Shape.Options.StrokeColour.Set", wrapCall(Shape.prototype.setStrokeColour));
socket.on("Shape.Options.FillColour.Set", wrapCall(Shape.prototype.setFillColour));
socket.on("Shape.Options.VisionBlock.Set", wrapCall(Shape.prototype.setBlocksVision));
socket.on("Shape.Options.MovementBlock.Set", wrapCall(Shape.prototype.setBlocksMovement));
socket.on("Shape.Options.Locked.Set", wrapCall(Shape.prototype.setLocked));
socket.on("Shape.Options.ShowBadge.Set", wrapCall(Shape.prototype.setShowBadge));

socket.on("Shape.Options.Annotation.Set", wrapCall(Shape.prototype.setAnnotation));
socket.on("Shape.Options.Label.Add", wrapCall(Shape.prototype.addLabel));

socket.on("Shape.Options.Tracker.Remove", wrapCall(Shape.prototype.removeTracker));
socket.on("Shape.Options.Aura.Remove", wrapCall(Shape.prototype.removeAura));
socket.on("Shape.Options.Label.Remove", wrapCall(Shape.prototype.removeLabel));

socket.on("Shape.Options.Tracker.Create", (data: ServerTracker): void => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.pushTracker(trackersFromServer(data)[0], SyncTo.UI);
});

socket.on("Shape.Options.Tracker.Update", (data: { uuid: string; shape: GlobalId } & Partial<Tracker>): void => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.updateTracker(data.uuid, partialTrackerFromServer(data), SyncTo.UI);
});

socket.on("Shape.Options.Tracker.Move", (data: { shape: GlobalId; tracker: string; new_shape: GlobalId }): void => {
    const shape = getShape(getLocalId(data.shape)!);
    const newShape = getShape(getLocalId(data.new_shape)!);
    if (shape === undefined || newShape === undefined) return;
    const tracker = shape.getTrackers(false).find((t) => t.uuid === data.tracker);
    if (tracker === undefined) return;

    shape.removeTracker(tracker.uuid, SyncTo.UI);
    newShape.pushTracker(tracker, SyncTo.UI);
});

socket.on("Shape.Options.Aura.Move", (data: { shape: GlobalId; aura: string; new_shape: GlobalId }): void => {
    const shape = getShape(getLocalId(data.shape)!);
    const newShape = getShape(getLocalId(data.new_shape)!);
    if (shape === undefined || newShape === undefined) return;
    const aura = shape.getAuras(false).find((a) => a.uuid === data.aura);
    if (aura === undefined) return;

    shape.removeAura(aura.uuid, SyncTo.UI);
    newShape.pushAura(aura, SyncTo.UI);
});

socket.on("Shape.Options.Aura.Create", (data: ServerAura): void => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.pushAura(aurasFromServer(data)[0], SyncTo.UI);
});

socket.on("Shape.Options.Aura.Update", (data: { uuid: string; shape: GlobalId } & Partial<Aura>): void => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.updateAura(data.uuid, partialAuraFromServer(data), SyncTo.UI);
});

socket.on("Shape.Options.Invisible.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.setInvisible(data.value, SyncTo.UI);
});

socket.on("Shape.Options.Defeated.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.setDefeated(data.value, SyncTo.UI);
});

socket.on("Shape.Options.IsDoor.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.toggle(shape, data.value, SyncTo.UI);
});
