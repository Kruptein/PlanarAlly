import { getShapeFromGlobal } from "../../../id";
import type { GlobalId } from "../../../id";
import type { CircularToken } from "../../../shapes/variants/circularToken";
import { socket } from "../../socket";

socket.on("Shape.CircularToken.Value.Set", (data: { uuid: GlobalId; text: string }) => {
    const shape = getShapeFromGlobal(data.uuid) as CircularToken | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer.invalidate(true);
});
