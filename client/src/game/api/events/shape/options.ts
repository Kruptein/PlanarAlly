import { UI_SYNC } from "../../../../core/models/types";
import type { Sync } from "../../../../core/models/types";
import { floorStore } from "../../../../store/floor";
import { getLocalId, getShape } from "../../../id";
import type { GlobalId } from "../../../id";
import { Shape } from "../../../shapes/shape";
import type { Asset } from "../../../shapes/variants/asset";
import { visionState } from "../../../vision/state";
import { socket } from "../../socket";

function wrapCall<T>(func: (value: T, syncTo: Sync) => void): (data: { shape: GlobalId; value: T }) => void {
    return (data) => {
        const shape = getShape(getLocalId(data.shape)!);
        if (shape === undefined) return;
        func.bind(shape)(data.value, UI_SYNC);
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
    shape.setInvisible(data.value, UI_SYNC);
});

socket.on("Shape.Options.Defeated.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.setDefeated(data.value, UI_SYNC);
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
        visionState.recalculateVision(shape.floor.id);
        floorStore.invalidate({ id: shape.floor.id });
    } else {
        shape.options.svgAsset = data.value;
        (shape as Asset).loadSvgs();
    }
});
