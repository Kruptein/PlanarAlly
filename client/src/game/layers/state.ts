import type { LocalId } from "../../core/id";
import { sendToggleCompositeAddVariant } from "../api/emits/shape/toggleComposite";
import { getGlobalId, getShape } from "../id";
import type { IShape } from "../interfaces/shape";
import type { IToggleComposite } from "../interfaces/shapes/toggleComposite";

class CompositeState {
    private compositeMap = new Map<LocalId, LocalId>();

    clear(): void {
        this.compositeMap.clear();
    }

    getCompositeParent(variant: LocalId): IToggleComposite | undefined {
        const shape_uuid = this.compositeMap.get(variant);
        if (shape_uuid !== undefined) {
            return getShape(shape_uuid) as IToggleComposite;
        }
        return undefined;
    }

    addComposite(parent: LocalId, variant: { id: LocalId; name: string }, sync: boolean): void {
        const gId = getGlobalId(parent);
        const gIdVariant = getGlobalId(variant.id);

        if (gId === undefined || gIdVariant === undefined) {
            console.error("Composite globalId error");
            return;
        }

        this.compositeMap.set(variant.id, parent);
        if (sync) {
            sendToggleCompositeAddVariant({
                shape: gId,
                variant: gIdVariant,
                name: variant.name,
            });
        }
    }

    addAllCompositeShapes(shapes: readonly IShape[]): readonly IShape[] {
        const shapeUuids = new Set<LocalId>(shapes.map((s) => s.id));
        const allShapes = [...shapes];
        for (const shape of this.compositeMap.keys()) {
            if (shapes.some((s) => s.id === shape)) {
                const parent = this.getCompositeParent(shape);
                if (parent === undefined) {
                    console.warn("Missing composite parent");
                    continue;
                }
                if (shapeUuids.has(parent.id)) continue;
                shapeUuids.add(parent.id);
                allShapes.push(parent);
                for (const variant of parent.variants) {
                    if (shapeUuids.has(variant.id)) {
                        continue;
                    } else {
                        shapeUuids.add(variant.id);
                        allShapes.push(getShape(variant.id)!);
                    }
                }
            }
        }
        return allShapes;
    }
}

export const compositeState = new CompositeState();
