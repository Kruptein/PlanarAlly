import type { AssetTemplateInfo } from "../apiTypes";
import { assetSystem } from "../assets";
import type { AssetId } from "../assets/models";
import { assetState } from "../assets/state";
import { getImageSrcFromHash } from "../assets/utils";
import { l2gx, l2gy, l2gz } from "../core/conversions";
import { type GlobalPoint, toGP, Vector } from "../core/geometry";
import { DEFAULT_GRID_SIZE, snapPointToGrid } from "../core/grid";
import { baseAdjust } from "../core/http";
import { SyncMode, InvalidationMode, UI_SYNC } from "../core/models/types";
import { uuidv4 } from "../core/utils";
import { i18n } from "../i18n";

import { requestAssetOptions } from "./api/emits/asset";
import { fetchFullShape, sendShapesMove } from "./api/emits/shape/core";
import { getLocalId, getShape } from "./id";
import { moveShapes } from "./operations/movement";
import { loadFromServer } from "./shapes/transformations";
import { Asset } from "./shapes/variants/asset";
import { accessSystem } from "./systems/access";
import type { CharacterId } from "./systems/characters/models";
import { characterState } from "./systems/characters/state";
import { floorState } from "./systems/floors/state";
import { noteSystem } from "./systems/notes";
import { playerSystem } from "./systems/players";
import { locationSettingsState } from "./systems/settings/location/state";
import { addShape, selectionBoxFunction } from "./temp";
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
        for (const asset of await assetSystem.upload(event.dataTransfer.files, {
            target: () => assetState.raw.root,
        })) {
            if (asset.fileHash !== null)
                // oxlint-disable-next-line no-await-in-loop
                await dropHelper({ assetHash: asset.fileHash, assetId: asset.id }, location);
        }
    } else if (transferInfo) {
        const assetInfo = JSON.parse(transferInfo) as {
            assetHash: string;
            assetId: AssetId;
            characterId?: CharacterId;
        };
        await dropHelper(assetInfo, location);
    }

    // assetState.mutable.modalActive = false;
}

async function dropHelper(
    assetInfo: { assetHash: string; assetId: AssetId; characterId?: CharacterId },
    location: GlobalPoint,
): Promise<void> {
    if (assetInfo.characterId !== undefined) {
        const character = characterState.readonly.characters.get(assetInfo.characterId);
        if (character === undefined) {
            throw new Error("Unknown character ID encountered");
        }
        const shapeId = getLocalId(character.shapeId, false);

        if (shapeId !== undefined) {
            const shape = getShape(shapeId);
            if (shape !== undefined && shape.options.skipDraw !== true) {
                await moveShapes([shape], Vector.fromPoints(shape.center, location), { temporary: false });
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
        {
            assetId: assetInfo.assetId,
            imageSource: getImageSrcFromHash(assetInfo.assetHash, { addBaseUrl: false }),
        },
        location,
    );
}

async function loadTemplate(template: AssetTemplateInfo, position: GlobalPoint): Promise<void> {
    const data = await fetchFullShape(template.id);
    if (data !== undefined) {
        const { shape, notes } = data;
        await Promise.all(notes.map((note) => noteSystem.loadNote(note)));
        const layer = floorState.currentLayer.value!;
        const compact = await loadFromServer(shape, layer.floor, layer.name);
        compact.core.x = position.x;
        compact.core.y = position.y;
        compact.systems.notes = notes.map((note) => note.uuid);
        addShape(compact, SyncMode.FULL_SYNC, "create");
    }
}

export async function dropAsset(
    data: { imageSource: string; assetId: AssetId },
    position: GlobalPoint,
): Promise<Asset | undefined> {
    let dimensions: { width: number; height: number } | undefined;

    const assetInfo = await requestAssetOptions(data.assetId);
    if (assetInfo.success) {
        // First check if there are templates and if so, if we want to use one
        const choices = assetInfo.templates.map((template) => template.name);
        if (choices.length > 0) {
            try {
                const choice = await selectionBoxFunction!(
                    i18n.global.t("game.ui.templates.choose").toString(),
                    choices,
                );
                if (choice === undefined || choice.length === 0) return;
                const template = assetInfo.templates.find((template) => template.name === choice[0]);
                if (template) {
                    await loadTemplate(template, position);
                    return;
                }
            } catch {
                // no-op ; action cancelled
            }
        }

        // If no templates, check if there are map dimensions in the asset name
        const dimensionsMatch = assetInfo.name.match(/(?<x>\d+)x(?<y>\d+)/);
        if (dimensionsMatch?.groups !== undefined) {
            const dimX = Number.parseInt(dimensionsMatch.groups.x ?? "0");
            const dimY = Number.parseInt(dimensionsMatch.groups.y ?? "0");

            const gridRescale = locationSettingsState.raw.dropRatio.value;

            dimensions = {
                width: dimX * DEFAULT_GRID_SIZE * gridRescale,
                height: dimY * DEFAULT_GRID_SIZE * gridRescale,
            };
        }
    }

    if (!data.imageSource.startsWith("/static")) return;
    const image = document.createElement("img");
    const uuid = uuidv4();
    image.src = baseAdjust(data.imageSource);

    const layer = floorState.currentLayer.value!;

    return new Promise((resolve) => {
        image.addEventListener("load", () => {
            const asset = new Asset(
                image,
                position,
                dimensions?.width ?? l2gz(image.width),
                dimensions?.height ?? l2gz(image.height),
                {
                    assetId: data.assetId,
                    uuid,
                },
            );

            const pathname = new URL(image.src).pathname;
            asset.src = pathname.replace(import.meta.env.BASE_URL, "/");

            asset.setLayer(layer.floor, layer.name); // set this early to avoid conflicts

            if (locationSettingsState.raw.useGrid.value) {
                const gridType = locationSettingsState.raw.gridType.value;
                asset.refPoint = snapPointToGrid(asset.refPoint, gridType, {
                    snapDistance: Number.MAX_VALUE,
                })[0];
            }

            accessSystem.addAccess(
                asset.id,
                playerSystem.getCurrentPlayer()!.name,
                { edit: true, movement: true, vision: true },
                UI_SYNC,
            );

            layer.addShape(asset, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);

            resolve(asset);
        });
    });
}
