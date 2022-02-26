import { generateLocalId } from "../src/game/id";
import type { LocalId } from "../src/game/id";
import type { IShape } from "../src/game/shapes/interfaces";

function generateShape(): IShape {
    return {} as IShape;
}

export function generateTestLocalId(): LocalId {
    return generateLocalId(generateShape());
}
