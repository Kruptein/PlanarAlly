import { uuidv4 } from "../../core/utils";
import { Tracker } from "./interfaces";

export function createEmptyTracker(): Tracker {
    return {
        uuid: uuidv4(),
        name: "",
        value: 0,
        maxvalue: 0,
        visible: false,
        temporary: true,
    };
}
