import type { GlobalPoint } from "../../core/geometry";
import type { LocalId } from "../../core/id";
import type { FloorId } from "../models/floor";
import { drawPolygon } from "../rendering/basic";

import type { Edge } from "./cdt";
import { visionState } from "./state";
import type { BehindPatch, TriangulationTarget } from "./state";
import { Sign } from "./tds";
import type { Point, Triangle, Vertex } from "./tds";
import { ccw, cw, orientation } from "./triag";

// Only import this if you want to debug the vision algorithm.
// import "./teDebug";

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
export function computeVisibility(
    q: GlobalPoint,
    target: TriangulationTarget,
    floor: FloorId,
    drawt?: boolean,
    maxRange?: number,
): {
    visibility: Point[];
    behindPatches: Map<LocalId, BehindPatch[]>;
} {
    if (drawt === undefined) drawt = visionState.drawTeContour;
    // console.time("CV");
    const Q: Point = [q.x, q.y];
    const rawOutput: Point[] = [];
    const behindPatches = new Map<LocalId, BehindPatch[]>();
    const triangle = visionState.getCDT(target, floor).locate(Q, null).loc;
    if (triangle === null) {
        console.error("Triangle not found");
        return { visibility: [], behindPatches };
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
            expandEdge(Q, vPrev.point!, vNext.point!, triangle, i, rawOutput, behindPatches, behindPath);
            if (crossingBehindShape) {
                behindPath?.push(vPrev.point!);
            }
        }
    }

    if (maxRange !== undefined) {
        const rSq = maxRange * maxRange;
        for (let i = 0; i < rawOutput.length; i++) {
            const p = rawOutput[i]!;
            const dx = p[0] - Q[0];
            const dy = p[1] - Q[1];
            const dSq = dx * dx + dy * dy;
            if (dSq > rSq) {
                const scale = maxRange / Math.sqrt(dSq);
                rawOutput[i] = [Q[0] + dx * scale, Q[1] + dy * scale];
            }
        }
    }

    if (drawt) drawPolygon(rawOutput, { strokeColour: "red", strokeWidth: 3 });

    return { visibility: rawOutput, behindPatches };
}

/**
 * Expand (recursively) through the triangle `fh`'s edge as indicated by `index`.
 *
 * Left and right are usually the same as the edge's points, but can also sometimes not match due to a narrower vision angle being enforced by earlier recursions.
 * It should be noted that `left` and `right` are interpreted from the point of view of the neighbouring triangle, we're entering.
 */
function expandEdge(
    q: Point,
    left: Point,
    right: Point,
    fh: Triangle,
    index: number,
    rawOutput: Point[],
    behindPatches: Map<LocalId, BehindPatch[]>,
    extraOutput?: Point[],
): void {
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
            if (lo === Sign.COUNTERCLOCKWISE) activeOutput.push(raySegIntersection(q, left, nvh.point!, rvh.point!));

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
            }
        }

        if (continueExpand) {
            if (lo === Sign.COUNTERCLOCKWISE) {
                expandEdge(q, left, right, nfh, rIndex, rawOutput, behindPatches, _extraOutput);
            } else {
                expandEdge(q, nvh.point!, right, nfh, rIndex, rawOutput, behindPatches, _extraOutput);
            }
            // After handling the edge, if the current triangle was not tracking an internal vision polygon,
            // but the neighbour was, we need to add the exit point to the path.
            if (!extraOutput && _extraOutput) {
                let exitNode = nvh.point!;
                if (lo === Sign.COUNTERCLOCKWISE) exitNode = raySegIntersection(q, left, nvh.point!, rvh.point!);
                _extraOutput.push(exitNode);
            }
        }
    }

    if (ro !== Sign.CLOCKWISE && lo !== Sign.COUNTERCLOCKWISE) {
        activeOutput.push(nvh.point!);
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
            if (left !== lvh.point!) activeOutput.push(raySegIntersection(q, left, nvh.point!, lvh.point!));

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
            }
        }
        if (continueExpand) {
            if (ro === Sign.CLOCKWISE) {
                expandEdge(q, left, right, nfh, lIndex, rawOutput, behindPatches, _extraOutput);
            } else {
                expandEdge(q, left, nvh.point!, nfh, lIndex, rawOutput, behindPatches, _extraOutput);
            }
            if (!extraOutput && _extraOutput) {
                _extraOutput.push(left);
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
