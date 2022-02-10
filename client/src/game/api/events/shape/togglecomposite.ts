import { SyncTo } from "../../../../core/models/types";
import { IdMap, UuidToIdMap } from "../../../../store/shapeMap";
import type { ToggleComposite } from "../../../shapes/variants/toggleComposite";
import { socket } from "../../socket";

socket.on("ToggleComposite.Variants.Active.Set", (data: { shape: string; variant: string }): void => {
    const shape = IdMap.get(UuidToIdMap.get(data.shape)!) as ToggleComposite;
    if (shape === undefined) return;
    shape.setActiveVariant(UuidToIdMap.get(data.variant)!, false);
});

socket.on("ToggleComposite.Variants.Add", (data: { shape: string; variant: string; name: string }): void => {
    const shape = IdMap.get(UuidToIdMap.get(data.shape)!) as ToggleComposite;
    if (shape === undefined) return;
    shape.addVariant(UuidToIdMap.get(data.variant)!, data.name, false);
});

socket.on("ToggleComposite.Variants.Rename", (data: { shape: string; variant: string; name: string }): void => {
    const shape = IdMap.get(UuidToIdMap.get(data.shape)!) as ToggleComposite;
    if (shape === undefined) return;
    shape.renameVariant(UuidToIdMap.get(data.variant)!, data.name, SyncTo.UI);
});

socket.on("ToggleComposite.Variants.Remove", (data: { shape: string; variant: string }): void => {
    const shape = IdMap.get(UuidToIdMap.get(data.shape)!) as ToggleComposite;
    if (shape === undefined) return;
    shape.removeVariant(UuidToIdMap.get(data.variant)!, SyncTo.UI);
});
