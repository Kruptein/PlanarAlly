import type { ApiOptionalTracker, ApiTracker, ShapeSetTrackerValue, TrackerMove } from "../../../apiTypes";
import { UI_SYNC } from "../../../core/models/types";
import { socket } from "../../api/socket";
import { getLocalId } from "../../id";

import { partialTrackerFromServer, trackersFromServer } from "./conversion";

import { trackerSystem } from ".";

socket.on("Shape.Options.Tracker.Remove", (data: ShapeSetTrackerValue): void => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    trackerSystem.remove(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.Tracker.Create", (data: ApiTracker): void => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    trackerSystem.add(shape, trackersFromServer(data)[0]!, UI_SYNC);
});

socket.on("Shape.Options.Tracker.Update", (data: ApiOptionalTracker): void => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    trackerSystem.update(shape, data.uuid, partialTrackerFromServer(data), UI_SYNC);
});

socket.on("Shape.Options.Tracker.Move", (data: TrackerMove): void => {
    const shape = getLocalId(data.shape);
    const newShape = getLocalId(data.new_shape);
    if (shape === undefined || newShape === undefined) return;
    const tracker = trackerSystem.get(shape, data.tracker, false);
    if (tracker === undefined) return;

    trackerSystem.remove(shape, data.tracker, UI_SYNC);
    trackerSystem.add(newShape, tracker, UI_SYNC);
});
