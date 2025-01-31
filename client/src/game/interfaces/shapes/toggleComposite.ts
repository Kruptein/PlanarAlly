import type { LocalId } from "../../../core/id";
import type { Sync } from "../../../core/models/types";
import type { IShape } from "../shape";

export interface IToggleComposite extends IShape {
    get variants(): readonly { id: LocalId; name: string }[];
    get activeVariant(): LocalId;

    addVariant: (uuid: LocalId, name: string, sync: boolean) => void;
    removeVariant: (id: LocalId, syncTo: Sync) => void;
    renameVariant: (uuid: LocalId, name: string, syncTo: Sync) => void;
    setActiveVariant: (variant: LocalId, sync: boolean) => void;
}
