import { assetSystem } from "../assets";
import { assetState } from "../assets/state";
import { getImageSrcFromHash } from "../assets/utils";
import { l2gx, l2gy, l2gz } from "../core/conversions";
import { type GlobalPoint, toGP, Vector } from "../core/geometry";
import { DEFAULT_GRID_SIZE, snapPointToGrid } from "../core/grid";
import { baseAdjust } from "../core/http";
import { SyncMode, InvalidationMode } from "../core/models/types";
import { uuidv4 } from "../core/utils";
import { i18n } from "../i18n";

import { requestAssetOptions } from "./api/emits/asset";
import { sendShapesMove } from "./api/emits/shape/core";
import { getLocalId, getShape } from "./id";
import { compositeState } from "./layers/state";
import type { BaseTemplate } from "./models/templates";
import { moveShapes } from "./operations/movement";
import { loadShapeData } from "./shapes";
import { applyTemplate } from "./shapes/templates";
import { Asset } from "./shapes/variants/asset";
import type { CharacterId } from "./systems/characters/models";
import { characterState } from "./systems/characters/state";
import { floorState } from "./systems/floors/state";
import { noteSystem } from "./systems/notes";
import { locationSettingsState } from "./systems/settings/location/state";
import { selectionBoxFunction } from "./temp";
import { handleDropFF } from "./ui/firefox";

export async function handleDropEvent(event: DragEvent): Promise<void> {
    if (event === null || event.dataTransfer === null) return;
    handleDropFF(event); // FF modal handling workaround

    const location = toGP(l2gx(event.clientX), l2gy(event.clientY));

    // temp hack to prevent redirection
    // assetState.mutable.modalActive = true;

    const transferInfo = event.dataTransfer.getData("text/plain");

    // External files are dropped
    if (!transferInfo && event.dataTransfer.files.length > 0) {
        for (const asset of await assetSystem.upload(event.dataTransfer.files, { target: () => assetState.raw.root })) {
            if (asset.fileHash !== null) await dropHelper({ assetHash: asset.fileHash, assetId: asset.id }, location);
        }
    } else if (transferInfo) {
        const assetInfo = JSON.parse(transferInfo) as {
            assetHash: string;
            assetId: number;
            characterId?: CharacterId;
        };
        await dropHelper(assetInfo, location);
    }

    // assetState.mutable.modalActive = false;
}

async function dropHelper(
    assetInfo: { assetHash: string; assetId: number; characterId?: CharacterId },
    location: GlobalPoint,
): Promise<void> {
    if (assetInfo.characterId !== undefined) {
        const character = characterState.readonly.characters.get(assetInfo.characterId);
        if (character === undefined) {
            throw new Error("Unknown character ID encountered");
        }
        const shapeId = getLocalId(character.shapeId, false);

        if (shapeId !== undefined) {
            let shape = getShape(shapeId);
            // bunch of fuckery to patch toggle composites
            if (shape !== undefined) {
                const compositeParent = compositeState.getCompositeParent(shapeId);
                if (compositeParent !== undefined) {
                    shape = getShape(compositeParent.activeVariant);
                }
            }
            if (shape !== undefined && shape.options.skipDraw !== true) {
                await moveShapes([shape], Vector.fromPoints(shape.center, location), false);
                return;
            }
        }

        sendShapesMove({
            shapes: [character.shapeId],
            target: {
                layer: floorState.currentLayer.value!.name,
                floor: floorState.currentFloor.value!.name,
                location: locationSettingsState.raw.activeLocation,
                x: location.x,
                y: location.y,
            },
        });

        return;
    }
    await dropAsset(
        { assetId: assetInfo.assetId, imageSource: getImageSrcFromHash(assetInfo.assetHash, { addBaseUrl: false }) },
        location,
    );
}

export async function dropAsset(
    data: { imageSource: string; assetId: number },
    position: GlobalPoint,
): Promise<Asset | undefined> {
    const layer = floorState.currentLayer.value!;

    let template: BaseTemplate | undefined;
    if (data.assetId) {
        const assetInfo = await requestAssetOptions(data.assetId);
        if (assetInfo.success) {
            // check if map dimensions in asset name
            const dimensions = assetInfo.name.match(/(?<x>\d+)x(?<y>\d+)/);
            if (dimensions?.groups !== undefined) {
                const dimX = Number.parseInt(dimensions.groups.x ?? "0");
                const dimY = Number.parseInt(dimensions.groups.y ?? "0");
                // DropRatio is already accounted for in applyTemplate!!
                template = {
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
                    if (choice === undefined || choice.length === 0) return;
                    template = assetInfo.options!.templates[choice[0]!];
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
            const asset = new Asset(image, position, l2gz(image.width), l2gz(image.height), {
                assetId: data.assetId,
                uuid,
            });

            const pathname = new URL(image.src).pathname;
            asset.src = pathname.replace(import.meta.env.BASE_URL, "/");

            asset.setLayer(layer.floor, layer.name); // set this early to avoid conflicts

            if (template) {
                loadShapeData(asset, applyTemplate(asset.asDict(), template));
            }

            if (locationSettingsState.raw.useGrid.value) {
                const gridType = locationSettingsState.raw.gridType.value;
                asset.refPoint = snapPointToGrid(asset.refPoint, gridType, {
                    snapDistance: Number.MAX_VALUE,
                })[0];
            }

            layer.addShape(asset, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);

            for (const noteId of asset.options.templateNoteIds ?? []) {
                noteSystem.attachShape(noteId, asset.id, true);
            }

            resolve(asset);
        };
    });
}
