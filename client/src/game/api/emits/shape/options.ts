import type { GlobalId } from "../../../id";
import { wrapSocket } from "../../helpers";

export function sendShapeOption<T>(event: string): (data: { shape: string } & T) => void {
    return wrapSocket<{ shape: string } & T>(event);
}

export function sendSimpleShapeOption<T>(event: string): (data: { shape: GlobalId; value: T }) => void {
    return sendShapeOption<{ value: T }>(event);
}

export const sendShapeSetInvisible = sendSimpleShapeOption<boolean>("Shape.Options.Invisible.Set");
export const sendShapeSetDefeated = sendSimpleShapeOption<boolean>("Shape.Options.Defeated.Set");
export const sendShapeSetLocked = sendSimpleShapeOption<boolean>("Shape.Options.Locked.Set");
export const sendShapeSetIsToken = sendSimpleShapeOption<boolean>("Shape.Options.Token.Set");
export const sendShapeSetBlocksMovement = sendSimpleShapeOption<boolean>("Shape.Options.MovementBlock.Set");
export const sendShapeSetBlocksVision = sendSimpleShapeOption<boolean>("Shape.Options.VisionBlock.Set");
export const sendShapeSetNameVisible = sendSimpleShapeOption<boolean>("Shape.Options.NameVisible.Set");
export const sendShapeSetShowBadge = sendSimpleShapeOption<boolean>("Shape.Options.ShowBadge.Set");

export const sendShapeSetAnnotation = sendSimpleShapeOption<string>("Shape.Options.Annotation.Set");
export const sendShapeSetAnnotationVisible = sendSimpleShapeOption<boolean>("Shape.Options.AnnotationVisible.Set");
export const sendShapeSetName = sendSimpleShapeOption<string>("Shape.Options.Name.Set");
export const sendShapeSetStrokeColour = sendSimpleShapeOption<string>("Shape.Options.StrokeColour.Set");
export const sendShapeSetFillColour = sendSimpleShapeOption<string>("Shape.Options.FillColour.Set");
export const sendShapeAddLabel = sendSimpleShapeOption<string>("Shape.Options.Label.Add");

export const sendShapeRemoveLabel = sendSimpleShapeOption<string>("Shape.Options.Label.Remove");

export const sendShapeSkipDraw = sendSimpleShapeOption<boolean>("Shape.Options.SkipDraw.Set");
export const sendShapeSvgAsset = sendSimpleShapeOption<string | null>("Shape.Options.SvgAsset.Set");
