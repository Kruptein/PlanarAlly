import { SyncTo } from "../../../../core/models/types";
import { getLocalId, getShape } from "../../../id";
import type { GlobalId } from "../../../id";
import { Shape } from "../../../shapes/shape";
import { doorSystem } from "../../../systems/logic/door";
import type { Permissions, TeleportOptions } from "../../../systems/logic/models";
import { teleportZoneSystem } from "../../../systems/logic/teleportZone";
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

socket.on("Shape.Options.Label.Remove", wrapCall(Shape.prototype.removeLabel));

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

socket.on("Shape.Options.DoorPermissions.Set", (data: { shape: GlobalId; value: Permissions }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.setPermissions(shape, data.value, SyncTo.UI);
});

socket.on("Shape.Options.IsTeleportZone.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.toggle(shape, data.value, SyncTo.UI);
});

socket.on("Shape.Options.IsImmediateTeleportZone.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.toggleImmediate(shape, data.value, SyncTo.UI);
});

socket.on("Shape.Options.TeleportZonePermissions.Set", (data: { shape: GlobalId; value: Permissions }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.setPermissions(shape, data.value, SyncTo.UI);
});

socket.on("Shape.Options.TeleportZoneTarget.Set", (data: { shape: GlobalId; value: TeleportOptions["location"] }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.setTarget(shape, data.value, SyncTo.UI);
});

socket.on("Shape.Options.SkipDraw.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shapeId = getLocalId(data.shape);
    if (shapeId === undefined) return;
    const shape = getShape(shapeId);
    if (shape === undefined) return;
    if (shape.options === undefined) {
        shape.options = {};
    }
    shape.options.skipDraw = data.value;
});

socket.on("Shape.Options.SvgAsset.Set", (data: { shape: GlobalId; value: string | undefined }) => {
    const shapeId = getLocalId(data.shape);
    if (shapeId === undefined) return;
    const shape = getShape(shapeId);
    if (shape === undefined) return;
    if (shape.options === undefined) {
        shape.options = {};
    }
    if (data.value === undefined) {
        delete shape.options.svgAsset;
        delete shape.options.svgHeight;
        delete shape.options.svgPaths;
        delete shape.options.svgWidth;
    } else {
        shape.options.svgAsset = data.value;
    }
});
