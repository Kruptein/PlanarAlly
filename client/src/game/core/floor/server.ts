import type { ApiFloor, ApiLayer } from "../../../apiTypes";
import { coreStore } from "../../../store/core";
import { postUi } from "../../messages/ui";
import type { Canvas } from "../canvas";
import type { ILayer } from "../interfaces/layer";
import { recalculateZIndices } from "../layers/floor";
import { DmLayer } from "../layers/variants/dm";
import { FowLightingLayer } from "../layers/variants/fowLighting";
import { FowVisionLayer } from "../layers/variants/fowVision";
import { GridLayer } from "../layers/variants/grid";
import { Layer } from "../layers/variants/layer";
import { MapLayer } from "../layers/variants/map";
import { type FloorId, type Floor, LayerName } from "../models/floor";
import { floorSystem } from "../systems/floors";
import { gameSystem } from "../systems/game";
import { groupSystem } from "../systems/groups";
import { groupToClient } from "../systems/groups/models";
import { playerSystem } from "../systems/players";
import { visionState } from "../vision/state";

// We don't want to send all the shapes between the threads
// so we cache the layer info until the canvas has been created on the dom side
const tempLayerInfo = new Map<string, ApiLayer>();

export async function addServerFloor(serverFloor: ApiFloor, selectFloor: boolean): Promise<void> {
    const floor: Floor = {
        id: floorSystem.generateFloorId(),
        name: serverFloor.name,
        playerVisible: serverFloor.player_visible,
        type: serverFloor.type_,
        backgroundValue: serverFloor.background_color ?? undefined,
    };

    floorSystem.addFloor(floor, serverFloor.index);
    const floorId = floorSystem.getFloor({ name: serverFloor.name })!.id;
    visionState.addCdt(floorId);

    const domLayerInfo: LayerName[] = [];

    // we need to draw fow later because it depends on fow-players
    // and historically we did the draw loop in the other direction
    let fowLayer: ApiLayer | undefined;
    for (const layer of serverFloor.layers) {
        tempLayerInfo.set(`${floorId}-${layer.name}`, layer);
        if (layer.name === LayerName.Lighting) fowLayer = layer;
        else domLayerInfo.push(layer.name);
        if (layer.name === LayerName.Vision) domLayerInfo.push(fowLayer!.name);
    }

    await postUi("Floor.Create", { layers: domLayerInfo, floorId, selectFloor });
}

export function completeServerFloor(options: { floorId: FloorId; selectFloor: boolean }): void {
    const { floorId, selectFloor } = options;
    visionState.recalculateVision(floorId);
    visionState.recalculateMovement(floorId);

    recalculateZIndices();

    if (selectFloor) {
        floorSystem.selectFloor({ id: floorId }, false);
        coreStore.setLoading(false);
        gameSystem.setBoardInitialized(true);
        playerSystem.loadPosition();
    }
}

export function addServerLayer(
    layerName: LayerName,
    floorId: FloorId,
    canvas: Canvas,
    width: number,
    height: number,
): void {
    const key = `${floorId}-${layerName}`;
    const layerInfo = tempLayerInfo.get(key);
    tempLayerInfo.delete(key);
    if (layerInfo === undefined) {
        console.error("Failed to retrieve layer info from cache");
        return;
    }

    // Create the Layer instance
    let layer: ILayer;
    if (layerInfo.type_ === LayerName.Grid) {
        layer = new GridLayer({ canvas, width, height }, layerName, floorId, layerInfo.index);
    } else if (layerInfo.type_ === LayerName.Lighting) {
        layer = new FowLightingLayer({ canvas, width, height }, layerName, floorId, layerInfo.index);
    } else if (layerInfo.type_ === LayerName.Vision) {
        layer = new FowVisionLayer({ canvas, width, height }, layerName, floorId, layerInfo.index);
    } else if (layerName === LayerName.Map) {
        layer = new MapLayer({ canvas, width, height }, layerName, floorId, layerInfo.index);
    } else if (layerName === LayerName.Dm) {
        layer = new DmLayer({ canvas, width, height }, layerName, floorId, layerInfo.index);
    } else {
        layer = new Layer({ canvas, width, height }, layerName, floorId, layerInfo.index);
    }
    layer.selectable = layerInfo.selectable;
    layer.playerEditable = layerInfo.player_editable;
    floorSystem.addLayer(layer, floorId);

    // Load layer groups

    for (const serverGroup of layerInfo.groups) {
        const group = groupToClient(serverGroup);
        if (!groupSystem.hasGroup(group.uuid)) {
            groupSystem.addNewGroup(group, false);
        }
    }

    // Load layer shapes
    layer.setServerShapes(layerInfo.shapes);
}
