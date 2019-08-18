<template>
    <div class="tool-detail" v-if="selected" :style="{ '--detailRight': detailRight, '--detailArrow': detailArrow }">
        <div v-show="IS_DM">Mode</div>
        <div v-show="IS_DM" class="selectgroup">
            <div
                v-for="mode in modes"
                :key="mode"
                class="option"
                :class="{ 'option-selected': modeSelect === mode }"
                @click="modeSelect = mode"
            >
                {{ mode }}
            </div>
        </div>
        <div>Shape</div>
        <div class="selectgroup">
            <div
                v-for="shape in shapes"
                :key="shape"
                class="option"
                :class="{ 'option-selected': shapeSelect === shape }"
                @click="shapeSelect = shape"
            >
                <i class="fas" :class="'fa-' + shape"></i>
            </div>
        </div>
        <div>Colours</div>
        <div class="selectgroup">
            <color-picker class="option" :color.sync="fillColour" />
            <color-picker class="option" :color.sync="borderColour" />
        </div>
        <div v-show="shapeSelect === 'paint-brush'">Brush size</div>
        <input type="text" v-model="brushSize" v-show="shapeSelect === 'paint-brush'" style="max-width:100px;" />
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";

import { Watch } from "vue-property-decorator";

import ColorPicker from "@/core/components/colorpicker.vue";
import Tool from "@/game/ui/tools/tool.vue";

import { socket } from "@/game/api/socket";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Circle } from "@/game/shapes/circle";
import { Line } from "@/game/shapes/line";
import { MultiLine } from "@/game/shapes/multiline";
import { Polygon } from "@/game/shapes/polygon";
import { Rect } from "@/game/shapes/rect";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { getUnitDistance, l2g } from "@/game/units";
import { equalPoints, getMouse } from "@/game/utils";
import { TriangulationTarget, insertConstraint } from "@/game/visibility/te/pa";
import { visibilityStore } from "../../visibility/store";

@Component({
    components: {
        "color-picker": ColorPicker,
    },
})
export default class DrawTool extends Tool {
    name = "Draw";
    active = false;

    startPoint: GlobalPoint | null = null;
    shape: Shape | null = null;
    brushHelper: Circle | null = null;
    ruler: Line | null = null;

    fillColour = "rgba(0, 0, 0, 1)";
    borderColour = "rgba(255, 255, 255, 0)";

    shapeSelect = "square";
    shapes = ["square", "circle", "draw-polygon", "paint-brush"];
    modeSelect = "normal";
    modes = ["normal", "reveal", "hide"];

    brushSize = getUnitDistance(gameStore.unitSize);

    get helperSize(): number {
        if (this.shapeSelect === "paint-brush") return this.brushSize / 2;
        return getUnitDistance(this.unitSize) / 8;
    }
    get IS_DM(): boolean {
        return gameStore.IS_DM;
    }
    get unitSize(): number {
        return gameStore.unitSize;
    }
    get useGrid(): boolean {
        return gameStore.useGrid;
    }

    @Watch("fillColour")
    onFillChange() {
        if (this.brushHelper) this.brushHelper.fillColour = this.fillColour;
    }

    @Watch("modeSelect")
    onModeUpdate(newValue: string, oldValue: string) {
        this.onModeChange(newValue, oldValue);
    }

    setupBrush() {
        if (this.brushHelper === null) return;
        if (this.modeSelect === "reveal" || this.modeSelect === "hide") {
            this.brushHelper.options.set("preFogShape", true);
            this.brushHelper.options.set("skipDraw", true);
            this.brushHelper.fillColour = "rgba(0, 0, 0, 1)";

            if (this.modeSelect === "reveal") this.brushHelper.globalCompositeOperation = "source-over";
            else if (this.modeSelect === "hide") this.brushHelper.globalCompositeOperation = "destination-out";
        } else {
            this.brushHelper.options.delete("preFogShape");
            this.brushHelper.options.delete("skipDraw");
            this.brushHelper.globalCompositeOperation = "source-over";
            this.brushHelper.fillColour = this.fillColour;
        }
    }
    onModeChange(newValue: string, oldValue: string) {
        if (this.brushHelper === null) return;

        const fowLayer = layerManager.getLayer("fow");
        const normalLayer = layerManager.getLayer();
        if (fowLayer === undefined || normalLayer === undefined) return;

        this.setupBrush();

        if (newValue !== "normal" && oldValue === "normal") {
            normalLayer.removeShape(this.brushHelper, false);
            fowLayer.addShape(this.brushHelper, false);
        } else if (newValue === "normal" && oldValue !== "normal") {
            normalLayer.addShape(this.brushHelper, false);
            fowLayer.removeShape(this.brushHelper, false);
        }
    }
    getLayer() {
        if (this.modeSelect === "normal") return layerManager.getLayer();
        return layerManager.getLayer("fow");
    }
    onMouseDown(event: MouseEvent) {
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        if (!this.active) {
            this.startPoint = l2g(getMouse(event));
            this.active = true;
            switch (this.shapeSelect) {
                case "square": {
                    this.shape = new Rect(this.startPoint.clone(), 0, 0, this.fillColour, this.borderColour);
                    break;
                }
                case "circle": {
                    this.shape = new Circle(
                        this.startPoint.clone(),
                        this.helperSize,
                        this.fillColour,
                        this.borderColour,
                    );
                    break;
                }
                case "paint-brush": {
                    this.shape = new MultiLine(this.startPoint.clone(), [], this.brushSize);
                    this.shape.fillColour = this.fillColour;
                    break;
                }
                case "draw-polygon": {
                    this.shape = new Polygon(this.startPoint.clone(), [], this.fillColour, this.borderColour);
                    break;
                }
                default:
                    return;
            }

            if (this.modeSelect !== "normal") {
                this.shape.options.set("preFogShape", true);
                this.shape.options.set("skipDraw", true);
                this.shape.fillColour = "rgba(0, 0, 0, 1)";
            }
            if (this.modeSelect === "reveal") this.shape.globalCompositeOperation = "source-over";
            else if (this.modeSelect === "hide") this.shape.globalCompositeOperation = "destination-out";

            this.shape.addOwner(gameStore.username);
            if (layer.name === "fow" && this.modeSelect === "normal") {
                this.shape.visionObstruction = true;
                // this.shape.movementObstruction = true;
            }
            layer.addShape(this.shape, true, false, false);

            // Push brushhelper to back
            this.pushBrushBack();
        } else if (this.shape !== null && this.shape instanceof Polygon) {
            // For polygon draw
            this.shape._vertices.push(l2g(getMouse(event)));
        }
        if (this.shape !== null && this.shape instanceof Polygon) {
            const lastPoint = l2g(getMouse(event));
            if (this.ruler === null) {
                this.ruler = new Line(lastPoint, lastPoint, 3, "black");
                layer.addShape(this.ruler, false);
            } else {
                this.ruler.refPoint = lastPoint;
                this.ruler.endPoint = lastPoint;
            }
            if (this.shape.visionObstruction && this.shape.points.length > 1)
                insertConstraint(
                    TriangulationTarget.VISION,
                    this.shape,
                    this.shape.points[this.shape.points.length - 2],
                    this.shape.points[this.shape.points.length - 1],
                );
            layer.invalidate(false);
            socket.emit("Shape.Update", { shape: this.shape!.asDict(), redraw: true, temporary: true });
        }
    }
    onMouseMove(event: MouseEvent) {
        const endPoint = l2g(getMouse(event));
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        if (this.brushHelper !== null) {
            this.brushHelper.r = this.helperSize;
            this.brushHelper.refPoint = endPoint;
            if (!this.active) layer.invalidate(false);
        }

        if (!this.active || this.startPoint === null || this.shape === null) return;

        switch (this.shapeSelect) {
            case "square": {
                const rect = <Rect>this.shape;
                const newW = Math.abs(endPoint.x - this.startPoint.x);
                const newH = Math.abs(endPoint.y - this.startPoint.y);
                if (newW === rect.w && newH === rect.h) return;
                rect.w = newW;
                rect.h = newH;
                if (endPoint.x < this.startPoint.x || endPoint.y < this.startPoint.y) {
                    this.shape.refPoint = new GlobalPoint(
                        Math.min(this.startPoint.x, endPoint.x),
                        Math.min(this.startPoint.y, endPoint.y),
                    );
                }
                break;
            }
            case "circle": {
                const circ = <Circle>this.shape;
                const newR = endPoint.subtract(this.startPoint).length();
                if (circ.r === newR) return;
                circ.r = newR;
                break;
            }
            case "paint-brush": {
                const br = <MultiLine>this.shape;
                if (equalPoints(br.points[br.points.length - 1], [endPoint.x, endPoint.y])) return;
                br._points.push(endPoint);
                break;
            }
            case "draw-polygon": {
                this.ruler!.endPoint = endPoint;
                break;
            }
        }

        if (!(this.shape instanceof Polygon)) {
            socket.emit("Shape.Update", { shape: this.shape!.asDict(), redraw: true, temporary: true });
            if (this.shape.visionObstruction) {
                if (this.shape.triagVertices.length > 1)
                    visibilityStore.deleteFromTriag({
                        target: TriangulationTarget.VISION,
                        shape: this.shape,
                        standalone: false,
                    });
                visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: this.shape });
            }
        }
        layer.invalidate(false);
    }
    onMouseUp(event: MouseEvent) {
        if (!this.active || this.shape === null || this.shape instanceof Polygon) return;
        if (!event.altKey && this.useGrid) {
            if (this.shape.visionObstruction)
                visibilityStore.deleteFromTriag({
                    target: TriangulationTarget.VISION,
                    shape: this.shape,
                    standalone: false,
                });
            this.shape.resizeToGrid();
            if (this.shape.visionObstruction)
                visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: this.shape });
        }
        this.finaliseShape();
    }
    onContextMenu(_event: MouseEvent) {
        if (!this.active || this.shape === null || !(this.shape instanceof Polygon)) return;
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        layer.removeShape(this.ruler!, false);
        this.ruler = null;
        this.finaliseShape();
    }

    private finaliseShape() {
        if (this.shape === null) return;
        // if (this.shape.visionObstruction) visibilityStore.recalculateVision();
        // if (this.shape.movementObstruction) visibilityStore.recalculateMovement();
        socket.emit("Shape.Update", { shape: this.shape!.asDict(), redraw: true, temporary: false });
        this.active = false;
    }

    onSelect() {
        const layer = this.getLayer();
        if (layer === undefined) return;
        this.brushHelper = new Circle(new GlobalPoint(-1000, -1000), this.brushSize / 2, this.fillColour);
        this.setupBrush();
        layer.addShape(this.brushHelper, false); // during mode change the shape is already added
    }
    onDeselect() {
        const layer = this.getLayer();
        if (this.brushHelper !== null && layer !== undefined) layer.removeShape(this.brushHelper, false);
        if (this.active && layer !== undefined && this.shape !== null) {
            layer.removeShape(this.shape, true, false);
            this.shape = null;
            this.active = false;
            layer.invalidate(false);
        }
    }

    private pushBrushBack() {
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        if (this.brushHelper !== null) layer.removeShape(this.brushHelper, false);
        this.brushHelper = new Circle(new GlobalPoint(-1000, -1000), this.brushSize / 2, this.fillColour);
        this.setupBrush();
        layer.addShape(this.brushHelper, false); // during mode change the shape is already added
    }
}
</script>

<style scoped>
.option {
    padding: 6px;
    border: solid 1px #82c8a0;
    border-radius: 0;
    flex: 1 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 13px;
    min-width: 25px;
}
.option-selected,
.option:hover {
    background-color: #82c8a0;
}
.selectgroup {
    display: flex;
}
.selectgroup > .option:first-of-type {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
}
.selectgroup > .option:last-of-type {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}
</style>
