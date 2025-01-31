import type {
    ShapeSetBooleanValue,
    ShapeSetIntegerValue,
    ShapeSetOptionalStringValue,
    ShapeSetStringValue,
} from "../../../../apiTypes";
import type { GlobalId, LocalId } from "../../../../core/id";
import { UI_SYNC } from "../../../../core/models/types";
import type { Sync } from "../../../../core/models/types";
import { getLocalId, getShape } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import { floorSystem } from "../../../systems/floors";
import { propertiesSystem } from "../../../systems/properties";
import { visionState } from "../../../vision/state";
import { socket } from "../../socket";

// todo: fix this discrepancy between SyncTo and sync

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
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setIsInvisible.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.Defeated.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setIsDefeated.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.OddHexOrientation.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setOddHexOrientation.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.Size.Set",
    wrapSystemCall<ShapeSetIntegerValue>(propertiesSystem.setSize.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.ShowCells.Set",
    wrapSystemCall<ShapeSetBooleanValue>(propertiesSystem.setShowCells.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.CellStrokeWidth.Set",
    wrapSystemCall<ShapeSetIntegerValue>(propertiesSystem.setCellStrokeWidth.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.CellStrokeColour.Set",
    wrapSystemCall<ShapeSetStringValue>(propertiesSystem.setCellStrokeColour.bind(propertiesSystem)),
);

socket.on(
    "Shape.Options.CellFillColour.Set",
    wrapSystemCall<ShapeSetStringValue>(propertiesSystem.setCellFillColour.bind(propertiesSystem)),
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
    wrapSystemCall<ShapeSetIntegerValue>(propertiesSystem.setBlocksVision.bind(propertiesSystem)),
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
