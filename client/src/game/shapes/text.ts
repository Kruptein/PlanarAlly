import { GlobalPoint } from "@/game/geom";
import { BoundingRect } from "@/game/shapes/boundingrect";
import { Shape } from "@/game/shapes/shape";
import { ServerText } from "../comm/types/shapes";
import { rotateAroundPoint } from "../utils";

export class Text extends Shape {
    type = "text";
    text: string;
    font: string;
    constructor(
        position: GlobalPoint,
        text: string,
        font: string,
        fillColour?: string,
        strokeColour?: string,
        uuid?: string,
    ) {
        super(position, fillColour, strokeColour, uuid);
        this.text = text;
        this.font = font;
    }
    asDict(): ServerText {
        return Object.assign(this.getBaseDict(), {
            text: this.text,
            font: this.font,
            angle: this.angle,
        });
    }
    get points(): number[][] {
        return [[...rotateAroundPoint(this.refPoint, this.center(), this.angle)]];
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(this.refPoint, 5, 5); // TODO: fix this bounding box
    }
    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.fillStyle = this.fillColour;
        ctx.textAlign = "center";

        for (const line of this.getLines(ctx)) {
            if (this.strokeColour) {
                ctx.strokeStyle = this.strokeColour;
                ctx.strokeText(line.text, line.x, line.y);
            }
            ctx.fillText(line.text, line.x, line.y);
        }
        // ctx.restore();
        super.drawPost(ctx);
    }
    contains(_point: GlobalPoint): boolean {
        return false; // TODO
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) return this.refPoint;
        this.refPoint = centerPoint;
    }

    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        if (super.visibleInCanvas(canvas)) return true;
        return this.getBoundingBox().visibleInCanvas(canvas);
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    snapToGrid(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    resizeToGrid(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    resize(resizePoint: number, _point: GlobalPoint): number {
        return resizePoint;
    }

    getMaxHeight(ctx: CanvasRenderingContext2D): number {
        const lines = this.getLines(ctx);
        const lineHeight = 30;
        return lineHeight * lines.length;
    }

    getMaxWidth(ctx: CanvasRenderingContext2D): number {
        const lines = this.getLines(ctx);
        const widths = lines.map(line => ctx.measureText(line.text).width);
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
