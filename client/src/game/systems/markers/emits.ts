import { wrapSocket } from "../../api/helpers";

export const sendMarkerCreate = wrapSocket<string>("Marker.New");
export const sendMarkerRemove = wrapSocket<string>("Marker.Remove");
