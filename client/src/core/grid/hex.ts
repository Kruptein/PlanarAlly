import { toRadians } from "../conversions";
import { Vector } from "../geometry";

import type { AxialCoords, CubeCoord } from "./types";

/**
 * A hexagon grid is a grid of hexagons. Each hexagon has 6 neighbours.
 * The directions below apply to axial coordinates and start with the right neighbour and go counterlockwise.
 * For flat hexes it starts with the bottom-right neighbour.
 */
const AXIAL_DIRECTIONS = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
];

// *** FUNCTIONS IN CONTEXT OF GENERIC HEX CELLS ***

// See AXIAL_DIRECTIONS for info on the direction
export function getHexNeighbour(cell: AxialCoords, direction: number): AxialCoords {
    const vector = AXIAL_DIRECTIONS[direction];
    if (vector === undefined) throw new Error("Invalid direction");
    return { q: cell.q + vector.q, r: cell.r + vector.r };
}

// *** FUNCTIONS IN CONTEXT OF ACTUAL PIXELS ***

// Returns a vector from the center of the hex to the vertex at the given index.
// vertexIndex follows a similar count to the AXIAL_DIRECTIONS index,
// starting with the (bottom) right vertex and going counterclockwise
export function getHexVertexVector(vertexIndex: number, radius: number, isFlat: boolean): Vector {
    const angle = toRadians(60 * vertexIndex) - (isFlat ? 0 : Math.PI / 6);
    return new Vector(radius * Math.cos(angle), radius * Math.sin(-angle));
}

// *** HELPERS ***
// These are taken almost verbatim from https://www.redblobgames.com/grids/hexagons/#rounding

export function axialRound({ q, r }: AxialCoords): AxialCoords {
    return cubeToAxial(cubeRound(axialToCube({ q, r })));
}

function cubeRound({ q: x, r: y, s: z }: CubeCoord): CubeCoord {
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);

    const xDiff = Math.abs(rx - x);
    const yDiff = Math.abs(ry - y);
    const zDiff = Math.abs(rz - z);

    if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
    else if (yDiff > zDiff) ry = -rx - rz;
    else rz = -rx - ry;

    return { q: rx, r: ry, s: rz };
}

function axialToCube({ q, r }: AxialCoords): CubeCoord {
    return { q: q, r: r, s: -q - r };
}

function cubeToAxial({ q: x, r: y }: CubeCoord): AxialCoords {
    return { q: x, r: y };
}
