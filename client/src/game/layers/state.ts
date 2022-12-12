import { sendToggleCompositeAddVariant } from "../api/emits/shape/toggleComposite";
import { getGlobalId, getShape } from "../id";
import type { LocalId } from "../id";
import type { IShape } from "../interfaces/shape";
import type { IToggleComposite } from "../interfaces/shapes/toggleComposite";

class CompositeState {
    private compositeMap: Map<LocalId, LocalId> = new Map();

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
        this.compositeMap.set(variant.id, parent);
        if (sync) {
            sendToggleCompositeAddVariant({
                shape: getGlobalId(parent),
                variant: getGlobalId(variant.id),
                name: variant.name,
            });
        }
    }

    addAllCompositeShapes(shapes: readonly IShape[]): readonly IShape[] {
        const shapeUuids: Set<LocalId> = new Set(shapes.map((s) => s.id));
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
