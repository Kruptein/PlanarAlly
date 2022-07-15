import { UI_SYNC } from "../../../../core/models/types";
import type { Sync } from "../../../../core/models/types";
import { getLocalId, getShape } from "../../../id";
import type { LocalId } from "../../../id";
import type { GlobalId } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import { Shape } from "../../../shapes/shape";
import { AnnotationSystem } from "../../../systems/annotations";
import { floorSystem } from "../../../systems/floors";
import { propertiesSystem, PropertiesSystem } from "../../../systems/properties";
import { visionState } from "../../../vision/state";
import { socket } from "../../socket";

function wrapCall<T>(func: (value: T, syncTo: Sync) => void): (data: { shape: GlobalId; value: T }) => void {
    return (data) => {
        const shape = getShape(getLocalId(data.shape)!);
        if (shape === undefined) return;
        func.bind(shape)(data.value, UI_SYNC);
    };
}

function wrapSystemCall<T>(
    func: (id: LocalId, value: T, syncTo: Sync) => void,
): (data: { shape: GlobalId; value: T }) => void {
    return (data) => {
        const id = getLocalId(data.shape);
        if (id === undefined) return;
        func.bind(propertiesSystem)(id, data.value, UI_SYNC);
    };
}

socket.on("Shape.Options.Name.Set", wrapSystemCall(PropertiesSystem.prototype.setName));
socket.on("Shape.Options.NameVisible.Set", wrapSystemCall(PropertiesSystem.prototype.setNameVisible));
socket.on("Shape.Options.Token.Set", wrapSystemCall(PropertiesSystem.prototype.setIsToken));
socket.on("Shape.Options.Invisible.Set", wrapSystemCall(PropertiesSystem.prototype.setIsInvisible));
socket.on("Shape.Options.Defeated.Set", wrapSystemCall(PropertiesSystem.prototype.setIsDefeated));
socket.on("Shape.Options.StrokeColour.Set", wrapSystemCall(PropertiesSystem.prototype.setStrokeColour));
socket.on("Shape.Options.FillColour.Set", wrapSystemCall(PropertiesSystem.prototype.setFillColour));
socket.on("Shape.Options.VisionBlock.Set", wrapSystemCall(PropertiesSystem.prototype.setBlocksVision));
socket.on("Shape.Options.MovementBlock.Set", wrapSystemCall(PropertiesSystem.prototype.setBlocksMovement));
socket.on("Shape.Options.Locked.Set", wrapSystemCall(PropertiesSystem.prototype.setLocked));
socket.on("Shape.Options.ShowBadge.Set", wrapSystemCall(PropertiesSystem.prototype.setShowBadge));

socket.on("Shape.Options.Annotation.Set", wrapSystemCall(AnnotationSystem.prototype.setAnnotation));
socket.on("Shape.Options.AnnotationVisible.Set", wrapSystemCall(AnnotationSystem.prototype.setAnnotationVisible));
socket.on("Shape.Options.Label.Add", wrapCall(Shape.prototype.addLabel));

socket.on("Shape.Options.Label.Remove", wrapCall(Shape.prototype.removeLabel));

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
        floorSystem.invalidate({ id: shape.floor.id });
    } else {
        shape.options.svgAsset = data.value;
        (shape as IAsset).loadSvgs();
    }
});
