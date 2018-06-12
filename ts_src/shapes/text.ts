import Shape from "./shape";
import BoundingRect from "./boundingrect";
import { GlobalPoint } from "../geom";
import { g2l } from "../units";

export default class Text extends Shape {
    type = "text";
    text: string;
    font: string;
    angle: number;
    constructor(position: GlobalPoint, text: string, font: string, angle?: number, uuid?: string) {
        super(position, uuid);
        this.text = text;
        this.font = font;
        this.angle = angle || 0;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            text: this.text,
            font: this.font,
            angle: this.angle
        })
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(this.refPoint, 5, 5); // TODO: fix this bounding box
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.save();
        const dest = g2l(this.refPoint);
        ctx.translate(dest.x, dest.y);
        ctx.rotate(this.angle);
        ctx.textAlign = "center";
        this.getLines(ctx).map((line) => ctx.fillText(line.text, line.x, line.y));
        ctx.restore();
    }
    contains(point: GlobalPoint): boolean {
        return false; // TODO
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void { } // TODO
    getCorner(point: GlobalPoint): string | undefined { return "" }; // TODO
    visibleInCanvas(canvas: HTMLCanvasElement): boolean { return true; } // TODO

    getMaxHeight(ctx: CanvasRenderingContext2D) {
        const lines = this.getLines(ctx);
        const lineHeight = 30;
        return lineHeight * lines.length;
    }

    getMaxWidth(ctx: CanvasRenderingContext2D) {
        const lines = this.getLines(ctx);
        const widths = lines.map((line) => ctx.measureText(line.text).width);
        return Math.max(...widths);
    }

    private getLines(ctx: CanvasRenderingContext2D) {
        const lines = this.text.split("\n");
        const allLines: {text: string, x: number, y: number}[] = [];
        const maxWidth = ctx.canvas.width;
        const lineHeight = 30;
        const x = 0; //this.refPoint.x;
        let y = 0; //this.refPoint.y;

        for (let n = 0; n < lines.length; n++) {
            let line = '';
            const words = lines[n].split(" ");
            for (let w = 0; w < words.length; w++) {
                const testLine = line + words[w] + " ";
                var metrics = ctx.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > maxWidth) {
                    ctx.fillText(line, x, y);
                    allLines.push({text: line, x: x, y: y});
                    line = words[w] + " ";
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            allLines.push({text: line, x: x, y: y});
            y += lineHeight;
        }
        return allLines;
    }
}