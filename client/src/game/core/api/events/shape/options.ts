import type { ShapeSetBooleanValue, ShapeSetOptionalStringValue, ShapeSetStringValue } from "../../../../../apiTypes";
import { UI_SYNC } from "../../../../../core/models/types";
import type { Sync } from "../../../../../core/models/types";
import { getLocalId, getShape } from "../../../id";
import type { GlobalId, LocalId } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import { annotationSystem } from "../../../systems/annotations";
import { floorSystem } from "../../../systems/floors";
import { labelSystem } from "../../../systems/labels";
import { propertiesSystem } from "../../../systems/properties";
import { visionState } from "../../../vision/state";
import { socket } from "../../socket";

// todo: fix this discrepancy between SyncTo and sync

function wrapCall<T extends { shape: GlobalId; value: unknown }>(
    func: (id: LocalId, value: T["value"], sync: boolean) => void,
): (data: T) => void {
    return (data) => {
        const id = getLocalId(data.shape);
        if (id === undefined) return;
        func(id, data.value, false);
    };
}

function wrapSystemCall<T extends { shape: GlobalId; value: unknown }>(
    func: (id: LocalId, value: T["value"], syncTo: Sync) => void,
): (data: T) => void {
    return (data) => {
        const id = getLocalId(data.shape);
        if (id === undefined) return;
        func(id, data.value, UI_SYNC);
    };
}

socket.on("Shape.Options.Name.Set", wrapSystemCall(propertiesSystem.setName.bind(propertiesSystem)));

socket.on("Shape.Options.NameVisible.Set", wrapSystemCall(propertiesSystem.setNameVisible.bind(propertiesSystem)));

socket.on(
    "Shape.Options.Token.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setIsToken.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.Invisible.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setIsToken.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.Defeated.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setIsDefeated.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.StrokeColour.Set",
    wrapSystemCall<ShapeSetStringValue>(propertiesSystem.setStrokeColour.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.FillColour.Set",
    wrapSystemCall<ShapeSetStringValue>(propertiesSystem.setFillColour.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.VisionBlock.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setBlocksVision.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.MovementBlock.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setBlocksMovement.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.Locked.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setLocked.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.ShowBadge.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setShowBadge.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.Annotation.Set",
    wrapSystemCall<ShapeSetStringValue>(annotationSystem.setAnnotation.bind(annotationSystem)),
);

socket.on(
    "Shape.Options.AnnotationVisible.Set",
    wrapSystemCall<ShapeSetBooleanValue>(annotationSystem.setAnnotationVisible.bind(annotationSystem)),
);

socket.on("Shape.Options.Label.Add", wrapCall<ShapeSetStringValue>(labelSystem.addLabel.bind(labelSystem)));

socket.on("Shape.Options.Label.Remove", wrapCall<ShapeSetStringValue>(labelSystem.removeLabel.bind(labelSystem)));

socket.on("Shape.Options.SkipDraw.Set", (data: ShapeSetBooleanValue) => {
    const shapeId = getLocalId(data.shape);
    if (shapeId === undefined) return;
    const shape = getShape(shapeId);
    if (shape === undefined) return;
    if (shape.options === undefined) {
        shape.options = {};
    }
    shape.options.skipDraw = data.value;
});

socket.on("Shape.Options.SvgAsset.Set", async (data: ShapeSetOptionalStringValue) => {
    const shapeId = getLocalId(data.shape);
    if (shapeId === undefined) return;
    const shape = getShape(shapeId);
    if (shape === undefined) return;
    if (shape.options === undefined) {
        shape.options = {};
    }
    if (data.value === null) {
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
