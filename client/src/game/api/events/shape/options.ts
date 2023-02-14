import { UI_SYNC } from "../../../../core/models/types";
import type { Sync } from "../../../../core/models/types";
import { getLocalId, getShape } from "../../../id";
import type { GlobalId, LocalId } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import { annotationSystem, AnnotationSystem } from "../../../systems/annotations";
import { floorSystem } from "../../../systems/floors";
import { labelSystem, LabelSystem } from "../../../systems/labels";
import { propertiesSystem, PropertiesSystem } from "../../../systems/properties";
import { visionState } from "../../../vision/state";
import { socket } from "../../socket";

// todo: fix this discrepancy between SyncTo and sync

function wrapCall<T>(
    func: (id: LocalId, value: T, sync: boolean) => void,
): (data: { shape: GlobalId; value: T }) => void {
    return (data) => {
        const id = getLocalId(data.shape);
        if (id === undefined) return;
        func(id, data.value, false);
    };
}

function wrapSystemCall<T>(
    func: (id: LocalId, value: T, syncTo: Sync) => void,
): (data: { shape: GlobalId; value: T }) => void {
    return (data) => {
        const id = getLocalId(data.shape);
        if (id === undefined) return;
        func(id, data.value, UI_SYNC);
    };
}

socket.on("Shape.Options.Name.Set", wrapSystemCall(PropertiesSystem.prototype.setName.bind(propertiesSystem)));

socket.on(
    "Shape.Options.NameVisible.Set",
    wrapSystemCall(PropertiesSystem.prototype.setNameVisible.bind(propertiesSystem)),
);

socket.on("Shape.Options.Token.Set", wrapSystemCall(PropertiesSystem.prototype.setIsToken.bind(propertiesSystem)));

socket.on(
    "Shape.Options.Invisible.Set",
    wrapSystemCall(PropertiesSystem.prototype.setIsInvisible.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.Defeated.Set",
    wrapSystemCall(PropertiesSystem.prototype.setIsDefeated.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.StrokeColour.Set",
    wrapSystemCall(PropertiesSystem.prototype.setStrokeColour.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.FillColour.Set",
    wrapSystemCall(PropertiesSystem.prototype.setFillColour.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.VisionBlock.Set",
    wrapSystemCall(PropertiesSystem.prototype.setBlocksVision.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.MovementBlock.Set",
    wrapSystemCall(PropertiesSystem.prototype.setBlocksMovement.bind(propertiesSystem)),
);

socket.on("Shape.Options.Locked.Set", wrapSystemCall(PropertiesSystem.prototype.setLocked.bind(propertiesSystem)));

socket.on(
    "Shape.Options.ShowBadge.Set",
    wrapSystemCall(PropertiesSystem.prototype.setShowBadge.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.Annotation.Set",
    wrapSystemCall(AnnotationSystem.prototype.setAnnotation.bind(annotationSystem)),
);

socket.on(
    "Shape.Options.AnnotationVisible.Set",
    wrapSystemCall(AnnotationSystem.prototype.setAnnotationVisible.bind(annotationSystem)),
);

socket.on("Shape.Options.Label.Add", wrapCall(LabelSystem.prototype.addLabel.bind(labelSystem)));

socket.on("Shape.Options.Label.Remove", wrapCall(LabelSystem.prototype.removeLabel.bind(labelSystem)));

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

socket.on("Shape.Options.SvgAsset.Set", async (data: { shape: GlobalId; value: string | undefined }) => {
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
        const floorId = shape.floorId;
        if (floorId !== undefined) {
            visionState.recalculateVision(floorId);
            floorSystem.invalidate({ id: floorId });
        }
    } else {
        shape.options.svgAsset = data.value;
        await (shape as IAsset).loadSvgs();
    }
});
