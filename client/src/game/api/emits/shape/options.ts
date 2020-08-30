import { wrapSocket } from "../../helpers";
import { socket } from "../../socket";
import { ServerAura, ServerTracker } from "../../../comm/types/shapes";

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
export const sendShapeSetShowBadge = sendSimpleShapeOption<boolean>("Shape.Options.ShowBadge.Set");

export const sendShapeSetAnnotation = sendSimpleShapeOption<string>("Shape.Options.Annotation.Set");
export const sendShapeSetName = sendSimpleShapeOption<string>("Shape.Options.Name.Set");
export const sendShapeSetStrokeColour = sendSimpleShapeOption<string>("Shape.Options.StrokeColour.Set");
export const sendShapeSetFillColour = sendSimpleShapeOption<string>("Shape.Options.FillColour.Set");

export const sendShapeRemoveLabel = sendSimpleShapeOption<string>("Shape.Options.Label.Remove");
export const sendShapeRemoveAura = sendSimpleShapeOption<string>("Shape.Options.Aura.Remove");
export const sendShapeRemoveTracker = sendSimpleShapeOption<string>("Shape.Options.Tracker.Remove");

export const sendShapeCreateTracker = (data: ServerTracker): void => {
    socket.emit("Shape.Options.Tracker.Create", data);
};

export const sendShapeUpdateTracker = (data: { shape: string; uuid: string } & Partial<ServerTracker>): void => {
    socket.emit("Shape.Options.Tracker.Update", data);
};

export const sendShapeCreateAura = (data: ServerAura): void => {
    socket.emit("Shape.Options.Aura.Create", data);
};

export const sendShapeUpdateAura = (data: { shape: string; uuid: string } & Partial<ServerAura>): void => {
    socket.emit("Shape.Options.Aura.Update", data);
};

export const sendShapeSetAuraVision = sendShapeOption<{ aura: string; value: boolean }>(
    "Shape.Options.Aura.Vision.Set",
);
