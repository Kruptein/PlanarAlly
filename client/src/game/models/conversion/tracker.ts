import type { Tracker } from "../../shapes/interfaces";
import type { ServerTracker } from "../shapes";

export const trackersFromServer = (...trackers: ServerTracker[]): Tracker[] => {
    const result = [];
    for (const tracker of trackers) {
        result.push({
            uuid: tracker.uuid,
            name: tracker.name,
            visible: tracker.visible,
            value: tracker.value,
            maxvalue: tracker.maxvalue,
            draw: tracker.draw,
            primaryColor: tracker.primary_color,
            secondaryColor: tracker.secondary_color,
            temporary: false,
        });
    }
    return result;
};

export const trackersToServer = (shape: string, trackers: Tracker[]): ServerTracker[] => {
    const result = [];
    for (const tracker of trackers) {
        result.push({
            uuid: tracker.uuid,
            visible: tracker.visible,
            name: tracker.name,
            value: tracker.value,
            maxvalue: tracker.maxvalue,
            draw: tracker.draw,
            primary_color: tracker.primaryColor,
            secondary_color: tracker.secondaryColor,
            shape,
        });
    }
    return result;
};

export const partialTrackerToServer = (tracker: Partial<Tracker>): Partial<ServerTracker> => {
    return {
        uuid: tracker.uuid,
        visible: tracker.visible,
        name: tracker.name,
        value: tracker.value,
        maxvalue: tracker.maxvalue,
        draw: tracker.draw,
        primary_color: tracker.primaryColor,
        secondary_color: tracker.secondaryColor,
    };
};

export const partialTrackerFromServer = (tracker: Partial<ServerTracker>): Partial<Tracker> => {
    const partial: Partial<Tracker> = {};
    if ("uuid" in tracker) partial.uuid = tracker.uuid;
    if ("visible" in tracker) partial.visible = tracker.visible;
    if ("name" in tracker) partial.name = tracker.name;
    if ("value" in tracker) partial.value = tracker.value;
    if ("maxvalue" in tracker) partial.maxvalue = tracker.maxvalue;
    if ("draw" in tracker) partial.draw = tracker.draw;
    if ("primary_color" in tracker) partial.primaryColor = tracker.primary_color;
    if ("secondary_color" in tracker) partial.secondaryColor = tracker.secondary_color;
    return partial;
};
