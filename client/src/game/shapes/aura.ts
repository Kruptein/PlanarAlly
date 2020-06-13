import tinycolor from "tinycolor2";

import { TriangulationTarget } from "@/game/visibility/te/pa";
import { computeVisibility } from "@/game/visibility/te/te";
import { circleLineIntersection, xyEqual } from "@/game/visibility/te/triag";
import { GlobalPoint, LocalPoint } from "../geom";
import { g2l, g2lr, g2lz, getUnitDistance } from "../units";
import { Circle } from "./circle";
import { Shape } from "./shape";

export function drawAuras(shape: Shape, ctx: CanvasRenderingContext2D): void {
    for (const aura of shape.auras) {
        if (aura.value === 0 && aura.dim === 0) continue;
        ctx.beginPath();

        const loc = g2l(shape.center());
        const innerRange = g2lr(aura.value + aura.dim);

        if (aura.dim === 0) ctx.fillStyle = aura.colour;
        else {
            const gradient = ctx.createRadialGradient(
                loc.x,
                loc.y,
                g2lr(aura.value),
                loc.x,
                loc.y,
                g2lr(aura.value + aura.dim),
            );
            const tc = tinycolor(aura.colour);
            ctx.fillStyle = gradient;
            gradient.addColorStop(0, aura.colour);
            gradient.addColorStop(1, tc.setAlpha(0).toRgbString());
        }
        if (!aura.visionSource) {
            ctx.arc(loc.x, loc.y, innerRange, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            const polygon = computeVisibility(shape.center(), TriangulationTarget.VISION, shape.floor);
            aura.lastPath = updateAuraPath(polygon, shape.center(), getUnitDistance(aura.value + aura.dim));
            try {
                ctx.fill(aura.lastPath);
            } catch (e) {
                ctx.arc(loc.x, loc.y, innerRange, 0, 2 * Math.PI);
                ctx.fill();
                console.warn(e);
            }
        }
    }
}

export function updateAuraPath(visibilityPolygon: number[][], center: GlobalPoint, aura: number): Path2D {
    const auraCircle = new Circle(center, aura);
    const path = new Path2D();
    const lCenter = g2l(auraCircle.center());
    const lRadius = g2lz(auraCircle.r);
    let firstAngle: number | null = null;
    let lastAngle: number | null = null;

    const ixs: LocalPoint[][] = [];

    // First find all polygon segments that are actually relevant
    for (const [i, p] of visibilityPolygon.map(vp => GlobalPoint.fromArray(vp)).entries()) {
        const np = GlobalPoint.fromArray(visibilityPolygon[(i + 1) % visibilityPolygon.length]);
        const pLoc = g2l(p);
        const npLoc = g2l(np);
        const ix = circleLineIntersection(auraCircle.center(), auraCircle.r, p, np).map(x => g2l(x));
        if (ix.length === 0) {
            // segment lies completely outside circle
            if (!auraCircle.contains(p)) continue;
            // segment lies completely inside circle
            else ix.push(pLoc, npLoc);
        } else if (ix.length === 1) {
            // segment is tangent to circle, segment can be ignored
            if (xyEqual(ix[0].asArray(), pLoc.asArray()) || xyEqual(ix[0].asArray(), npLoc.asArray())) continue;
            if (auraCircle.contains(p)) {
                ix.unshift(pLoc);
            } else {
                ix.push(npLoc);
            }
        }
        // Check some bad cases
        if (ixs.length > 0) {
            const lastIx = ixs[ixs.length - 1];
            if (xyEqual(lastIx[0].asArray(), ix[1].asArray()) && xyEqual(lastIx[1].asArray(), ix[0].asArray()))
                continue;
            if (xyEqual(lastIx[0].asArray(), ix[0].asArray()) && xyEqual(lastIx[1].asArray(), ix[1].asArray()))
                continue;
        }
        ixs.push(ix);
    }

    if (ixs.length < 1) {
        path.arc(lCenter.x, lCenter.y, lRadius, 0, 2 * Math.PI);
        return path;
    }

    // If enough interesting edges have been found, cut the circle up.
    for (const ix of ixs) {
        const circleHitAngle = Math.atan2(ix[0].y - lCenter.y, ix[0].x - lCenter.x);
        if (lastAngle === null) {
            path.moveTo(ix[0].x, ix[0].y);
            firstAngle = Math.atan2(ix[0].y - lCenter.y, ix[0].x - lCenter.x);
        } else if (lastAngle !== circleHitAngle) {
            path.arc(lCenter.x, lCenter.y, lRadius, lastAngle, circleHitAngle);
        }
        lastAngle = Math.atan2(ix[1].y - lCenter.y, ix[1].x - lCenter.x);
        path.lineTo(ix[1].x, ix[1].y);
    }
    if (firstAngle && lastAngle) {
        if (firstAngle !== lastAngle) path.arc(lCenter.x, lCenter.y, lRadius, lastAngle, firstAngle);
    } else path.arc(lCenter.x, lCenter.y, lRadius, 0, 2 * Math.PI);

    return path;
}
