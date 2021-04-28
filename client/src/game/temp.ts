import { clampGridLine, l2gx, l2gy, l2gz } from "../core/conversions";
import { toGP } from "../core/geometry";
import { SyncMode, InvalidationMode } from "../core/models/types";
import { useModal } from "../core/plugins/modals/plugin";
import { baseAdjust, uuidv4 } from "../core/utils";
import { i18n } from "../i18n";
import { floorStore } from "../store/floor";
import { settingsStore } from "../store/settings";

import { requestAssetOptions } from "./api/emits/asset";
import { sendFloorChange, sendLayerChange } from "./api/emits/shape/core";
import { Layer } from "./layers/variants/layer";
import { Floor } from "./models/floor";
import { ServerShape } from "./models/shapes";
import { BaseTemplate } from "./models/templates";
import { addOperation } from "./operations/undo";
import { Shape } from "./shapes/shape";
import { applyTemplate } from "./shapes/templates";
import { createShapeFromDict } from "./shapes/utils";
import { Asset } from "./shapes/variants/asset";
import { visionState } from "./vision/state";

export function moveFloor(shapes: Shape[], newFloor: Floor, sync: boolean): void {
    if (shapes.length === 0) return;
    const oldLayer = shapes[0].layer;
    const oldFloor = shapes[0].floor;
    if (shapes.some((s) => s.layer !== oldLayer)) {
        throw new Error("Mixing shapes from different floors in shape move");
    }

    const newLayer = floorStore.getLayer(newFloor, oldLayer.name)!;
    for (const shape of shapes) {
        visionState.moveShape(shape, oldFloor.id, newFloor.id);
        shape.setLayer(newFloor.id, oldLayer.name);
    }
    oldLayer.setShapes(...oldLayer.getShapes({ includeComposites: true }).filter((s) => !shapes.includes(s)));
    newLayer.pushShapes(...shapes);
    oldLayer.invalidate(false);
    newLayer.invalidate(false);
    if (sync) {
        const uuids = shapes.map((s) => s.uuid);
        sendFloorChange({ uuids, floor: newFloor.name });
        addOperation({ type: "floormovement", shapes: uuids, from: oldFloor.id, to: newFloor.id });
    }
}

export function moveLayer(shapes: readonly Shape[], newLayer: Layer, sync: boolean): void {
    if (shapes.length === 0) return;
    const oldLayer = shapes[0].layer;

    if (shapes.some((s) => s.layer !== oldLayer)) {
        throw new Error("Mixing shapes from different floors in shape move");
    }

    for (const shape of shapes) shape.setLayer(newLayer.floor, newLayer.name);
    // Update layer shapes
    oldLayer.setShapes(...oldLayer.getShapes({ includeComposites: true }).filter((s) => !shapes.includes(s)));
    newLayer.pushShapes(...shapes);
    // Revalidate layers  (light should at most be redone once)
    oldLayer.invalidate(true);
    newLayer.invalidate(false);
    // Sync!
    if (sync) {
        const uuids = shapes.map((s) => s.uuid);
        sendLayerChange({
            uuids,
            layer: newLayer.name,
            floor: floorStore.getFloor({ id: newLayer.floor })!.name,
        });
        addOperation({ type: "layermovement", shapes: uuids, from: oldLayer.name, to: newLayer.name });
    }
}

export function addShape(shape: ServerShape, sync: SyncMode): Shape | undefined {
    if (!floorStore.hasLayer(floorStore.getFloor({ name: shape.floor })!, shape.layer)) {
        console.log(`Shape with unknown layer ${shape.layer} could not be added`);
        return;
    }
    const layer = floorStore.getLayer(floorStore.getFloor({ name: shape.floor })!, shape.layer)!;
    const sh = createShapeFromDict(shape);
    if (sh === undefined) {
        console.log(`Shape with unknown type ${shape.type_} could not be added`);
        return;
    }
    layer.addShape(sh, sync, InvalidationMode.NORMAL);
    layer.invalidate(false);
    return sh;
}

export async function dropAsset(
    data: { imageSource: string; assetId: number },
    position: { x: number; y: number },
): Promise<Asset | undefined> {
    const layer = floorStore.currentLayer.value!;

    let options: BaseTemplate | undefined;
    if (data.assetId) {
        const response = await requestAssetOptions(data.assetId);
        if (response.success) {
            const choices = Object.keys(response.options?.templates ?? {});
            if (choices.length > 0) {
                try {
                    const modals = useModal();
                    const choice = await modals.selectionBox(
                        i18n.global.t("game.ui.templates.choose").toString(),
                        choices,
                    );
                    if (choice === undefined) return;
                    options = response.options!.templates[choice];
                } catch {
                    // no-op ; action cancelled
                }
            }
        }
    }

    if (!data.imageSource.startsWith("/static")) return;
    const image = document.createElement("img");
    const uuid = uuidv4();
    image.src = baseAdjust(data.imageSource);

    return new Promise((resolve) => {
        image.onload = () => {
            const refPoint = toGP(l2gx(position.x), l2gy(position.y));
            const asset = new Asset(image, refPoint, l2gz(image.width), l2gz(image.height), {
                assetId: data.assetId,
                uuid,
            });
            asset.src = new URL(image.src).pathname;

            if (options) {
                asset.setLayer(layer.floor, layer.name); // if we don't set this the asDict will fail
                asset.fromDict(applyTemplate(asset.asDict(), options));
            }

            if (settingsStore.useGrid.value) {
                asset.refPoint = toGP(clampGridLine(asset.refPoint.x), clampGridLine(asset.refPoint.y));
            }

            layer.addShape(asset, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);

            resolve(asset);
        };
    });
}
