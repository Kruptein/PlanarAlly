import Shape from "./shape";
import BoundingRect from "./boundingrect";
import { g2l } from "../units";
export default class Text extends Shape {
    constructor(position, text, font, angle, fill, uuid) {
        super(position, uuid);
        this.type = "text";
        this.text = text;
        this.font = font;
        this.fill = fill || "#000";
        this.angle = angle || 0;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            text: this.text,
            font: this.font,
            angle: this.angle,
        });
    }
    getBoundingBox() {
        return new BoundingRect(this.refPoint, 5, 5); // TODO: fix this bounding box
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.fillStyle = this.fill;
        ctx.save();
        const dest = g2l(this.refPoint);
        ctx.translate(dest.x, dest.y);
        ctx.rotate(this.angle);
        ctx.textAlign = "center";
        this.getLines(ctx).map((line) => ctx.fillText(line.text, line.x, line.y));
        ctx.restore();
    }
    contains(point) {
        return false; // TODO
    }
    center(centerPoint) { } // TODO
    getCorner(point) { return ""; }
    ; // TODO
    visibleInCanvas(canvas) { return true; } // TODO
    getMaxHeight(ctx) {
        const lines = this.getLines(ctx);
        const lineHeight = 30;
        return lineHeight * lines.length;
    }
    getMaxWidth(ctx) {
        const lines = this.getLines(ctx);
        const widths = lines.map((line) => ctx.measureText(line.text).width);
        return Math.max(...widths);
    }
    getLines(ctx) {
        const lines = this.text.split("\n");
        const allLines = [];
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
                    allLines.push({ text: line, x: x, y: y });
                    line = words[w] + " ";
                    y += lineHeight;
                }
                else {
                    line = testLine;
                }
            }
            allLines.push({ text: line, x: x, y: y });
            y += lineHeight;
        }
        return allLines;
    }
}
//# sourceMappingURL=text.js.map