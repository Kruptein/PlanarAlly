import type { ApiOptionalTracker, ApiTracker, ShapeSetStringValue, TrackerMove } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";
import { socket } from "../../api/socket";

export const sendShapeRemoveTracker = wrapSocket<ShapeSetStringValue>("Shape.Options.Tracker.Remove");
export const sendShapeMoveTracker = wrapSocket<TrackerMove>("Shape.Options.Tracker.Move");

export const sendShapeCreateTracker = (data: ApiTracker): void => {
    socket.emit("Shape.Options.Tracker.Create", data);
};

export const sendShapeUpdateTracker = (data: ApiOptionalTracker): void => {
    socket.emit("Shape.Options.Tracker.Update", data);
};
