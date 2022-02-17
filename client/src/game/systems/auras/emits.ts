import { sendShapeOption, sendSimpleShapeOption } from "../../api/emits/shape/options";
import { socket } from "../../api/socket";

import type { AuraId, ServerAura } from "./models";

export const sendShapeMoveAura = sendShapeOption<{ aura: AuraId; new_shape: string }>("Shape.Options.Aura.Move");
export const sendShapeRemoveAura = sendSimpleShapeOption<AuraId>("Shape.Options.Aura.Remove");

export const sendShapeCreateAura = (data: ServerAura): void => {
    socket.emit("Shape.Options.Aura.Create", data);
};

export const sendShapeUpdateAura = (data: { shape: string; uuid: AuraId } & Partial<ServerAura>): void => {
    socket.emit("Shape.Options.Aura.Update", data);
};
