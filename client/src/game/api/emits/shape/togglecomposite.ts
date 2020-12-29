import { wrapSocket } from "../../helpers";

export const sendToggleCompositeActiveVariant = wrapSocket<{ shape: string; variant: string }>(
    "ToggleComposite.Variants.Active.Set",
);

export const sendToggleCompositeAddVariant = wrapSocket<{ shape: string; variant: string; name: string }>(
    "ToggleComposite.Variants.Add",
);

export const sendToggleCompositeRenameVariant = wrapSocket<{ shape: string; variant: string; name: string }>(
    "ToggleComposite.Variants.Rename",
);

export const sendToggleCompositeRemoveVariant = wrapSocket<{ shape: string; variant: string }>(
    "ToggleComposite.Variants.Remove",
);
