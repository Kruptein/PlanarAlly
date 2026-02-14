import { ApiCoreShape, ApiVariant, ApiVariantWithoutId } from "../../../apiTypes";
import type { LocalId } from "../../../core/id";
import { SERVER_SYNC } from "../../../core/models/types";
import { registerSystem } from "../../../core/systems";
import type { ShapeSystem, SystemInformMode } from "../../../core/systems/models";
import { sendShapeSizeUpdate } from "../../api/emits/shape/core";
import { getGlobalId, getShape } from "../../id";
import { IAsset } from "../../interfaces/shapes/asset";
import { propertiesSystem } from "../properties";
import { propertiesState } from "../properties/state";

import { sendShapeAddVariant, sendShapeRemoveVariant, sendShapeUpdateVariant } from "./emits";
import { variantsState } from "./state";

const { mutable, mutableReactive: $ } = variantsState;

class VariantsSystem implements ShapeSystem<ApiVariant[]> {
    // CORE

    clear(): void {
        $.data.clear();
        $.leases.clear();
        mutable.data.clear();
    }

    drop(id: LocalId): void {
        mutable.data.delete(id);
        $.leases.delete(id);
        $.data.delete(id);
    }

    import(id: LocalId, data: ApiVariant[], _mode: SystemInformMode): void {
        if (data.length === 0) return;

        mutable.data.set(id, data);
    }

    export(id: LocalId): ApiVariant[] {
        return mutable.data.get(id) ?? [];
    }

    fromServerShape(data: ApiCoreShape): ApiVariant[] {
        return data.variants ?? [];
    }

    toServerShape(id: LocalId, data: ApiCoreShape): void {
        data.variants = this.export(id);
    }

    private createOrGet(id: LocalId): ApiVariant[] {
        // this is to manage the case were a shape is reactive, but has no variants yet
        let isAlreadyReactive = false;
        let target: ApiVariant[];
        if ($.leases.has(id) && $.data.has(id)) {
            isAlreadyReactive = true;
            target = $.data.get(id)!;
        } else if (!mutable.data.has(id)) {
            target = [];
            mutable.data.set(id, target);
        } else {
            target = mutable.data.get(id)!;
        }
        if (!isAlreadyReactive) $.data.set(id, target);
        return target;
    }

    // BEHAVIOUR

    loadState(id: LocalId, source: string): void {
        const data = mutable.data.get(id);
        if (data) $.data.set(id, data);

        if (!$.leases.has(id)) $.leases.set(id, new Set([source]));
        else $.leases.get(id)!.add(source);
    }

    dropState(id: LocalId, source: string): void {
        $.data.delete(id);
        $.leases.get(id)?.delete(source);
        if ($.leases.get(id)?.size === 0) {
            $.leases.delete(id);
            $.data.delete(id);
        }
    }

    get(id: LocalId, variantId: number): ApiVariant | undefined {
        return mutable.data.get(id)?.find((v) => v.id === variantId);
    }

    create(id: LocalId, variant: ApiVariantWithoutId): void {
        const shapeId = getGlobalId(id);
        if (shapeId) sendShapeAddVariant({ ...variant, shapeId });
        else console.error("Failed to add variant: shape is not globally known");
    }

    add(id: LocalId, variant: ApiVariant): void {
        const data = this.createOrGet(id);
        data.push(variant);
    }

    load(id: LocalId, variantId: number): void {
        const variant = this.get(id, variantId);
        if (!variant) {
            console.error("Failed to load variant: variant is not known");
            return;
        }
        const shape = getShape(id) as IAsset | undefined;
        if (!shape || shape.type !== "assetrect") {
            console.error("Failed to load variant: shape is not known");
            return;
        }
        shape.setImage(variant.assetId, variant.assetHash, true);
        const oldCenter = shape.center;
        shape.w = variant.width;
        shape.h = variant.height;
        shape.center = oldCenter;
        sendShapeSizeUpdate({ shape, temporary: false });
        if (variant.name !== null) {
            propertiesSystem.setName(shape.id, variant.name, SERVER_SYNC);
        }
    }

    update(id: LocalId, variantData: Partial<ApiVariant> & { id: number }, sync: boolean): void {
        const data = this.createOrGet(id);
        if (data === undefined) return;
        const variant = data.find((v) => v.id === variantData.id);
        if (variant) {
            Object.assign(variant, variantData);
            if (sync) {
                const shapeId = getGlobalId(id);
                if (shapeId) sendShapeUpdateVariant({ shapeId, ...variant });
                else console.error("Failed to update variant: shape is not globally known");
            }
        } else {
            console.error("Could not find variant to update");
        }
    }

    remove(id: LocalId, variantId: number, sync: boolean): void {
        const data = this.createOrGet(id);
        data.splice(
            data.findIndex((v) => v.id === variantId),
            1,
        );
        if (sync) {
            const shapeId = getGlobalId(id);
            if (shapeId) sendShapeRemoveVariant({ shapeId, variantId });
            else console.error("Failed to remove variant: shape is not globally known");
        }
    }

    store(id: LocalId, variantId: number): void {
        const shape = getShape(id) as IAsset | undefined;
        if (!shape || shape.type !== "assetrect") {
            console.error("Failed to store variant: shape is not known");
            return;
        }
        this.update(
            id,
            {
                name: propertiesState.raw.data.get(id)?.name ?? null,
                id: variantId,
                width: shape.w,
                height: shape.h,
                assetId: shape.assetId,
            },
            true,
        );
    }
}

export const variantsSystem = new VariantsSystem();
registerSystem("variants", variantsSystem, true, variantsState);
