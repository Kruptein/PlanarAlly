import { uuidv4 } from "../../../core/utils";
import { UiAura, UiTracker } from "../../ui/ActiveShapeStore";

export function createEmptyTracker(shape: string): UiTracker {
    return {
        shape,
        uuid: uuidv4(),
        name: "",
        value: 0,
        maxvalue: 0,
        visible: false,
        temporary: true,
    };
}

export function createEmptyAura(shape: string): UiAura {
    return {
        shape,
        uuid: uuidv4(),
        name: "",
        value: 0,
        dim: 0,
        visionSource: false,
        colour: "rgba(0,0,0,0)",
        visible: false,
        temporary: true,
    };
}
