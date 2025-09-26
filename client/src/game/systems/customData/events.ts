import type { ApiShapeCustomData, ApiShapeCustomDataIdentifier } from "../../../apiTypes";
import { socket } from "../../api/socket";
import { getLocalId } from "../../id";

import { customDataSystem } from ".";

socket.on("Shape.CustomData.Add", (data: ApiShapeCustomData) => {
    const shapeId = getLocalId(data.shapeId);
    if (shapeId === undefined) return;
    customDataSystem.addElement(data, false);
});

socket.on("Shape.CustomData.Remove", (data: ApiShapeCustomDataIdentifier) => {
    const shapeId = getLocalId(data.shapeId);
    if (shapeId === undefined) return;
    const elemId = customDataSystem.getElementId(data);
    if (elemId === undefined) return;
    customDataSystem.removeElement(shapeId, elemId, false);
});

socket.on("Shape.CustomData.Update.Name", (data: [ApiShapeCustomDataIdentifier, string]) => {
    const shapeId = getLocalId(data[0].shapeId);
    if (shapeId === undefined) return;
    const elemId = customDataSystem.getElementId(data[0]);
    if (elemId === undefined) return;
    customDataSystem.setName(shapeId, elemId, data[1], false);
});

socket.on("Shape.CustomData.Update", (data: ApiShapeCustomData) => {
    const shapeId = getLocalId(data.shapeId);
    if (shapeId === undefined) return;
    const elemId = customDataSystem.getElementId(data);
    if (elemId === undefined) return;
    customDataSystem.updateElement(shapeId, elemId, data);
});
