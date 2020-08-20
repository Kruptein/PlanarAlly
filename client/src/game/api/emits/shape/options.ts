import { wrapSocket } from "../../helpers";
import { socket } from "../../socket";
import { ServerAura } from "../../../comm/types/shapes";

function sendShapeOption<T>(event: string): (data: { shape: string } & T) => void {
    return wrapSocket<{ shape: string } & T>(event);
}

function sendSimpleShapeOption<T>(event: string): (data: { shape: string; value: T }) => void {
    return sendShapeOption<{ value: T }>(event);
}

export const sendShapeSetInvisible = sendSimpleShapeOption<boolean>("Shape.Options.Invisible.Set");
export const sendShapeSetLocked = sendSimpleShapeOption<boolean>("Shape.Options.Locked.Set");
export const sendShapeSetIsToken = sendSimpleShapeOption<boolean>("Shape.Options.Token.Set");
export const sendShapeSetBlocksMovement = sendSimpleShapeOption<boolean>("Shape.Options.MovementBlock.Set");
export const sendShapeSetBlocksVision = sendSimpleShapeOption<boolean>("Shape.Options.VisionBlock.Set");
export const sendShapeSetNameVisible = sendSimpleShapeOption<boolean>("Shape.Options.NameVisible.Set");

export const sendShapeSetAnnotation = sendSimpleShapeOption<string>("Shape.Options.Annotation.Set");
export const sendShapeSetName = sendSimpleShapeOption<string>("Shape.Options.Name.Set");
export const sendShapeSetStrokeColour = sendSimpleShapeOption<string>("Shape.Options.StrokeColour.Set");
export const sendShapeSetFillColour = sendSimpleShapeOption<string>("Shape.Options.FillColour.Set");

export const sendShapeRemoveLabel = sendSimpleShapeOption<string>("Shape.Options.Label.Remove");
export const sendShapeRemoveAura = sendSimpleShapeOption<string>("Shape.Options.Aura.Remove");
export const sendShapeRemoveTracker = sendSimpleShapeOption<string>("Shape.Options.Tracker.Remove");

export const sendShapeUpdateTracker = (data: { shape_id: string; uuid: string; delta: Partial<Tracker> }): void => {
    socket.emit("Shape.Options.Tracker.UpdateOrCreate", data);
};

export const sendShapeUpdateAura = (data: { shape_id: string; uuid: string; delta: Partial<ServerAura> }): void => {
    socket.emit("Shape.Options.Aura.UpdateOrCreate", data);
};

export const sendShapeSetAuraVision = sendShapeOption<{ aura: string; value: boolean }>(
    "Shape.Options.Aura.Vision.Set",
);
