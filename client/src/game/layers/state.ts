import { sendToggleCompositeAddVariant } from "../api/emits/shape/toggleComposite";
import { getGlobalId, getShape } from "../id";
import type { LocalId } from "../id";
import type { IShape } from "../shapes/interfaces";
import type { ToggleComposite } from "../shapes/variants/toggleComposite";

class CompositeState {
    private compositeMap: Map<LocalId, LocalId> = new Map();

    clear(): void {
        this.compositeMap.clear();
    }

    getCompositeParent(variant: LocalId): ToggleComposite | undefined {
        const shape_uuid = this.compositeMap.get(variant);
        if (shape_uuid !== undefined) {
            return getShape(shape_uuid) as ToggleComposite;
        }
        return undefined;
    }

    addComposite(parent: LocalId, variant: { uuid: LocalId; name: string }, sync: boolean): void {
        this.compositeMap.set(variant.uuid, parent);
        if (sync) {
            sendToggleCompositeAddVariant({
                shape: getGlobalId(parent),
                variant: getGlobalId(variant.uuid),
                name: variant.name,
            });
        }
    }

    addAllCompositeShapes(shapes: readonly IShape[]): readonly IShape[] {
        const shapeUuids: Set<LocalId> = new Set(shapes.map((s) => s.id));
        const allShapes = [...shapes];
        for (const shape of this.compositeMap.keys()) {
            if (shapes.some((s) => s.id === shape)) {
                const parent = this.getCompositeParent(shape)!;
                if (shapeUuids.has(parent.id)) continue;
                shapeUuids.add(parent.id);
                allShapes.push(parent);
                for (const variant of parent.variants) {
                    if (shapeUuids.has(variant.uuid)) {
                        continue;
                    } else {
                        shapeUuids.add(variant.uuid);
                        allShapes.push(getShape(variant.uuid)!);
                    }
                }
            }
        }
        return allShapes;
    }
}

export const compositeState = new CompositeState();
