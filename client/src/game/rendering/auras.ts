import tinycolor from "tinycolor2";

import { g2l, g2lr, toRadians } from "../../core/conversions";
import type { IShape } from "../interfaces/shape";
import { LayerName } from "../models/floor";
import { auraSystem } from "../systems/auras";

export function drawAuras(shape: IShape, ctx: CanvasRenderingContext2D): void {
    const center = shape.center;
    const lCenter = g2l(center);

    for (const aura of auraSystem.getAll(shape.id)) {
        if (!aura.active) continue;
        if (!aura.visionSource && shape.layerName === LayerName.Lighting) continue;

        const value = aura.value > 0 && !isNaN(aura.value) ? aura.value : 0;
        const dim = aura.dim > 0 && !isNaN(aura.dim) ? aura.dim : 0;
        if (value === 0 && dim === 0) continue;
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

        const angleA = aura.angle === 360 ? 0 : shape.angle + toRadians(aura.direction - aura.angle / 2);
        const angleB = aura.angle === 360 ? Math.PI * 2 : shape.angle + toRadians(aura.direction + aura.angle / 2);

        // Set visibility polygon as clipping path
        if (aura.visionSource) {
            ctx.save();

            const polygon = shape.visionPolygon;

            ctx.clip(polygon);
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

        if (aura.visionSource) {
            ctx.restore();
        }
    }
}
