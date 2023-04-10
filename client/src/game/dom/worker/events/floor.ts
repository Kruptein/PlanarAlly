import type { FloorId, LayerName } from "../../../core/models/floor";
import { postRender } from "../../../messages/render";
import { HAS_WORKER } from "../../../messages/supported";
import { createLayerCanvas } from "../../canvas";

export async function createDomFloor(options: {
    floorId: FloorId;
    layers: LayerName[];
    selectFloor: boolean;
}): Promise<void> {
    const { floorId, layers, selectFloor } = options;
    for (const name of layers) {
        const { canvas, width, height } = createLayerCanvas(floorId, name);
        if (canvas !== undefined) {
            if (HAS_WORKER) {
                const offscreen = canvas as OffscreenCanvas;
                await postRender("Layer.Create", { name, floorId, width, height, canvas: offscreen }, [offscreen]);
            } else {
                await postRender("Layer.Create", { name, floorId, width, height, canvas });
            }
        } else {
            console.error(`Failed to create canvas for layer ${floorId}-${name}`);
        }
    }
    await postRender("Floor.Complete", { floorId, selectFloor });
}
