import { UI_SYNC } from "../../../../core/models/types";
import { getLocalId, getShape } from "../../../id";
import type { GlobalId } from "../../../id";
import type { ToggleComposite } from "../../../shapes/variants/toggleComposite";
import { socket } from "../../socket";

socket.on("ToggleComposite.Variants.Active.Set", (data: { shape: GlobalId; variant: GlobalId }): void => {
    const shape = getShape(getLocalId(data.shape)!) as ToggleComposite;
    if (shape === undefined) return;
    shape.setActiveVariant(getLocalId(data.variant)!, false);
});

socket.on("ToggleComposite.Variants.Add", (data: { shape: GlobalId; variant: GlobalId; name: string }): void => {
    const shape = getShape(getLocalId(data.shape)!) as ToggleComposite;
    if (shape === undefined) return;
    shape.addVariant(getLocalId(data.variant)!, data.name, false);
});

socket.on("ToggleComposite.Variants.Rename", (data: { shape: GlobalId; variant: GlobalId; name: string }): void => {
    const shape = getShape(getLocalId(data.shape)!) as ToggleComposite;
    if (shape === undefined) return;
    shape.renameVariant(getLocalId(data.variant)!, data.name, UI_SYNC);
});

socket.on("ToggleComposite.Variants.Remove", (data: { shape: GlobalId; variant: GlobalId }): void => {
    const shape = getShape(getLocalId(data.shape)!) as ToggleComposite;
    if (shape === undefined) return;
    shape.removeVariant(getLocalId(data.variant)!, UI_SYNC);
});
