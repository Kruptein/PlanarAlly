import { getLocalId, getShape } from "../../../id";
import type { GlobalId } from "../../../id";
import type { Text } from "../../../shapes/variants/text";
import { socket } from "../../socket";

socket.on("Shape.Text.Value.Set", (data: { uuid: GlobalId; text: string }) => {
    const shape = getShape(getLocalId(data.uuid)!) as Text | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer.invalidate(true);
});

socket.on("Shape.Text.Size.Update", (data: { uuid: GlobalId; font_size: number }) => {
    const shape = getShape(getLocalId(data.uuid)!) as Text | undefined;
    if (shape === undefined) return;

    shape.fontSize = data.font_size;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});
