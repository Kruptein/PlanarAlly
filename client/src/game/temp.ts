import { clampGridLine, l2gx, l2gy, l2gz } from "../core/conversions";
import { toGP } from "../core/geometry";
import { baseAdjust } from "../core/http";
import { SyncMode, InvalidationMode } from "../core/models/types";
import type { SelectionBoxFunction } from "../core/plugins/modals/selectionBox";
import { uuidv4 } from "../core/utils";
import { i18n } from "../i18n";
import { DEFAULT_GRID_SIZE } from "../store/client";
import { floorStore } from "../store/floor";
import { settingsStore } from "../store/settings";

import { requestAssetOptions } from "./api/emits/asset";
import { sendFloorChange, sendLayerChange } from "./api/emits/shape/core";
import { getGlobalId } from "./id";
import type { Layer } from "./layers/variants/layer";
import type { Floor } from "./models/floor";
import type { ServerShape } from "./models/shapes";
import type { BaseTemplate } from "./models/templates";
import { addOperation } from "./operations/undo";
import type { IShape } from "./shapes/interfaces";
import { applyTemplate } from "./shapes/templates";
import { createShapeFromDict } from "./shapes/utils";
import { Asset } from "./shapes/variants/asset";
import { visionState } from "./vision/state";

export function moveFloor(shapes: IShape[], newFloor: Floor, sync: boolean): void {
    shapes = shapes.filter((s) => !s.isLocked);
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
        const uuids = shapes.map((s) => s.id);
        sendFloorChange({ uuids: shapes.map((s) => getGlobalId(s.id)), floor: newFloor.name });
        addOperation({ type: "floormovement", shapes: uuids, from: oldFloor.id, to: newFloor.id });
    }
}

export function moveLayer(shapes: readonly IShape[], newLayer: Layer, sync: boolean): void {
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
        const uuids = shapes.map((s) => s.id);
        sendLayerChange({
            uuids: shapes.map((s) => getGlobalId(s.id)),
            layer: newLayer.name,
            floor: floorStore.getFloor({ id: newLayer.floor })!.name,
        });
        addOperation({ type: "layermovement", shapes: uuids, from: oldLayer.name, to: newLayer.name });
    }
}

export function addShape(shape: ServerShape, sync: SyncMode): IShape | undefined {
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

let selectionBoxFunction: SelectionBoxFunction | undefined = undefined;

export function setSelectionBoxFunction(f: SelectionBoxFunction): void {
    selectionBoxFunction = f;
}

export async function dropAsset(
    data: { imageSource: string; assetId: number },
    position: { x: number; y: number },
): Promise<Asset | undefined> {
    const layer = floorStore.currentLayer.value!;

    let options: BaseTemplate | undefined;
    if (data.assetId) {
        const assetInfo = await requestAssetOptions(data.assetId);
        if (assetInfo.success) {
            // check if map dimensions in asset name
            const dimensions = assetInfo.name.match(/(?<x>\d+)x(?<y>\d+)/);
            if (dimensions?.groups !== undefined) {
                const dimX = Number.parseInt(dimensions.groups.x);
                const dimY = Number.parseInt(dimensions.groups.y);
                options = {
                    width: dimX * DEFAULT_GRID_SIZE,
                    height: dimY * DEFAULT_GRID_SIZE,
                } as BaseTemplate;
            }

            const choices = Object.keys(assetInfo.options?.templates ?? {});
            if (choices.length > 0) {
                try {
                    const choice = await selectionBoxFunction!(
                        i18n.global.t("game.ui.templates.choose").toString(),
                        choices,
                    );
                    if (choice === undefined) return;
                    options = assetInfo.options!.templates[choice[0]];
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

            const pathname = new URL(image.src).pathname;
            asset.src = pathname.replace(import.meta.env.BASE_URL, "/");

            asset.setLayer(layer.floor, layer.name); // set this early to avoid conflicts

            if (options) {
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
