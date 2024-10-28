import type {
    ShapeSetBooleanValue,
    ShapeSetIntegerValue,
    ShapeSetOptionalStringValue,
    ShapeSetStringValue,
} from "../../../../apiTypes";
import { wrapSocket } from "../../helpers";

export const sendShapeSetInvisible = wrapSocket<ShapeSetBooleanValue>("Shape.Options.Invisible.Set");
export const sendShapeSetDefeated = wrapSocket<ShapeSetBooleanValue>("Shape.Options.Defeated.Set");
export const sendShapeSetLocked = wrapSocket<ShapeSetBooleanValue>("Shape.Options.Locked.Set");
export const sendShapeSetIsToken = wrapSocket<ShapeSetBooleanValue>("Shape.Options.Token.Set");
export const sendShapeSetBlocksMovement = wrapSocket<ShapeSetBooleanValue>("Shape.Options.MovementBlock.Set");
export const sendShapeSetBlocksVision = wrapSocket<ShapeSetIntegerValue>("Shape.Options.VisionBlock.Set");
export const sendShapeSetNameVisible = wrapSocket<ShapeSetBooleanValue>("Shape.Options.NameVisible.Set");
export const sendShapeSetShowBadge = wrapSocket<ShapeSetBooleanValue>("Shape.Options.ShowBadge.Set");

export const sendShapeSetName = wrapSocket<ShapeSetStringValue>("Shape.Options.Name.Set");
export const sendShapeSetStrokeColour = wrapSocket<ShapeSetStringValue>("Shape.Options.StrokeColour.Set");
export const sendShapeSetFillColour = wrapSocket<ShapeSetStringValue>("Shape.Options.FillColour.Set");

export const sendShapeSkipDraw = wrapSocket<ShapeSetBooleanValue>("Shape.Options.SkipDraw.Set");
export const sendShapeSvgAsset = wrapSocket<ShapeSetOptionalStringValue>("Shape.Options.SvgAsset.Set");

// grid related
export const sendShapeSetSize = wrapSocket<ShapeSetIntegerValue>("Shape.Options.Size.Set");
export const sendShapeSetShowCells = wrapSocket<ShapeSetBooleanValue>("Shape.Options.ShowCells.Set");
export const sendShapeSetCellFillColour = wrapSocket<ShapeSetStringValue>("Shape.Options.CellFillColour.Set");
export const sendShapeSetCellStrokeColour = wrapSocket<ShapeSetStringValue>("Shape.Options.CellStrokeColour.Set");
export const sendShapeSetCellStrokeWidth = wrapSocket<ShapeSetIntegerValue>("Shape.Options.CellStrokeWidth.Set");
export const sendShapeSetOddHexOrientation = wrapSocket<ShapeSetBooleanValue>("Shape.Options.OddHexOrientation.Set");
