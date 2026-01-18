import { g2lz, g2l } from "../../core/conversions";
import { type GlobalPoint, subtractP, addP, toGP } from "../../core/geometry";
import { DEFAULT_GRID_SIZE, DEFAULT_HEX_RADIUS, GridType, getCellCenter } from "../../core/grid";
import { getHexNeighbour, getHexVertexVector } from "../../core/grid/hex";
import type { AxialCoords } from "../../core/grid/types";
import type { ShapeSize } from "../interfaces/shape";

export function drawCells(
    ctx: CanvasRenderingContext2D,
    center: GlobalPoint,
    size: ShapeSize,
    grid: { type: GridType; oddHexOrientation: boolean; radius?: number },
    style?: { fill?: string; stroke?: string; strokeWidth?: number },
): void {
    if (grid.type === GridType.Square) {
        drawSquarePolygon(ctx, center, size, grid.radius, style);
    } else {
        drawHexPolygon(ctx, center, size, grid, style);
    }
}

function drawSquarePolygon(
    ctx: CanvasRenderingContext2D,
    center: GlobalPoint,
    size: ShapeSize,
    radius?: number,
    style?: { fill?: string; stroke?: string; strokeWidth?: number },
): void {
    ctx.fillStyle = style?.fill ?? "rgba(225, 0, 0, 0.2)";
    ctx.strokeStyle = style?.stroke ?? "rgba(225, 0, 0, 0.8)";
    ctx.lineWidth = style?.strokeWidth ?? 5;

    radius ??= DEFAULT_GRID_SIZE / 2;

    const localRadius = g2lz(radius);
    const localCenter = g2l(center);
    const x0 = localCenter.x - localRadius * size.x;
    const y0 = localCenter.y - localRadius * size.y;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + localRadius * size.x * 2, y0);
    ctx.lineTo(x0 + localRadius * size.x * 2, y0 + localRadius * size.y * 2);
    ctx.lineTo(x0, y0 + localRadius * size.y * 2);
    ctx.closePath();

    ctx.stroke();
    ctx.fill();
}

function drawHexPolygon(
    ctx: CanvasRenderingContext2D,
    center: GlobalPoint,
    size: ShapeSize,
    grid: { type: GridType; oddHexOrientation: boolean; radius?: number },
    style?: { fill?: string; stroke?: string; strokeWidth?: number },
): void {
    ctx.fillStyle = style?.fill ?? "rgba(225, 0, 0, 0.2)";
    ctx.strokeStyle = style?.stroke ?? "rgba(225, 0, 0, 0.8)";
    ctx.lineWidth = style?.strokeWidth ?? 5;

    const maxSize = Math.max(size.x, size.y);
    const vertices = createHex(center, maxSize, grid).map((p) => g2l(p));

    ctx.beginPath();
    for (const [i, vertex] of vertices.entries()) {
        if (i === 0) ctx.moveTo(vertex.x, vertex.y);
        else ctx.lineTo(vertex.x, vertex.y);
    }
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
}

export function createHex(
    center: GlobalPoint,
    size: number,
    grid: { type: GridType; oddHexOrientation: boolean; radius?: number },
): GlobalPoint[] {
    const radius = grid.radius ?? DEFAULT_HEX_RADIUS;

    let currentCell: AxialCoords = { q: 0, r: 0 };
    if (size === 1) {
        return createSingleHex(currentCell, center, radius);
    } else {
        // This function can be used to draw non-grid aligned hexagons
        // We first need to figure out what the vector is between the grid's {q:0,r:0} and our custom hexagon's {q:0,r:0}
        // This can then be used to find local coords for our draw operations
        const rootCellCenter = getCellCenter(currentCell, grid.type, radius);
        const isFlat = grid.type === GridType.FlatHex;

        // Evenly sized hexagons don't have a hex in the center, so we need to adjust the center point
        // This is done in such a way that it moves towards the smaller side of the hexagon
        if (size % 2 === 0) {
            if (isFlat) {
                center.x -= radius * (grid.oddHexOrientation ? -1 : 1);
            } else {
                center.y -= radius * (grid.oddHexOrientation ? -1 : 1);
            }
        }

        const offsetVector = subtractP(center, rootCellCenter);

        const oddSteps = size % 2 === 0 ? size / 2 - 1 : (size - 1) / 2;
        const evenSteps = size % 2 === 0 ? size / 2 : (size - 1) / 2;

        // a modulo 6 function that immediately handles the oddHexOrientation
        const m6 = (i: number): number => (grid.oddHexOrientation ? (i + 3) % 6 : i);

        // eslint-disable-next-line no-inner-declarations
        function even(v1: number, v2: number, n: number): void {
            for (let i = 0; i <= evenSteps; i++) {
                let v = addP(currentCellCenter, getHexVertexVector(m6(v1), radius, isFlat));
                vertices.push(v);
                v = addP(currentCellCenter, getHexVertexVector(m6(v2), radius, isFlat));
                vertices.push(v);
                if (i < evenSteps) {
                    currentCell = getHexNeighbour(currentCell, m6(n));
                    currentCellCenter = addP(getCellCenter(currentCell, grid.type, radius), offsetVector);
                }
            }
        }

        // eslint-disable-next-line no-inner-declarations
        function odd(v1: number, v2: number, n: number): void {
            for (let i = 0; i < oddSteps; i++) {
                let v = addP(currentCellCenter, getHexVertexVector(m6(v1), radius, isFlat));
                vertices.push(v);
                currentCell = getHexNeighbour(currentCell, m6(n));
                currentCellCenter = addP(getCellCenter(currentCell, grid.type, radius), offsetVector);
                v = addP(currentCellCenter, getHexVertexVector(m6(v2), radius, isFlat));
                vertices.push(v);
            }
        }

        // First step to a corner of the hexagon
        for (let i = 0; i < (isFlat ? evenSteps : oddSteps); i++) currentCell = getHexNeighbour(currentCell, m6(1));
        let currentCellCenter = addP(getCellCenter(currentCell, grid.type, radius), offsetVector);
        const start = addP(currentCellCenter, getHexVertexVector(m6(2), radius, isFlat));

        const vertices: GlobalPoint[] = [start];

        // Now we move along the exterior of the hexagon in a structured pattern
        // Even and Odd are used to handle the different number of steps that can occur when dealing with evenly sized hexagons
        // these have alternating long and short edges,
        // whereas odd sized hexagons have all their edges the same length
        // These functions perform somewhat similar operations, but step to the next hex at a different point in time

        even(1, 0, 5);
        odd(5, 0, 4);
        even(5, 4, 3);
        odd(3, 4, 2);
        even(3, 2, 1);
        odd(1, 2, 0);

        return vertices;
    }
}

function createSingleHex(cell: AxialCoords, center: GlobalPoint, radius: number): GlobalPoint[] {
    const x0 = center.x + radius * Math.sqrt(3) * (cell.q + cell.r / 2);
    const y0 = center.y + ((radius * 3) / 2) * cell.r;

    const vertices: GlobalPoint[] = [];
    const angle = (Math.PI * 2) / 6;
    for (let i = 0; i < 6; i++) {
        const x = x0 + radius * Math.cos(i * angle - Math.PI / 6);
        const y = y0 + radius * Math.sin(i * angle - Math.PI / 6);
        vertices.push(toGP(x, y));
    }
    return vertices;
}
