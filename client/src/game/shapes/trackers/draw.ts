import tinycolor from "tinycolor2";

import { TriangulationTarget } from "@/game/visibility/te/pa";
import { computeVisibility } from "@/game/visibility/te/te";

import { g2l, g2lr, g2lx, g2ly, toRadians } from "../../units";
import { Shape } from "../shape";

export function drawAuras(shape: Shape, ctx: CanvasRenderingContext2D): void {
    const center = shape.center();
    const lCenter = g2l(center);

    for (const aura of shape.getAuras(true)) {
        if (!aura.active) continue;

        const value = aura.value > 0 && !isNaN(aura.value) ? aura.value : 0;
        const dim = aura.dim > 0 && !isNaN(aura.dim) ? aura.dim : 0;
        if (value === 0 && dim === 0) return;
        ctx.beginPath();

        const innerRange = g2lr(value + dim);

        ctx.strokeStyle = aura.borderColour;
        ctx.lineWidth = 5;

        if (dim === 0) ctx.fillStyle = aura.colour;
        else {
            const gradient = ctx.createRadialGradient(
                lCenter.x,
                lCenter.y,
                g2lr(value),
                lCenter.x,
                lCenter.y,
                innerRange,
            );
            const tc = tinycolor(aura.colour);
            ctx.fillStyle = gradient;
            gradient.addColorStop(0, aura.colour);
            gradient.addColorStop(1, tc.setAlpha(0).toRgbString());
        }

        const angleA = aura.angle === 360 ? 0 : toRadians(aura.direction - aura.angle / 2);
        const angleB = aura.angle === 360 ? Math.PI * 2 : toRadians(aura.direction + aura.angle / 2);

        // Set visibility polygon as clipping path
        if (aura.visionSource) {
            ctx.save();

            const polygon = computeVisibility(center, TriangulationTarget.VISION, shape.floor.id);

            ctx.beginPath();
            ctx.moveTo(g2lx(polygon[0][0]), g2ly(polygon[0][1]));
            for (const point of polygon) ctx.lineTo(g2lx(point[0]), g2ly(point[1]));
            ctx.clip();
        }

        // Draw aura

        ctx.beginPath();

        if (aura.angle < 360) {
            ctx.moveTo(lCenter.x, lCenter.y);
            ctx.lineTo(lCenter.x + innerRange * Math.cos(angleA), lCenter.y + innerRange * Math.sin(angleA));
        }
        ctx.arc(lCenter.x, lCenter.y, innerRange, angleA, angleB);
        if (aura.angle < 360) {
            ctx.lineTo(lCenter.x, lCenter.y);
        }
        ctx.fill();
        ctx.stroke();

        if (aura.visionSource) ctx.restore();
    }
}
