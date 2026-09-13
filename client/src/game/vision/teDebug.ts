/**
 * This is a debug file for the vision algorithm.
 * It mimicks the logic in te.ts (and thus has a bunch of duplication),
 * but it does this in an async manner with draw calls to visualize the algorithm.
 * This allows us to easily debug it and step through it, without making our core render logic slower.
 */

import type { GlobalPoint } from "../../core/geometry";
import type { LocalId } from "../../core/id";
import { getShape } from "../id";
import { drawPoint, drawPolygon, drawPolygonT } from "../rendering/basic";
import { floorState } from "../systems/floors/state";
import { selectedState } from "../systems/selected/state";

import type { Edge } from "./cdt";
import { visionState, TriangulationTarget } from "./state";
import type { BehindPatch } from "./state";
import { Sign } from "./tds";
import type { Point, Triangle, Vertex } from "./tds";
import { ccw, cw, orientation } from "./triag";

/**
 * Checks (and returns) whether the shape along the `vA`-`vB` edge of triangle `fh` is in "behind" vision mode.
 * Note that checking whether the third vertex belongs to a different shape would be incorrect,
 * as complex polygons can give triangles where all vertices are part of the same shape and yet be outside of that shape.
 */
function getBehindShape(vA: Vertex, vB: Vertex): LocalId | undefined {
    const edgeShapes = vA.shapes.intersection(vB.shapes);
    return Array.from(edgeShapes)[0];
}

/**
 * Computes the visibility polygon for a given point (q).
 *
 * It returns the main vision polygon that is derived from following the triangulation and all of its constraints.
 * It however also returns a separate set of vision polygons for vision blocking shapes along the path that are in "behind" vision mode.
 * For these shapes an internal vision polygon is computed along with the entrance edge used to enter the shape.
 * This is used to render the shape partially visible in the fowLighting and fowVision layers.
 */
async function debugComputeVisibility(): Promise<void> {
    const cdt = visionState.getCDT(TriangulationTarget.VISION, floorState.currentFloor.value!.id);

    const Q: Point = [getP().x, getP().y];
    const rawOutput: Point[] = [];
    const behindPatches = new Map<LocalId, BehindPatch[]>();
    const triangle = cdt.locate(Q, null).loc!;
    await drawCurrent(triangle, [], behindPatches);

    if (triangle === null) {
        console.error("Triangle not found");
        return;
    }

    // Iterate over the 3 triangle edges.
    // This will recurse further using expandEdge for each edge, but that logic runs on the assumption that we enter the triangle from a particular edge.
    // Because we always start in a triangle where we need to cover all edged, we have to handle that case separately here.
    for (let i = 0; i < 3; i++) {
        const nextI = (i + 1) % 3;
        const prevI = (i + 2) % 3;
        const vNext = triangle.vertices[nextI]!;
        const vPrev = triangle.vertices[prevI]!;
        rawOutput.push(vNext.point!);
        // oxlint-disable-next-line no-await-in-loop
        await drawCurrent(triangle, rawOutput, behindPatches);

        // We can always recurse further if the edge is not constrained.
        let continueExpand = !triangle.isConstrained(i);
        let crossingBehindShape = false;
        let behindPath: Point[] | undefined = undefined; // Used to track the path of the vision polygon inside the shape

        // If we're however dealing with a constrained edge that is part of a "behind" vision shape we also want to recurse further.
        // We however only want to do this if we're about to enter the shape. (i.e. our current face is NOT inside the shape)
        if (!continueExpand) {
            const behindShape = getBehindShape(vNext, vPrev);
            if (behindShape) {
                continueExpand = true;
                crossingBehindShape = true;
                behindPath = [];
                const patch: BehindPatch = {
                    points: behindPath,
                    entrance: [vPrev.point!, vNext.point!],
                };
                if (!behindPatches.has(behindShape)) {
                    behindPatches.set(behindShape, [patch]);
                } else {
                    behindPatches.get(behindShape)!.push(patch);
                }
                // Add the first point of the patch, it's the last point of our current path
                if (rawOutput.length > 0) behindPath.push(rawOutput.at(-1)!);
            }
        }

        if (continueExpand) {
            // oxlint-disable-next-line no-await-in-loop
            await expandEdge(Q, vPrev.point!, vNext.point!, triangle, i, rawOutput, behindPatches, behindPath);
            if (crossingBehindShape) {
                behindPath?.push(vPrev.point!);
            }
        }
    }
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).debugComputeVisibility = debugComputeVisibility;

/**
 * Expand (recursively) through the triangle `fh`'s edge as indicated by `index`.
 *
 * Left and right are usually the same as the edge's points, but can also sometimes not match due to a narrower vision angle being enforced by earlier recursions.
 * It should be noted that `left` and `right` are interpreted from the point of view of the neighbouring triangle, we're entering.
 */
async function expandEdge(
    q: Point,
    left: Point,
    right: Point,
    fh: Triangle,
    index: number,
    rawOutput: Point[],
    behindPatches: Map<LocalId, BehindPatch[]>,
    extraOutput?: Point[],
): Promise<void> {
    const nfh = fh.neighbours[index]!;
    const nIndex = nfh.indexT(fh);
    const rIndex = ccw(nIndex);
    const lIndex = cw(nIndex);
    const nvh = nfh.vertices[nIndex]!;
    const rvh = nfh.vertices[lIndex]!;
    const lvh = nfh.vertices[rIndex]!;

    const re: Edge = [nfh, rIndex];
    const le: Edge = [nfh, lIndex];

    const ro = orientation(q, right, nvh.point!);
    const lo = orientation(q, left, nvh.point!);

    // If extraOutput is set, we're tracking the internal vision polygon of a shape and points added only be added to that path.
    const activeOutput = extraOutput ?? rawOutput;

    await drawCurrent(nfh, rawOutput, behindPatches, left, right);

    // Check if we should enter the right edge
    if (ro === Sign.COUNTERCLOCKWISE) {
        // We should always recurse further if the edge is not constrained.
        let continueExpand = true;
        let _extraOutput: Point[] | undefined = extraOutput;
        if (re[0].isConstrained(re[1])) {
            continueExpand = false;

            // When dealing with a constrained edge, there are 2 cases where the full edge is not visible
            // In these cases we need to add the relevant intersection point to the path.
            if (right !== rvh.point!) activeOutput.push(raySegIntersection(q, right, nvh.point!, rvh.point!));
            await drawCurrent(nfh, rawOutput, behindPatches, left, right);
            if (lo === Sign.COUNTERCLOCKWISE) activeOutput.push(raySegIntersection(q, left, nvh.point!, rvh.point!));
            await drawCurrent(nfh, rawOutput, behindPatches, left, right);

            // Check if we're about to enter a behind shape.
            // This can only be done if we're not already tracking an internal vision polygon.
            const behindShape = extraOutput ? undefined : getBehindShape(rvh, nvh);
            if (behindShape) {
                continueExpand = true;
                _extraOutput = [];
                const patch: BehindPatch = {
                    points: _extraOutput,
                    entrance: [nvh.point!, right],
                };
                if (!behindPatches.has(behindShape)) {
                    behindPatches.set(behindShape, [patch]);
                } else {
                    behindPatches.get(behindShape)!.push(patch);
                }
                if (rawOutput.length > 0) _extraOutput.push(right);
                await drawCurrent(nfh, rawOutput, behindPatches, left, right);
            }
        }

        if (continueExpand) {
            if (lo === Sign.COUNTERCLOCKWISE) {
                await expandEdge(q, left, right, nfh, rIndex, rawOutput, behindPatches, _extraOutput);
            } else {
                await expandEdge(q, nvh.point!, right, nfh, rIndex, rawOutput, behindPatches, _extraOutput);
            }
            await drawCurrent(nfh, rawOutput, behindPatches, left, right);
            // After handling the edge, if the current triangle was not tracking an internal vision polygon,
            // but the neighbour was, we need to add the exit point to the path.
            if (!extraOutput && _extraOutput) {
                let exitNode = nvh.point!;
                if (lo === Sign.COUNTERCLOCKWISE) exitNode = raySegIntersection(q, left, nvh.point!, rvh.point!);
                _extraOutput.push(exitNode);
                await drawCurrent(nfh, rawOutput, behindPatches, left, right);
            }
        }
    }

    await drawCurrent(nfh, rawOutput, behindPatches, left, right);

    if (ro !== Sign.CLOCKWISE && lo !== Sign.COUNTERCLOCKWISE) {
        activeOutput.push(nvh.point!);
        await drawCurrent(nfh, rawOutput, behindPatches, left, right);
    }

    // Same logic for the left edge.
    // The main difference is that for the additional vision polygon
    //  we the entrance point and exit point logic is reversed.
    if (lo === Sign.CLOCKWISE) {
        let continueExpand = true;
        let _extraOutput: Point[] | undefined = extraOutput;
        if (le[0].isConstrained(le[1])) {
            continueExpand = false;

            if (ro === Sign.CLOCKWISE) activeOutput.push(raySegIntersection(q, right, nvh.point!, lvh.point!));
            await drawCurrent(nfh, rawOutput, behindPatches, left, right);
            if (left !== lvh.point!) activeOutput.push(raySegIntersection(q, left, nvh.point!, lvh.point!));
            await drawCurrent(nfh, rawOutput, behindPatches, left, right);

            const behindShape = extraOutput ? undefined : getBehindShape(lvh, nvh);
            if (behindShape) {
                continueExpand = true;
                _extraOutput = [];
                const patch: BehindPatch = {
                    points: _extraOutput,
                    entrance: [left, nvh.point!],
                };
                if (!behindPatches.has(behindShape)) {
                    behindPatches.set(behindShape, [patch]);
                } else {
                    behindPatches.get(behindShape)!.push(patch);
                }
                if (ro === Sign.CLOCKWISE) _extraOutput.push(raySegIntersection(q, right, nvh.point!, lvh.point!));
                else _extraOutput.push(nvh.point!);
                await drawCurrent(nfh, rawOutput, behindPatches, left, right);
            }
        }
        if (continueExpand) {
            if (ro === Sign.CLOCKWISE) {
                await expandEdge(q, left, right, nfh, lIndex, rawOutput, behindPatches, _extraOutput);
            } else {
                await expandEdge(q, left, nvh.point!, nfh, lIndex, rawOutput, behindPatches, _extraOutput);
            }
            await drawCurrent(nfh, rawOutput, behindPatches, left, right);
            if (!extraOutput && _extraOutput) {
                _extraOutput.push(left);
                await drawCurrent(nfh, rawOutput, behindPatches, left, right);
            }
        }
    }
}

function raySegIntersection(q: Point, b: Point, s: Point, t: Point): Point {
    const denominator = (t[1] - s[1]) * (b[0] - q[0]) - (t[0] - s[0]) * (b[1] - q[1]);
    const ua = ((t[0] - s[0]) * (q[1] - s[1]) - (t[1] - s[1]) * (q[0] - s[0])) / denominator;
    // const ub = ((b[0] - q.x) * (q.y - s[1]) - (b[1] - q.y) * (q.x - s[0])) / denominator;
    const x = q[0] + ua * (b[0] - q[0]);
    const y = q[1] + ua * (b[1] - q[1]);

    return [x, y];
}

function getP(): GlobalPoint {
    const s = selectedState.raw.focus!;
    return getShape(s)!.center;
}

async function drawCurrent(
    triangle: Triangle,
    rawOutput: Point[],
    behindPatches: Map<LocalId, { points: Point[]; entrance: [Point, Point] }[]>,
    left?: Point,
    right?: Point,
): Promise<void> {
    const cdt = visionState.getCDT(TriangulationTarget.VISION, floorState.currentFloor.value!.id);
    drawPolygonT(cdt.tds, false, true);
    drawPolygon(
        triangle.vertices.map((v) => v!.point!),
        { fillColour: "rgba(0, 0, 255, 0.25)" },
    );
    for (const [, patches] of behindPatches) {
        for (const patch of patches) {
            drawPolygon(patch.points, {
                fillColour: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.25)`,
                strokeColour: "pink",
                strokeWidth: 3,
            });
        }
    }
    drawPolygon(rawOutput, { strokeColour: "red", close: false });
    if (left) drawPoint(left, 10, { fill: true, colour: "purple" });
    if (right) drawPoint(right, 10, { fill: true, colour: "green" });
    await new Promise((resolve) => setTimeout(resolve, 10));
}
