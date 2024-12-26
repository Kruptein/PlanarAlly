import { exportShapeData } from "..";
import type { ApiTextShape } from "../../../apiTypes";
import { g2lz, l2gz } from "../../../core/conversions";
import { addP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { rotateAroundPoint } from "../../../core/math";
import { SyncMode } from "../../../core/models/types";
import { sendTextUpdate } from "../../api/emits/shape/text";
import { getGlobalId } from "../../id";
import type { IText } from "../../interfaces/shapes/text";
import { getProperties } from "../../systems/properties/state";
import type { ShapeProperties } from "../../systems/properties/state";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./simple/boundingRect";

export class Text extends Shape implements IText {
    type: SHAPE_TYPE = "text";

    private width = 5;
    private height = 5;

    constructor(
        position: GlobalPoint,
        public text: string,
        public fontSize: number,
        options?: {
            id?: LocalId;
            uuid?: GlobalId;
            isSnappable?: boolean;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        super(position, options, properties);
        this._center = this.__center();
    }

    readonly isClosed = true;

    asDict(): ApiTextShape {
        return { ...exportShapeData(this), text: this.text, font_size: this.fontSize, angle: this.angle };
    }

    updatePoints(): void {
        this._points = this.getBoundingBox().points;
    }

    getBoundingBox(): BoundingRect {
        const bbox = new BoundingRect(
            addP(this.refPoint, new Vector(-this.width / 2, -this.height / 2)),
            this.width,
            this.height,
        ); // TODO: fix this bounding box
        bbox.angle = this.angle;
        return bbox;
    }

    draw(ctx: CanvasRenderingContext2D, lightRevealRender: boolean): void {
        if (lightRevealRender) return;

        super.draw(ctx, lightRevealRender);

        const size = this.ignoreZoomSize ? this.fontSize : g2lz(this.fontSize);
        const props = getProperties(this.id)!;

        ctx.font = `${size}px serif`;
        ctx.fillStyle = props.fillColour;
        ctx.textAlign = "center";

        this.width = 0;
        this.height = 0;

        for (const line of this.getLines(ctx)) {
            const textInfo = ctx.measureText(line.text);
            if (textInfo.width > this.width) this.width = textInfo.width;
            this.height += textInfo.actualBoundingBoxAscent + textInfo.actualBoundingBoxDescent;

            if (props.strokeColour[0] !== "rgba(0,0,0,0)") {
                ctx.strokeStyle = props.strokeColour[0]!;
                ctx.strokeText(line.text, line.x, line.y);
            }
            ctx.fillText(line.text, line.x, line.y);
        }

        if (this.width === 0) this.width = 5;
        else this.width = l2gz(this.width);
        if (this.height === 0) this.height = 5;
        else this.height = l2gz(this.height);

        super.drawPost(ctx, lightRevealRender);
    }

    contains(point: GlobalPoint): boolean {
        return this.getBoundingBox().contains(point);
    }

    __center(): GlobalPoint {
        return this._refPoint;
    }

    get center(): GlobalPoint {
        return this._center;
    }

    set center(centerPoint: GlobalPoint) {
        this.refPoint = centerPoint;
    }

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(max, options)) return true;
        return this.getBoundingBox().visibleInCanvas(max);
    }

    resize(resizePoint: number, point: GlobalPoint): number {
        point = rotateAroundPoint(point, this.center, -this.angle);

        const oldPoints = this.points;

        let newWidth;

        switch (resizePoint) {
            case 0:
            case 1: {
                newWidth = this.refPoint.x + this.width / 2 - point.x;
                break;
            }
            case 2:
            case 3: {
                newWidth = point.x - (this.refPoint.x - this.width / 2);
                break;
            }
            default:
                newWidth = this.width;
        }

        this.fontSize *= newWidth / this.width;

        const newResizePoint = (resizePoint + 4) % 4;
        const oppositeNRP = (newResizePoint + 2) % 4;

        const vec = Vector.fromPoints(toGP(this.points[oppositeNRP]!), toGP(oldPoints[oppositeNRP]!));
        this.refPoint = addP(this.refPoint, vec);

        return newResizePoint;
    }

    getMaxHeight(ctx: CanvasRenderingContext2D): number {
        const lines = this.getLines(ctx);
        const lineHeight = 30;
        return lineHeight * lines.length;
    }

    getMaxWidth(ctx: CanvasRenderingContext2D): number {
        const lines = this.getLines(ctx);
        const widths = lines.map((line) => ctx.measureText(line.text).width);
        return Math.max(...widths);
    }

    private getLines(ctx: CanvasRenderingContext2D): { text: string; x: number; y: number }[] {
        const lines = this.text.split("\n");
        const allLines: { text: string; x: number; y: number }[] = [];
        const maxWidth = this.layer?.width ?? 0;
        const lineHeight = 30;
        const x = 0; // this.refPoint.x;
        let y = 0; // this.refPoint.y;

        for (const line of lines) {
            let targetLine = "";
            const words = line.split(" ");
            for (const word of words) {
                const testLine = targetLine + word + " ";
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth) {
                    ctx.fillText(targetLine, x, y);
                    allLines.push({ text: targetLine, x, y });
                    targetLine = word + " ";
                    y += lineHeight;
                } else {
                    targetLine = testLine;
                }
            }
            allLines.push({ text: targetLine, x, y });
            y += lineHeight;
        }
        return allLines;
    }

    setText(text: string, sync: SyncMode): void {
        this.text = text;
        const uuid = getGlobalId(this.id);
        if (uuid && sync !== SyncMode.NO_SYNC) {
            sendTextUpdate({ uuid, text, temporary: sync === SyncMode.TEMP_SYNC });
        }
    }
}
