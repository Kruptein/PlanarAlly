import { IdMap, UuidToIdMap } from "../../../../store/shapeMap";
import type { CircularToken } from "../../../shapes/variants/circularToken";
import { socket } from "../../socket";

socket.on("Shape.CircularToken.Value.Set", (data: { uuid: string; text: string }) => {
    const shape = IdMap.get(UuidToIdMap.get(data.uuid)!) as CircularToken | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer.invalidate(true);
});
