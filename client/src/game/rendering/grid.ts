import { g2lz, g2l } from "../../core/conversions";
import { type GlobalPoint, toArrayP, subtractP, addP } from "../../core/geometry";
import { DEFAULT_GRID_SIZE, DEFAULT_HEX_RADIUS, GridType, getCellCenter } from "../../core/grid";
import { getHexNeighbour, getHexVertexVector } from "../../core/grid/hex";
import type { AxialCoords } from "../../core/grid/types";

export function drawCells(
    ctx: CanvasRenderingContext2D,
    center: GlobalPoint,
    size: number,
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
    size: number,
    radius?: number,
    style?: { fill?: string; stroke?: string; strokeWidth?: number },
): void {
    ctx.fillStyle = style?.fill ?? "rgba(225, 0, 0, 0.2)";
    ctx.strokeStyle = style?.stroke ?? "rgba(225, 0, 0, 0.8)";
    ctx.lineWidth = style?.strokeWidth ?? 5;

    radius ??= DEFAULT_GRID_SIZE / 2;

    const localRadius = g2lz(radius);
    const localCenter = g2l(center);
    const x0 = localCenter.x - localRadius * size;
    const y0 = localCenter.y - localRadius * size;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + localRadius * size * 2, y0);
    ctx.lineTo(x0 + localRadius * size * 2, y0 + localRadius * size * 2);
    ctx.lineTo(x0, y0 + localRadius * size * 2);
    ctx.closePath();

    ctx.stroke();
    ctx.fill();
}

function drawHexPolygon(
    ctx: CanvasRenderingContext2D,
    center: GlobalPoint,
    size: number,
    grid: { type: GridType; oddHexOrientation: boolean; radius?: number },
    style?: { fill?: string; stroke?: string; strokeWidth?: number },
): void {
    ctx.fillStyle = style?.fill ?? "rgba(225, 0, 0, 0.2)";
    ctx.strokeStyle = style?.stroke ?? "rgba(225, 0, 0, 0.8)";
    ctx.lineWidth = style?.strokeWidth ?? 5;

    const radius = grid.radius ?? DEFAULT_HEX_RADIUS;

    const localRadius = g2lz(radius);
    let currentCell: AxialCoords = { q: 0, r: 0 };
    if (size === 1) {
        drawSingleHexPolygon(currentCell, toArrayP(g2l(center)), localRadius, ctx);
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
                let v = addP(currentCellCenter, getHexVertexVector(m6(v1), localRadius, isFlat));
                ctx.lineTo(v.x, v.y);
                v = addP(currentCellCenter, getHexVertexVector(m6(v2), localRadius, isFlat));
                ctx.lineTo(v.x, v.y);
                if (i < evenSteps) {
                    currentCell = getHexNeighbour(currentCell, m6(n));
                    currentCellCenter = g2l(addP(getCellCenter(currentCell, grid.type, radius), offsetVector));
                }
            }
        }

        // eslint-disable-next-line no-inner-declarations
        function odd(v1: number, v2: number, n: number): void {
            for (let i = 0; i < oddSteps; i++) {
                let v = addP(currentCellCenter, getHexVertexVector(m6(v1), localRadius, isFlat));
                ctx.lineTo(v.x, v.y);
                currentCell = getHexNeighbour(currentCell, m6(n));
                currentCellCenter = g2l(addP(getCellCenter(currentCell, grid.type, radius), offsetVector));
                v = addP(currentCellCenter, getHexVertexVector(m6(v2), localRadius, isFlat));
                ctx.lineTo(v.x, v.y);
            }
        }

        // First step to a corner of the hexagon
        for (let i = 0; i < (isFlat ? evenSteps : oddSteps); i++) currentCell = getHexNeighbour(currentCell, m6(1));
        let currentCellCenter = g2l(addP(getCellCenter(currentCell, grid.type, radius), offsetVector));
        const start = addP(currentCellCenter, getHexVertexVector(m6(2), localRadius, isFlat));
        ctx.moveTo(start.x, start.y);
        ctx.beginPath();

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

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function drawSingleHexPolygon(
    cell: AxialCoords,
    center: [number, number],
    radius: number,
    ctx: CanvasRenderingContext2D,
): void {
    const x0 = center[0] + radius * Math.sqrt(3) * (cell.q + cell.r / 2);
    const y0 = center[1] + ((radius * 3) / 2) * cell.r;

    ctx.beginPath();
    const angle = (Math.PI * 2) / 6;
    for (let i = 0; i < 6; i++) {
        const x = x0 + radius * Math.cos(i * angle - Math.PI / 6);
        const y = y0 + radius * Math.sin(i * angle - Math.PI / 6);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.stroke();
    ctx.fill();
}
