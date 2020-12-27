import { uuidv4 } from "../../core/utils";
import { UiTracker } from "../ui/ActiveShapeStore";

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
