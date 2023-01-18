import { clampGridLine, l2gx, l2gy, l2gz } from "../core/conversions";
import { toGP } from "../core/geometry";
import { baseAdjust } from "../core/http";
import { SyncMode, InvalidationMode } from "../core/models/types";
import { uuidv4 } from "../core/utils";
import { i18n } from "../i18n";

import { requestAssetOptions } from "./api/emits/asset";
import type { BaseTemplate } from "./models/templates";
import { applyTemplate } from "./shapes/templates";
import { Asset } from "./shapes/variants/asset";
import { floorState } from "./systems/floors/state";
import { DEFAULT_GRID_SIZE } from "./systems/position/state";
import { locationSettingsState } from "./systems/settings/location/state";
import { selectionBoxFunction } from "./temp";

export async function dropAsset(
    data: { imageSource: string; assetId: number },
    position: { x: number; y: number },
): Promise<Asset | undefined> {
    const layer = floorState.currentLayer.value!;

    let options: BaseTemplate | undefined;
    if (data.assetId) {
        const assetInfo = await requestAssetOptions(data.assetId);
        if (assetInfo.success) {
            // check if map dimensions in asset name
            const dimensions = assetInfo.name.match(/(?<x>\d+)x(?<y>\d+)/);
            if (dimensions?.groups !== undefined) {
                const dimX = Number.parseInt(dimensions.groups.x ?? "0");
                const dimY = Number.parseInt(dimensions.groups.y ?? "0");
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
                    if (choice === undefined || choice.length === 0) return;
                    options = assetInfo.options!.templates[choice[0]!];
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

            if (locationSettingsState.raw.useGrid.value) {
                asset.refPoint = toGP(clampGridLine(asset.refPoint.x), clampGridLine(asset.refPoint.y));
            }

            layer.addShape(asset, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);

            resolve(asset);
        };
    });
}
