import { getShapeFromGlobal } from "../../../id";
import type { GlobalId } from "../../../id";
import type { Asset } from "../../../shapes/variants/asset";
import { socket } from "../../socket";

socket.on("Shape.Asset.Image.Set", (data: { uuid: GlobalId; src: string }) => {
    const shape = getShapeFromGlobal(data.uuid) as Asset | undefined;
    if (shape === undefined) return;

    shape.setImage(data.src, false);
});
