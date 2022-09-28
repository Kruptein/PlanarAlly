import { coreStore } from "../../store/core";
import { hasGroup, addNewGroup } from "../groups";
import type { ILayer } from "../interfaces/layer";
import { createCanvas } from "../layers/canvas";
import { recalculateZIndices } from "../layers/floor";
import { FowLgLightingLayer } from "../layers/variants/fowLgLighting";
import { FowLightingLayer } from "../layers/variants/fowLighting";
import { FowVisionLayer } from "../layers/variants/fowVision";
import { GridLayer } from "../layers/variants/grid";
import { Layer } from "../layers/variants/layer";
import { MapLayer } from "../layers/variants/map";
import { LayerName } from "../models/floor";
import type { Floor } from "../models/floor";
import type { ServerFloor, ServerLayer } from "../models/general";
import { groupToClient } from "../models/groups";
import { floorSystem } from "../systems/floors";
import { visionState } from "../vision/state";

export function addServerFloor(serverFloor: ServerFloor): void {
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

    // we need to draw fow later because it depends on fow-players
    // and historically we did the draw loop in the other direction
    let fowLayer: ServerLayer | undefined;
    for (const layer of serverFloor.layers) {
        if (layer.name === LayerName.Lighting) fowLayer = layer;
        else addServerLayer(layer, floor);
    }
    if (fowLayer) addServerLayer(fowLayer, floor);

    visionState.recalculateVision(floorId);
    visionState.recalculateMovement(floorId);

    recalculateZIndices();
}

function addServerLayer(layerInfo: ServerLayer, floor: Floor): void {
    const hasGameboard = coreStore.state.boardId !== undefined;

    const canvas = createCanvas();

    const layerName = layerInfo.name as LayerName;

    // Create the Layer instance
    let layer: ILayer;
    if (layerInfo.type_ === LayerName.Grid) {
        layer = new GridLayer(canvas, layerName, floor.id, layerInfo.index);
    } else if (layerInfo.type_ === LayerName.Lighting) {
        if (hasGameboard) layer = new FowLgLightingLayer(canvas, layerName, floor.id, layerInfo.index);
        else layer = new FowLightingLayer(canvas, layerName, floor.id, layerInfo.index);
    } else if (layerInfo.type_ === LayerName.Vision) {
        if (hasGameboard) return;
        layer = new FowVisionLayer(canvas, layerName, floor.id, layerInfo.index);
    } else if (layerName === LayerName.Map) {
        layer = new MapLayer(canvas, layerName, floor.id, layerInfo.index);
    } else {
        layer = new Layer(canvas, layerName, floor.id, layerInfo.index);
    }
    layer.selectable = layerInfo.selectable;
    layer.playerEditable = layerInfo.player_editable;
    floorSystem.addLayer(layer, floor.id);

    // Add the element to the DOM
    const layers = document.getElementById("layers");
    if (layers === null) {
        console.warn("Layers div is missing, this will prevent the main game board from loading!");
        return;
    }
    if (layerInfo.name !== "fow-players") layers.appendChild(canvas);

    // Load layer groups

    for (const serverGroup of layerInfo.groups) {
        const group = groupToClient(serverGroup);
        if (!hasGroup(group.uuid)) {
            addNewGroup(group, false);
        }
    }

    // Load layer shapes
    layer.setServerShapes(layerInfo.shapes);
}
