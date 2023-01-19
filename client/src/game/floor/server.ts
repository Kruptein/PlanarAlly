import type { ApiFloor, ApiLayer } from "../../apiTypes";
import type { ILayer } from "../interfaces/layer";
import { createCanvas } from "../layers/canvas";
import { recalculateZIndices } from "../layers/floor";
import { DmLayer } from "../layers/variants/dm";
import { FowLightingLayer } from "../layers/variants/fowLighting";
import { FowVisionLayer } from "../layers/variants/fowVision";
import { GridLayer } from "../layers/variants/grid";
import { Layer } from "../layers/variants/layer";
import { MapLayer } from "../layers/variants/map";
import { LayerName } from "../models/floor";
import type { Floor } from "../models/floor";
import { floorSystem } from "../systems/floors";
import { groupSystem } from "../systems/groups";
import { groupToClient } from "../systems/groups/models";
import { visionState } from "../vision/state";

export function addServerFloor(serverFloor: ApiFloor): void {
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
    let fowLayer: ApiLayer | undefined;
    for (const layer of serverFloor.layers) {
        if (layer.name === LayerName.Lighting) fowLayer = layer;
        else addServerLayer(layer, floor);
        if (layer.name === LayerName.Vision) addServerLayer(fowLayer!, floor);
    }

    visionState.recalculateVision(floorId);
    visionState.recalculateMovement(floorId);

    recalculateZIndices();
}

function addServerLayer(layerInfo: ApiLayer, floor: Floor): void {
    const canvas = createCanvas(layerInfo.name);

    const layerName = layerInfo.name as LayerName;

    // Create the Layer instance
    let layer: ILayer;
    if (layerInfo.type_ === LayerName.Grid) {
        layer = new GridLayer(canvas, layerName, floor.id, layerInfo.index);
    } else if (layerInfo.type_ === LayerName.Lighting) {
        layer = new FowLightingLayer(canvas, layerName, floor.id, layerInfo.index);
    } else if (layerInfo.type_ === LayerName.Vision) {
        layer = new FowVisionLayer(canvas, layerName, floor.id, layerInfo.index);
    } else if (layerName === LayerName.Map) {
        layer = new MapLayer(canvas, layerName, floor.id, layerInfo.index);
    } else if (layerName === LayerName.Dm) {
        layer = new DmLayer(canvas, layerName, floor.id, layerInfo.index);
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
        if (!groupSystem.hasGroup(group.uuid)) {
            groupSystem.addNewGroup(group, false);
        }
    }

    // Load layer shapes
    layer.setServerShapes(layerInfo.shapes);
}
