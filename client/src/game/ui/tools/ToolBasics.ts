import { LocalPoint } from "../../geom";
import { ToolFeatures, ToolName } from "./utils";

export interface ToolBasics {
    name: ToolName | null;
    active: boolean;

    onDown(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures): void;
    onUp(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures): void;
    onMove(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures): void;
}
