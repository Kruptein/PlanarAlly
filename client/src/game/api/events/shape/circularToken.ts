import { UuidMap } from "../../../../store/shapeMap";
import { CircularToken } from "../../../shapes/variants/circularToken";
import { socket } from "../../socket";

socket.on("Shape.CircularToken.Value.Set", (data: { uuid: string; text: string }) => {
    const shape = UuidMap.get(data.uuid) as CircularToken | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer.invalidate(true);
});
