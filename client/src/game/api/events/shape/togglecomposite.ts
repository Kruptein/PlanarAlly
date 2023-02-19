import type { ToggleCompositeNewVariant, ToggleCompositeVariant } from "../../../../apiTypes";
import { UI_SYNC } from "../../../../core/models/types";
import { getLocalId, getShape } from "../../../id";
import type { IToggleComposite } from "../../../interfaces/shapes/toggleComposite";
import { socket } from "../../socket";

socket.on("ToggleComposite.Variants.Active.Set", (data: ToggleCompositeVariant): void => {
    const shape = getShape(getLocalId(data.shape)!) as IToggleComposite;
    if (shape === undefined) return;
    shape.setActiveVariant(getLocalId(data.variant)!, false);
});

socket.on("ToggleComposite.Variants.Add", (data: ToggleCompositeNewVariant): void => {
    const shape = getShape(getLocalId(data.shape)!) as IToggleComposite;
    if (shape === undefined) return;
    shape.addVariant(getLocalId(data.variant)!, data.name, false);
});

socket.on("ToggleComposite.Variants.Rename", (data: ToggleCompositeNewVariant): void => {
    const shape = getShape(getLocalId(data.shape)!) as IToggleComposite;
    if (shape === undefined) return;
    shape.renameVariant(getLocalId(data.variant)!, data.name, UI_SYNC);
});

socket.on("ToggleComposite.Variants.Remove", (data: ToggleCompositeVariant): void => {
    const shape = getShape(getLocalId(data.shape)!) as IToggleComposite;
    if (shape === undefined) return;
    shape.removeVariant(getLocalId(data.variant)!, UI_SYNC);
});
