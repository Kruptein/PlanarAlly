import type { ApiShapeCustomData, ApiShapeCustomDataIdentifier } from "../../../apiTypes";
import { wrapSocket } from "../../api/socket";

import type { UiShapeCustomData } from "./types";

export function toApiShapeCustomData(element: UiShapeCustomData): ApiShapeCustomData {
    // oxlint-disable-next-line no-unused-vars
    const { id, pending, ...data } = element;
    return data;
}

export function getIdentifier(element: UiShapeCustomData): ApiShapeCustomDataIdentifier {
    return {
        shapeId: element.shapeId,
        source: element.source,
        prefix: element.prefix,
        name: element.name,
    };
}

export const sendShapeCustomDataAdd = wrapSocket<ApiShapeCustomData>("Shape.CustomData.Add");
export const sendShapeCustomDataRemove = wrapSocket<ApiShapeCustomDataIdentifier>("Shape.CustomData.Remove");
export const sendShapeCustomDataUpdate = wrapSocket<ApiShapeCustomData>("Shape.CustomData.Update");
export const sendShapeCustomDataUpdateName =
    wrapSocket<[ApiShapeCustomDataIdentifier, string]>("Shape.CustomData.Update.Name");
