import { UuidMap } from "../../../../store/shapeMap";
import type { Text } from "../../../shapes/variants/text";
import { socket } from "../../socket";

socket.on("Shape.Text.Value.Set", (data: { uuid: string; text: string }) => {
    const shape = UuidMap.get(data.uuid) as Text | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer.invalidate(true);
});

socket.on("Shape.Text.Size.Update", (data: { uuid: string; font_size: number }) => {
    const shape = UuidMap.get(data.uuid) as Text | undefined;
    if (shape === undefined) return;

    shape.fontSize = data.font_size;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});
