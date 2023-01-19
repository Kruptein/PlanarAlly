import type { ApiAura } from "../../../apiTypes";
import { sendShapeOption, sendSimpleShapeOption } from "../../api/emits/shape/options";
import { socket } from "../../api/socket";

import type { AuraId } from "./models";

export const sendShapeMoveAura = sendShapeOption<{ aura: AuraId; new_shape: string }>("Shape.Options.Aura.Move");
export const sendShapeRemoveAura = sendSimpleShapeOption<AuraId>("Shape.Options.Aura.Remove");

export const sendShapeCreateAura = (data: ApiAura): void => {
    socket.emit("Shape.Options.Aura.Create", data);
};

export const sendShapeUpdateAura = (data: { shape: string; uuid: AuraId } & Partial<ApiAura>): void => {
    socket.emit("Shape.Options.Aura.Update", data);
};
