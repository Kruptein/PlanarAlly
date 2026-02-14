import type { ShapeSize } from "../../game/interfaces/shape";
import { type GlobalPoint, toGP, getPointDistanceSquared } from "../geometry";
import { getClosestPoint } from "../math";

import { axialRound } from "./hex";
import type { AxialCoords } from "./types";

/*

SQUARE GRIDS are defined by a width and height that are equal to DEFAULT_GRID_SIZE.
HEX GRIDS width and height are defined in terms of the radius of the outer circle of the hexagon.
This radius is also equal to the length of each of the 6 sides.
This makes hex grids complexer.

For Square:
 (0, 0) coord is top-left
 width = DEFAULT_GRID_SIZE
 height = DEFAULT_GRID_SIZE
 horizontal dist = DEFAULT_GRID_SIZE
 vertical dist = DEFAULT_GRID_SIZE

For Flat Hexes:
 (0, 0) coord is ??
 width = 2 * radius
 height = sqrt(3) * radius
 horizontal distance between hexes = 3/4 * width = 3/2 * radius
 vertical distance = height = sqrt(3) * radius

For Pointy Hexes (reversed):
 (0, 0) coord is top point
 width = sqrt(3) * radius
 height = 2 * radius
 horizontal distance between hexes = width = sqrt(3) * radius
 vertical distance = 3/4 * height = 3/2 * radius

With these formulas in mind, we define the default radius of a hex grid as DEFAULT_GRID_SIZE / SQRT3.
This makes it so that the width of a pointy hex grid is equal to the width of a square grid and
the height of a flat hex grid is equal to the height of a square grid.
*/

export const DEFAULT_GRID_SIZE = 50;

export const SQRT3 = Math.sqrt(3);
export const DEFAULT_HEX_RADIUS = DEFAULT_GRID_SIZE / SQRT3;

export enum GridType {
    Square = "SQUARE",
    PointyHex = "POINTY_HEX",
    FlatHex = "FLAT_HEX",
}

export enum GridModeRulerType {
    Unchanged = "UNCHANGED",
    Alternating = "ALTERNATING",
    Manhattan = "MANHATTAN",
    Euclidean = "EUCLIDEAN",
    EuclideanApprox = "EUCLIDEAN_APPROX",
}

export function getClosestCellCenter(position: GlobalPoint, gridType: GridType): GlobalPoint {
    return getCellCenter(getCellFromPoint(position, gridType), gridType);
}

function snapShapeToHexGrid(
    position: GlobalPoint,
    gridType: GridType,
    size: ShapeSize,
    oddHexOrientation: boolean,
): GlobalPoint {
    const maxSize = Math.max(size.x, size.y);

    if (maxSize % 2 !== 0) {
        return getClosestCellCenter(position, gridType);
    }

    const cell = getCellFromPoint(position, gridType);
    const cellPoints = getCellVertices(cell, gridType);

    let min: [GlobalPoint | null, number] = [null, Infinity];
    for (const [i, p] of cellPoints.entries()) {
        // for hex grids we only want to consider every second vertex depening on the orientation!
        if (i % 2 === (oddHexOrientation ? 0 : 1)) continue;

        const d = getPointDistanceSquared(p, position);
        if (min[0] === null || d < min[1]) min = [p, d];
    }

    return min[0]!;
}

function snapShapeToSquareGrid(position: GlobalPoint, size: ShapeSize): GlobalPoint {
    const evenWidth = size.x % 2 === 0;
    const evenHeight = size.y % 2 === 0;

    if (!evenWidth && !evenHeight) {
        return getClosestCellCenter(position, GridType.Square);
    }

    const cell = getCellFromPoint(position, GridType.Square);
    const cellPoints = getCellVertices(cell, GridType.Square);

    const candidatePoints: GlobalPoint[] = [];

    if (evenWidth && evenHeight) {
        candidatePoints.push(...cellPoints);
    } else {
        for (let i = 0; i < cellPoints.length; i++) {
            const iv = cellPoints[i]!;
            const niv = cellPoints[(i + 1) % cellPoints.length]!;
            if (evenWidth && iv.x !== niv.x) continue;
            if (evenHeight && iv.y !== niv.y) continue;
            candidatePoints.push(toGP((iv.x + niv.x) / 2, (iv.y + niv.y) / 2));
        }
    }
    let min: [GlobalPoint | null, number] = [null, Infinity];
    for (const p of candidatePoints) {
        const d = getPointDistanceSquared(p, position);
        if (min[0] === null || d < min[1]) min = [p, d];
    }

    return min[0]!;
}

/*
 * Returns the GlobalPoint that represents the center for a shape of the provided size in the neighbourhood of the provided position in such a way that it is grid aligned.
 * Size should be an integer representing the amount of grid cells the shape spans and NOT a pixel length.
 * The returned point will be the center of a cell for odd sized shapes and a cell corner for even sized shapes.
 * For shapes with an odd width and even height (or vice versa) on a square grid, the returned point will be the midpoint of a cell edge.
 * For hex grids two different centers are possible depending on the orientation of the shape, which should be provided with the `oddHexOrientation` parameter.
 */
export function snapShapeToGrid(
    position: GlobalPoint,
    gridType: GridType,
    size: ShapeSize,
    oddHexOrientation: boolean,
): GlobalPoint {
    if (gridType === GridType.Square) {
        return snapShapeToSquareGrid(position, size);
    }
    return snapShapeToHexGrid(position, gridType, size, oddHexOrientation);
}

/**
 * Returns the closest point from the provided position to the grid.
 * The points that are considered for snapping are:
 *  - the vertices of the cell
 *  - the center of the cell
 *  - the center of each cell edge.
 */
export function snapPointToGrid(
    position: GlobalPoint,
    gridType: GridType,
    options?: {
        snapDistance?: number;
        includeEdgeCenters?: boolean;
        includeCellCenter?: boolean;
    },
): [GlobalPoint, boolean] {
    const cell = getCellFromPoint(position, gridType);
    const coreVertices = getCellVertices(cell, gridType);
    const vertices = [];
    for (let i = 0; i < coreVertices.length; i++) {
        const iv = coreVertices[i]!;
        vertices.push(iv);
        if (options?.includeEdgeCenters === true) {
            const niv = coreVertices[(i + 1) % coreVertices.length]!;
            vertices.push(toGP((iv.x + niv.x) / 2, (iv.y + niv.y) / 2));
        }
    }
    if (options?.includeCellCenter === true) {
        vertices.push(getCellCenter(cell, gridType));
    }
    return getClosestPoint(position, vertices, options?.snapDistance);
}

/**
 * Returns the CENTER of the specified cell
 * @param radius
 *  Optional value to specify the radius of the cell.
 *  If not provided, DEFAULT_HEX_RADIUS or DEFAULT_GRID_SIZE/2 will be used depending on the grid type.
 */
export function getCellCenter(cell: AxialCoords, gridType: GridType, radius?: number): GlobalPoint {
    if (gridType === GridType.Square) {
        radius ??= DEFAULT_GRID_SIZE / 2;
        return toGP(cell.q * 2 * radius + radius, cell.r * 2 * radius + radius);
    } else if (gridType === GridType.PointyHex) {
        radius ??= DEFAULT_HEX_RADIUS;
        const { q, r } = cell;
        const x = radius * (SQRT3 * q + (SQRT3 / 2) * r);
        const y = radius * ((3 / 2) * r + 1); // + 1 to account for the move from the top point to the center
        return toGP(x, y);
    } else if (gridType === GridType.FlatHex) {
        radius ??= DEFAULT_HEX_RADIUS;
        const { q, r } = cell;
        const x = radius * ((3 / 2) * q + 1); // + 1 to account for the move from the top point to the center
        const y = radius * ((SQRT3 / 2) * q + SQRT3 * r);
        return toGP(x, y);
    }
    throw new Error();
}

export function getCellFromPoint(point: GlobalPoint, gridType: GridType): AxialCoords {
    if (gridType === GridType.Square) {
        return {
            q: Math.floor(point.x / DEFAULT_GRID_SIZE),
            r: Math.floor(point.y / DEFAULT_GRID_SIZE),
        };
    } else if (gridType === GridType.PointyHex) {
        const { x, y } = point;
        const q = ((SQRT3 / 3) * x - (1 / 3) * (y - DEFAULT_HEX_RADIUS)) / DEFAULT_HEX_RADIUS;
        const r = ((2 / 3) * (y - DEFAULT_HEX_RADIUS)) / DEFAULT_HEX_RADIUS;

        return axialRound({ q, r });
    } else if (gridType === GridType.FlatHex) {
        const { x, y } = point;
        const q = ((2 / 3) * (x - DEFAULT_HEX_RADIUS)) / DEFAULT_HEX_RADIUS;
        const r = ((-1 / 3) * (x - DEFAULT_HEX_RADIUS) + (SQRT3 / 3) * y) / DEFAULT_HEX_RADIUS;

        return axialRound({ q, r });
    }
    throw new Error();
}

export function getCellVertices(cell: AxialCoords, gridType: GridType): GlobalPoint[] {
    if (gridType === GridType.Square) {
        const { q, r } = cell;
        return [
            toGP(q * DEFAULT_GRID_SIZE, r * DEFAULT_GRID_SIZE),
            toGP((q + 1) * DEFAULT_GRID_SIZE, r * DEFAULT_GRID_SIZE),
            toGP((q + 1) * DEFAULT_GRID_SIZE, (r + 1) * DEFAULT_GRID_SIZE),
            toGP(q * DEFAULT_GRID_SIZE, (r + 1) * DEFAULT_GRID_SIZE),
        ];
    } else {
        const center = getCellCenter(cell, gridType);
        const { x, y } = center;
        const vertices = [];

        if (gridType === GridType.PointyHex) {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * (2 * i - 1)) / 6;
                vertices.push(toGP(x + DEFAULT_HEX_RADIUS * Math.cos(angle), y + DEFAULT_HEX_RADIUS * Math.sin(angle)));
            }
            return vertices;
        } else if (gridType === GridType.FlatHex) {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * i) / 3;
                vertices.push(toGP(x + DEFAULT_HEX_RADIUS * Math.cos(angle), y + DEFAULT_HEX_RADIUS * Math.sin(angle)));
            }
            return vertices;
        }
    }
    throw new Error();
}

/**
 * Returns how many cells the provided width would occupy on the provided grid.
 * @param width the width of the element in pixels
 * @param gridType the type of grid used
 */
export function getCellCountFromWidth(width: number, gridType: GridType): number {
    if (gridType === GridType.Square || gridType === GridType.PointyHex) {
        // For Pointy Hex this is
        //   width / (SQRT3 * DEFAULT_HEX_RADIUS),
        // which expands to
        //   width / (SQRT3 * (DEFAULT_GRID_SIZE / SQRT3))
        // or simply width / DEFAULT_GRID_SIZE
        return width / DEFAULT_GRID_SIZE;
    } else if (gridType === GridType.FlatHex) {
        return width / (2 * DEFAULT_HEX_RADIUS);
    }
    throw new Error();
}

export function getWidthFromCellCount(cells: number, gridType: GridType): number {
    if (gridType === GridType.Square || gridType === GridType.PointyHex) {
        return cells * DEFAULT_GRID_SIZE;
    } else if (gridType === GridType.FlatHex) {
        return cells * 2 * DEFAULT_HEX_RADIUS;
    }
    throw new Error();
}

/**
 * Returns how many cells the provided height would occupy on the provided grid.
 * @param height the width of the element in pixels
 * @param gridType the type of grid used
 */
export function getCellCountFromHeight(height: number, gridType: GridType): number {
    if (gridType === GridType.Square || gridType === GridType.FlatHex) {
        // see getCellWidth, for the math of FlatHex
        return height / DEFAULT_GRID_SIZE;
    } else if (gridType === GridType.PointyHex) {
        return height / (2 * DEFAULT_HEX_RADIUS);
    }
    throw new Error();
}

export function getHeightFromCellCount(cells: number, gridType: GridType): number {
    if (gridType === GridType.Square || gridType === GridType.FlatHex) {
        return cells * DEFAULT_GRID_SIZE;
    } else if (gridType === GridType.PointyHex) {
        return cells * 2 * DEFAULT_HEX_RADIUS;
    }
    throw new Error();
}

// This does NOT include the starting cell!!!
export function getCellDistance(a: AxialCoords, b: AxialCoords, gridType: GridType): number {
    if (gridType === GridType.Square) {
        const aCenter = getCellCenter(a, gridType);
        const bCenter = getCellCenter(b, gridType);
        return Math.round(
            Math.max(
                getCellCountFromWidth(Math.abs(bCenter.x - aCenter.x), gridType),
                getCellCountFromHeight(Math.abs(bCenter.y - aCenter.y), gridType),
            ),
        );
    }
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/*
This is code to deal with resizing shapes on the map tool.

This is derived from the following formulas:

const ratio = getWidthFromCellCount(mapTool.state.gridX, gridType) / mapTool.rect!.w;
const newHeight = mapTool.rect!.h * ratio;
mapTool.state.gridY = getCellCountFromHeight(newHeight, gridType);

y = (h * (x * DEFAULT) / w) / (2 * (DEF / SQRT3))
y = ((h/w) * x * DEFAULT) / (2 * (DEF / SQRT3))
y = ((h/w) * x) * SQRT3/2

AS = (w/h) * (2/SQRT3)
1/AS = (h/w) * (SQRT3/2)

---

const ratio = getHeightFromCellCount(mapTool.state.gridY, gridType) / mapTool.rect!.h;
const newWidth = mapTool.rect!.w * ratio;
mapTool.state.gridX = getCellCountFromWidth(newWidth, gridType);

x = (w/h) * y * 2/SQRT3


---

For square grids in both directions this always comes down to:
x = (w * (y * DEFAULT) / h) / DEFAULT
x = ((w/h) * y

*/

export function getAspectRatio(w: number, h: number, gridType: GridType): number {
    const baseAspect = w / h;
    if (gridType === GridType.Square) {
        return baseAspect;
    } else if (gridType === GridType.PointyHex) {
        return baseAspect * (2 / SQRT3);
    } else if (gridType === GridType.FlatHex) {
        return baseAspect * (SQRT3 / 2);
    }
    throw new Error();
}
