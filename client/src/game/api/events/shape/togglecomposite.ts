import { SyncTo } from "../../../../core/models/types";
import { UuidMap } from "../../../../store/shapeMap";
import type { ToggleComposite } from "../../../shapes/variants/toggleComposite";
import { socket } from "../../socket";

socket.on("ToggleComposite.Variants.Active.Set", (data: { shape: string; variant: string }): void => {
    const shape = UuidMap.get(data.shape) as ToggleComposite;
    if (shape === undefined) return;
    shape.setActiveVariant(data.variant, false);
});

socket.on("ToggleComposite.Variants.Add", (data: { shape: string; variant: string; name: string }): void => {
    const shape = UuidMap.get(data.shape) as ToggleComposite;
    if (shape === undefined) return;
    shape.addVariant(data.variant, data.name, false);
});

socket.on("ToggleComposite.Variants.Rename", (data: { shape: string; variant: string; name: string }): void => {
    const shape = UuidMap.get(data.shape) as ToggleComposite;
    if (shape === undefined) return;
    shape.renameVariant(data.variant, data.name, SyncTo.UI);
});

socket.on("ToggleComposite.Variants.Remove", (data: { shape: string; variant: string }): void => {
    const shape = UuidMap.get(data.shape) as ToggleComposite;
    if (shape === undefined) return;
    shape.removeVariant(data.variant, SyncTo.UI);
});
