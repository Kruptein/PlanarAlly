import type { ShapeTextSizeUpdate, ShapeTextValueSet } from "../../../../apiTypes";
import { getLocalId, getShape } from "../../../id";
import type { IText } from "../../../interfaces/shapes/text";
import { socket } from "../../socket";

socket.on("Shape.Text.Value.Set", (data: ShapeTextValueSet) => {
    const shape = getShape(getLocalId(data.uuid)!) as IText | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer?.invalidate(true);
});

socket.on("Shape.Text.Size.Update", (data: ShapeTextSizeUpdate) => {
    const shape = getShape(getLocalId(data.uuid)!) as IText | undefined;
    if (shape === undefined) return;

    shape.fontSize = data.font_size;
    shape.layer?.invalidate(!shape.triggersVisionRecalc);
});
