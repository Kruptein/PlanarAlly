import { GlobalPoint, Vector } from "@/game/geom";
import { Shape } from "@/game/shapes/shape";
import { BoundingRect } from "@/game/shapes/variants/boundingrect";

import { ServerText } from "../../models/shapes";
import { g2lz, l2gz } from "../../units";
import { rotateAroundPoint } from "../../utils";
import { SHAPE_TYPE } from "../types";

export class Text extends Shape {
    type: SHAPE_TYPE = "text";

    private width = 5;
    private height = 5;

    constructor(
        position: GlobalPoint,
        public text: string,
        public fontSize: number,
        options?: {
            fillColour?: string;
            strokeColour?: string;
            uuid?: string;
        },
    ) {
        super(position, options);
    }

    asDict(): ServerText {
        return Object.assign(this.getBaseDict(), {
            text: this.text,
            font_size: this.fontSize,
            angle: this.angle,
        });
    }

    get points(): number[][] {
        return this.getBoundingBox().points;
    }

    getBoundingBox(): BoundingRect {
        const bbox = new BoundingRect(
            this.refPoint.add(new Vector(-this.width / 2, -this.height / 2)),
            this.width,
            this.height,
        ); // TODO: fix this bounding box
        bbox.angle = this.angle;
        return bbox;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);

        const size = this.ignoreZoomSize ? this.fontSize : g2lz(this.fontSize);

        ctx.font = `${size}px serif`;
        ctx.fillStyle = this.fillColour;
        ctx.textAlign = "center";

        this.width = 0;
        this.height = 0;

        for (const line of this.getLines(ctx)) {
            const textInfo = ctx.measureText(line.text);
            if (textInfo.width > this.width) this.width = textInfo.width;
            this.height += textInfo.actualBoundingBoxAscent + textInfo.actualBoundingBoxDescent;

            if (this.strokeColour !== "rgba(0,0,0,0)") {
                ctx.strokeStyle = this.strokeColour;
                ctx.strokeText(line.text, line.x, line.y);
            }
            ctx.fillText(line.text, line.x, line.y);
        }

        if (this.width === 0) this.width = 5;
        else this.width = l2gz(this.width);
        if (this.height === 0) this.height = 5;
        else this.height = l2gz(this.height);

        super.drawPost(ctx);
    }

    contains(point: GlobalPoint): boolean {
        return this.getBoundingBox().contains(point);
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) return this.refPoint;
        this.refPoint = centerPoint;
    }

    visibleInCanvas(canvas: HTMLCanvasElement, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(canvas, options)) return true;
        return this.getBoundingBox().visibleInCanvas(canvas);
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    snapToGrid(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    resizeToGrid(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    resize(resizePoint: number, point: GlobalPoint): number {
        point = rotateAroundPoint(point, this.center(), -this.angle);

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

        const vec = Vector.fromPoints(
            GlobalPoint.fromArray(this.points[oppositeNRP]),
            GlobalPoint.fromArray(oldPoints[oppositeNRP]),
        );
        this.refPoint = this.refPoint.add(vec);

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
        const maxWidth = ctx.canvas.width;
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
}
