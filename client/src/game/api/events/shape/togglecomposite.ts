import { SyncTo } from "../../../../core/models/types";
import { layerManager } from "../../../layers/manager";
import { ToggleComposite } from "../../../shapes/variants/togglecomposite";
import { socket } from "../../socket";

socket.on("ToggleComposite.Variants.Active.Set", (data: { shape: string; variant: string }): void => {
    const shape = layerManager.UUIDMap.get(data.shape) as ToggleComposite;
    if (shape === undefined) return;
    shape.setActiveVariant(data.variant, false);
});

socket.on("ToggleComposite.Variants.Add", (data: { shape: string; variant: string; name: string }): void => {
    const shape = layerManager.UUIDMap.get(data.shape) as ToggleComposite;
    if (shape === undefined) return;
    shape.addVariant(data.variant, data.name, false);
});

socket.on("ToggleComposite.Variants.Rename", (data: { shape: string; variant: string; name: string }): void => {
    const shape = layerManager.UUIDMap.get(data.shape) as ToggleComposite;
    if (shape === undefined) return;
    shape.renameVariant(data.variant, data.name, SyncTo.UI);
});

socket.on("ToggleComposite.Variants.Remove", (data: { shape: string; variant: string }): void => {
    const shape = layerManager.UUIDMap.get(data.shape) as ToggleComposite;
    if (shape === undefined) return;
    shape.removeVariant(data.variant, SyncTo.UI);
});
