import type { ShapeTextValueSet } from "../../../../../apiTypes";
import { getShapeFromGlobal } from "../../../id";
import type { CircularToken } from "../../../shapes/variants/circularToken";
import { socket } from "../../socket";

socket.on("Shape.CircularToken.Value.Set", (data: ShapeTextValueSet) => {
    const shape = getShapeFromGlobal(data.uuid) as CircularToken | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer?.invalidate(true);
});
