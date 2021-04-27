import { UuidMap } from "../../store/shapeMap";
import { sendToggleCompositeAddVariant } from "../api/emits/shape/toggleComposite";
import { Shape } from "../shapes/shape";
import { ToggleComposite } from "../shapes/variants/toggleComposite";

class CompositeState {
    private compositeMap: Map<string, string> = new Map();

    clear(): void {
        this.compositeMap.clear();
    }

    getCompositeParent(variant: string): ToggleComposite | undefined {
        const shape_uuid = this.compositeMap.get(variant);
        if (shape_uuid !== undefined) {
            return UuidMap.get(shape_uuid) as ToggleComposite;
        }
        return undefined;
    }

    addComposite(parent: string, variant: { uuid: string; name: string }, sync: boolean): void {
        this.compositeMap.set(variant.uuid, parent);
        if (sync) {
            sendToggleCompositeAddVariant({ shape: parent, variant: variant.uuid, name: variant.name });
        }
    }

    addAllCompositeShapes(shapes: readonly Shape[]): readonly Shape[] {
        const shapeUuids: Set<string> = new Set(shapes.map((s) => s.uuid));
        const allShapes = [...shapes];
        for (const shape of this.compositeMap.keys()) {
            if (shapes.some((s) => s.uuid === shape)) {
                const parent = this.getCompositeParent(shape)!;
                if (shapeUuids.has(parent.uuid)) continue;
                shapeUuids.add(parent.uuid);
                allShapes.push(parent);
                for (const variant of parent.variants) {
                    if (shapeUuids.has(variant.uuid)) {
                        continue;
                    } else {
                        shapeUuids.add(variant.uuid);
                        allShapes.push(UuidMap.get(variant.uuid)!);
                    }
                }
            }
        }
        return allShapes;
    }
}

export const compositeState = new CompositeState();
