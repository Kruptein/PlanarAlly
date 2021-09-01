import { UuidMap } from "../../../../store/shapeMap";
import type { Text } from "../../../shapes/variants/text";
import { socket } from "../../socket";

socket.on("Shape.Text.Value.Set", (data: { uuid: string; text: string }) => {
    const shape = UuidMap.get(data.uuid) as Text | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer.invalidate(true);
});
