import type { ShapeSetBooleanValue, ShapeSetOptionalStringValue, ShapeSetStringValue } from "../../../../apiTypes";
import { wrapSocket } from "../../helpers";

export const sendShapeSetInvisible = wrapSocket<ShapeSetBooleanValue>("Shape.Options.Invisible.Set");
export const sendShapeSetDefeated = wrapSocket<ShapeSetBooleanValue>("Shape.Options.Defeated.Set");
export const sendShapeSetLocked = wrapSocket<ShapeSetBooleanValue>("Shape.Options.Locked.Set");
export const sendShapeSetIsToken = wrapSocket<ShapeSetBooleanValue>("Shape.Options.Token.Set");
export const sendShapeSetBlocksMovement = wrapSocket<ShapeSetBooleanValue>("Shape.Options.MovementBlock.Set");
export const sendShapeSetBlocksVision = wrapSocket<ShapeSetBooleanValue>("Shape.Options.VisionBlock.Set");
export const sendShapeSetNameVisible = wrapSocket<ShapeSetBooleanValue>("Shape.Options.NameVisible.Set");
export const sendShapeSetShowBadge = wrapSocket<ShapeSetBooleanValue>("Shape.Options.ShowBadge.Set");

export const sendShapeSetAnnotation = wrapSocket<ShapeSetStringValue>("Shape.Options.Annotation.Set");
export const sendShapeSetAnnotationVisible = wrapSocket<ShapeSetBooleanValue>("Shape.Options.AnnotationVisible.Set");
export const sendShapeSetName = wrapSocket<ShapeSetStringValue>("Shape.Options.Name.Set");
export const sendShapeSetStrokeColour = wrapSocket<ShapeSetStringValue>("Shape.Options.StrokeColour.Set");
export const sendShapeSetFillColour = wrapSocket<ShapeSetStringValue>("Shape.Options.FillColour.Set");
export const sendShapeAddLabel = wrapSocket<ShapeSetStringValue>("Shape.Options.Label.Add");

export const sendShapeRemoveLabel = wrapSocket<ShapeSetStringValue>("Shape.Options.Label.Remove");

export const sendShapeSkipDraw = wrapSocket<ShapeSetBooleanValue>("Shape.Options.SkipDraw.Set");
export const sendShapeSvgAsset = wrapSocket<ShapeSetOptionalStringValue>("Shape.Options.SvgAsset.Set");
