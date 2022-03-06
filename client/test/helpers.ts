import { toGP } from "../src/core/geometry";
import type { LocalId } from "../src/game/id";
import { generateLocalId } from "../src/game/id";
import { LayerName } from "../src/game/models/floor";
import type { ServerFloor } from "../src/game/models/general";
import type { IShape } from "../src/game/shapes/interfaces";
import { Rect } from "../src/game/shapes/variants/rect";
import { floorStore } from "../src/store/floor";

export function generateTestShape(options?: { floor?: string }): IShape {
    const rect = new Rect(toGP(0, 0), 0, 0);
    if (options?.floor !== undefined) {
        let floor = floorStore.getFloor({ name: options.floor });
        if (floor === undefined) {
            floorStore.addServerFloor(generateTestFloor(options.floor));
            floor = floorStore.getFloor({ name: options.floor })!;
        }
        rect.setLayer(floor.id, LayerName.Tokens);
    }
    rect.invalidate = () => {};
    return rect;
}

export function generateTestLocalId(shape?: IShape): LocalId {
    shape ??= generateTestShape();
    const id = generateLocalId(shape);
    (shape as any).id = id;
    return id;
}

function generateTestFloor(name?: string): ServerFloor {
    return {
        name: name ?? "test floor",
        player_visible: false,
        type_: 1,
        background_color: null,
        layers: [
            {
                groups: [],
                index: 0,
                name: "test",
                player_editable: false,
                player_visible: true,
                selectable: true,
                shapes: [],
                type_: "tokens",
            },
        ],
        index: 0,
    };
}
