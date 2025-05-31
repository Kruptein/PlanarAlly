import { wrapSocket } from "../../api/socket";

export const sendMarkerCreate = wrapSocket<string>("Marker.New");
export const sendMarkerRemove = wrapSocket<string>("Marker.Remove");
