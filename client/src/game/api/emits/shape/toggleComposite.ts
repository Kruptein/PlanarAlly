import type { ToggleCompositeNewVariant, ToggleCompositeVariant } from "../../../../apiTypes";
import { wrapSocket } from "../../socket";

export const sendToggleCompositeActiveVariant = wrapSocket<ToggleCompositeVariant>(
    "ToggleComposite.Variants.Active.Set",
);

export const sendToggleCompositeAddVariant = wrapSocket<ToggleCompositeNewVariant>("ToggleComposite.Variants.Add");

export const sendToggleCompositeRenameVariant = wrapSocket<ToggleCompositeNewVariant>(
    "ToggleComposite.Variants.Rename",
);

export const sendToggleCompositeRemoveVariant = wrapSocket<ToggleCompositeVariant>("ToggleComposite.Variants.Remove");
