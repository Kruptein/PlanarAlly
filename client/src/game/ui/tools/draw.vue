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
            <color-picker class="option" :class="{ 'radius-right': !showBorderColour() }" :color.sync="fillColour" />
            <color-picker class="option" :color.sync="borderColour" v-show="showBorderColour()" />
        </div>
        <div v-show="shapeSelect === 'draw-polygon'" style="display:flex">
            <label for="polygon-close" style="flex:5">Closed polygon?</label>
            <input type="checkbox" id="polygon-close" style="flex:1;align-self:center;" v-model="closedPolygon" />
        </div>
        <div v-show="hasBrushSize()" style="display:flex">
            <label for="brush-size" style="flex:5">Brush size</label>
            <input type="input" id="brush-size" v-model="brushSize" style="flex:4;align-self:center;max-width:100px;" />
        </div>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";

import { Watch } from "vue-property-decorator";
import { mapGetters } from "vuex";

import ColorPicker from "@/core/components/colorpicker.vue";
import DefaultContext from "./defaultcontext.vue";
import Tool from "./tool.vue";
import Tools from "./tools.vue";

import { SyncMode, InvalidationMode } from "@/core/comm/types";
import { socket } from "@/game/api/socket";
import { GlobalPoint } from "@/game/geom";
import { Layer } from "@/game/layers/layer";
import { snapToPoint } from "@/game/layers/utils";
import { layerManager } from "@/game/layers/manager";
import { Circle } from "@/game/shapes/circle";
import { Line } from "@/game/shapes/line";
import { Polygon } from "@/game/shapes/polygon";
import { Rect } from "@/game/shapes/rect";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { getUnitDistance, l2g, g2lx, g2ly } from "@/game/units";
import { equalPoints, getLocalPointFromEvent } from "@/game/utils";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget, insertConstraint, getCDT } from "@/game/visibility/te/pa";

@Component({
    components: {
        "color-picker": ColorPicker,
    },
    computed: {
        ...mapGetters("game", ["selectedLayer"]),
    },
})
export default class DrawTool extends Tool {
    selectedLayer!: string;

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
    closedPolygon = false;
    activeTool = false;

    mounted(): void {
        window.addEventListener("keyup", this.onKeyUp);
    }

    destroyed(): void {
        window.removeEventListener("keyup", this.onKeyUp);
    }

    get helperSize(): number {
        if (this.hasBrushSize()) return this.brushSize / 2;
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

    onKeyUp(event: KeyboardEvent): void {
        if (event.defaultPrevented) return;
        if (event.key === "Escape" && this.active) {
            this.onDeselect();
            this.onSelect();
        }
        event.preventDefault();
    }

    hasBrushSize(): boolean {
        return ["paint-brush", "draw-polygon"].includes(this.shapeSelect);
    }

    showBorderColour(): boolean {
        if (this.shapeSelect === "paint-brush") return false;
        if (this.shapeSelect === "draw-polygon" && !this.closedPolygon) return false;
        return true;
    }

    @Watch("closedPolygon")
    onChangePolygonCloseBehaviour(closedPolygon: boolean): void {
        if (this.shape !== null && this.active) (<Polygon>this.shape).openPolygon = !closedPolygon;
    }

    @Watch("fillColour")
    onFillChange(): void {
        if (this.brushHelper) this.brushHelper.fillColour = this.fillColour;
    }

    @Watch("modeSelect")
    onModeUpdate(newValue: string, oldValue: string): void {
        this.onModeChange(newValue, oldValue);
    }

    @Watch("selectedLayer")
    onLayerChange(newValue: string, oldValue: string): void {
        if ((<Tools>this.$parent).currentTool === this.name) {
            this.onDeselect(oldValue);
            this.onSelect();
        }
    }

    setupBrush(): void {
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
    onModeChange(newValue: string, oldValue: string): void {
        if (this.brushHelper === null) return;

        const fowLayer = layerManager.getLayer(layerManager.floor!.name, "fow");
        const normalLayer = layerManager.getLayer(layerManager.floor!.name);
        if (fowLayer === undefined || normalLayer === undefined) return;

        this.setupBrush();

        if (newValue !== "normal" && oldValue === "normal") {
            normalLayer.removeShape(this.brushHelper, SyncMode.NO_SYNC);
            fowLayer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL, false);
        } else if (newValue === "normal" && oldValue !== "normal") {
            normalLayer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL, false);
            fowLayer.removeShape(this.brushHelper, SyncMode.NO_SYNC);
        }
    }
    getLayer(targetLayer?: string): Layer | undefined {
        if (this.modeSelect === "normal") return layerManager.getLayer(layerManager.floor!.name, targetLayer);
        return layerManager.getLayer(layerManager.floor!.name, "fow");
    }

    onDown(startPoint: GlobalPoint): void {
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        if (this.brushHelper === null) return;
        if (!this.active) {
            this.startPoint = startPoint;
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
                    this.shape = new Polygon(
                        this.startPoint.clone(),
                        [],
                        undefined,
                        this.fillColour,
                        this.brushSize,
                        true,
                    );
                    this.shape.fillColour = this.fillColour;
                    break;
                }
                case "draw-polygon": {
                    const fill = this.closedPolygon ? this.fillColour : undefined;
                    const stroke = this.closedPolygon ? this.borderColour : this.fillColour;
                    this.shape = new Polygon(
                        this.startPoint.clone(),
                        [],
                        fill,
                        stroke,
                        this.brushSize,
                        !this.closedPolygon,
                    );
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
                this.shape.movementObstruction = true;
            }
            layer.addShape(this.shape, SyncMode.FULL_SYNC, InvalidationMode.NO);

            // Push brushhelper to back
            this.pushBrushBack();
        } else if (this.shape !== null && this.shapeSelect === "draw-polygon" && this.shape instanceof Polygon) {
            // For polygon draw
            this.shape._vertices.push(this.brushHelper.refPoint);
            this.shape.updatePoints();
        }
        if (this.shape !== null && this.shapeSelect === "draw-polygon" && this.shape instanceof Polygon) {
            const lastPoint = this.brushHelper.refPoint;
            if (this.ruler === null) {
                this.ruler = new Line(lastPoint, lastPoint, this.brushSize, this.fillColour);
                layer.addShape(this.ruler, SyncMode.NO_SYNC, InvalidationMode.NORMAL, false);
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
            if (this.shape.movementObstruction && this.shape.points.length > 1)
                insertConstraint(
                    TriangulationTarget.MOVEMENT,
                    this.shape,
                    this.shape.points[this.shape.points.length - 2],
                    this.shape.points[this.shape.points.length - 1],
                );
            layer.invalidate(false);
            socket.emit("Shape.Update", { shape: this.shape!.asDict(), redraw: true, temporary: true });
        }
    }

    onMove(endPoint: GlobalPoint): void {
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
                const newR = Math.abs(endPoint.subtract(this.startPoint).length());
                if (circ.r === newR) return;
                circ.r = newR;
                break;
            }
            case "paint-brush": {
                const br = <Polygon>this.shape;
                if (equalPoints(br.points[br.points.length - 1], [endPoint.x, endPoint.y])) return;
                br._vertices.push(endPoint);
                break;
            }
            case "draw-polygon": {
                this.ruler!.endPoint = endPoint;
                break;
            }
        }

        if (!(this.shapeSelect === "draw-polygon" && this.shape instanceof Polygon)) {
            socket.emit("Shape.Update", { shape: this.shape!.asDict(), redraw: true, temporary: true });
            if (this.shape.visionObstruction) {
                if (
                    getCDT(TriangulationTarget.VISION, this.shape.floor).tds.getTriagVertices(this.shape.uuid).length >
                    1
                )
                    visibilityStore.deleteFromTriag({
                        target: TriangulationTarget.VISION,
                        shape: this.shape,
                    });
                visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: this.shape });
                visibilityStore.recalculateVision(this.shape.floor);
            }
        }
        layer.invalidate(false);
    }

    onUp(event: MouseEvent | TouchEvent): void {
        if (
            !this.active ||
            this.shape === null ||
            (this.shape instanceof Polygon && this.shapeSelect === "draw-polygon")
        ) {
            return;
        }
        // TODO: handle touch event different than altKey, long press
        if (!event.altKey && this.useGrid) {
            if (this.shape.visionObstruction)
                visibilityStore.deleteFromTriag({
                    target: TriangulationTarget.VISION,
                    shape: this.shape,
                });
            this.shape.resizeToGrid();
            if (this.shape.visionObstruction) {
                visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: this.shape });
                visibilityStore.recalculateVision(this.shape.floor);
            }
            if (this.shape.movementObstruction) {
                visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: this.shape });
                visibilityStore.recalculateMovement(this.shape.floor);
            }
        }
        this.finaliseShape();
    }

    onMouseDown(_event: MouseEvent): void {
        if (this.brushHelper === null) return;
        const startPoint = this.brushHelper.refPoint;
        this.onDown(startPoint);
    }

    onMouseMove(event: MouseEvent): void {
        const endPoint = snapToPoint(this.getLayer()!, l2g(getLocalPointFromEvent(event)), this.ruler?.refPoint);
        this.onMove(endPoint);
    }

    onMouseUp(event: MouseEvent): void {
        this.onUp(event);
    }

    onTouchStart(event: TouchEvent): void {
        const startPoint = snapToPoint(this.getLayer()!, l2g(getLocalPointFromEvent(event)), this.ruler?.refPoint);
        this.onDown(startPoint);
    }

    onTouchMove(event: TouchEvent): void {
        const endPoint = snapToPoint(this.getLayer()!, l2g(getLocalPointFromEvent(event)), this.ruler?.refPoint);
        this.onMove(endPoint);
    }

    onTouchEnd(event: TouchEvent): void {
        this.onUp(event);
    }

    onContextMenu(event: MouseEvent): void {
        if (
            this.active &&
            this.shape !== null &&
            this.shapeSelect === "draw-polygon" &&
            this.shape instanceof Polygon
        ) {
            const layer = this.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }
            layer.removeShape(this.ruler!, SyncMode.NO_SYNC);
            this.ruler = null;
            if (this.closedPolygon) {
                if (this.shape.visionObstruction && this.shape.points.length > 1)
                    insertConstraint(
                        TriangulationTarget.VISION,
                        this.shape,
                        this.shape.points[0],
                        this.shape.points[this.shape.points.length - 1],
                    );
                if (this.shape.movementObstruction && this.shape.points.length > 1)
                    insertConstraint(
                        TriangulationTarget.MOVEMENT,
                        this.shape,
                        this.shape.points[0],
                        this.shape.points[this.shape.points.length - 1],
                    );
            }
            this.finaliseShape();
        } else if (!this.active) {
            (<DefaultContext>this.$parent.$refs.defaultcontext).open(event);
        }
    }

    private finaliseShape(): void {
        if (this.shape === null) return;
        this.shape.updatePoints();
        if (this.shape.points.length <= 1) {
            this.onDeselect();
            this.onSelect();
        } else {
            if (this.shape.visionObstruction) visibilityStore.recalculateVision(this.shape.floor);
            if (this.shape.movementObstruction) visibilityStore.recalculateMovement(this.shape.floor);
            socket.emit("Shape.Update", { shape: this.shape!.asDict(), redraw: true, temporary: false });
        }
        this.active = false;
        const layer = this.getLayer();
        if (layer !== undefined) {
            layer.invalidate(false);
        }
    }

    onSelect(): void {
        this.activeTool = true;
        const layer = this.getLayer();
        if (layer === undefined) return;
        layer.canvas.parentElement!.style.cursor = "none";
        this.brushHelper = new Circle(new GlobalPoint(-1000, -1000), this.brushSize / 2, this.fillColour);
        this.setupBrush();
        layer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL, false); // during mode change the shape is already added
        if (gameStore.IS_DM) this.showLayerPoints();
    }
    onDeselect(targetLayer?: string): void {
        this.activeTool = false;
        const layer = this.getLayer(targetLayer);
        if (layer === undefined) return;
        if (this.brushHelper !== null) {
            layer.removeShape(this.brushHelper, SyncMode.NO_SYNC);
            this.brushHelper = null;
        }
        if (this.ruler !== null) {
            layer.removeShape(this.ruler, SyncMode.NO_SYNC);
            this.ruler = null;
        }
        if (this.active && this.shape !== null) {
            layer.removeShape(this.shape, SyncMode.FULL_SYNC);
            this.shape = null;
            this.active = false;
            layer.invalidate(false);
        }
        layer.canvas.parentElement!.style.removeProperty("cursor");
        this.hideLayerPoints();
    }

    private pushBrushBack(): void {
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        const refPoint = this.brushHelper?.refPoint;
        const bs = this.brushHelper?.r;
        if (this.brushHelper !== null) layer.removeShape(this.brushHelper, SyncMode.NO_SYNC);
        this.brushHelper = new Circle(new GlobalPoint(-1000, -1000), bs ?? this.brushSize / 2, this.fillColour);
        this.setupBrush();
        layer.addShape(this.brushHelper, SyncMode.NO_SYNC, InvalidationMode.NORMAL, false); // during mode change the shape is already added
        if (refPoint) this.brushHelper.refPoint = refPoint;
    }

    private async showLayerPoints(): Promise<void> {
        const layer = this.getLayer()!;
        await layer.waitValid();
        if (!this.activeTool) return;
        const dL = layerManager.getLayer(layerManager.floor!.name, "draw")!;
        for (const point of layer.points.keys()) {
            const parsedPoint = JSON.parse(point);
            dL.ctx.beginPath();
            dL.ctx.arc(g2lx(parsedPoint[0]), g2ly(parsedPoint[1]), 5, 0, 2 * Math.PI);
            dL.ctx.fill();
        }
    }

    private hideLayerPoints(): void {
        console.log("Clearing");
        layerManager.getLayer(layerManager.floor!.name, "draw")?.invalidate(true);
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
.selectgroup > .option:last-of-type,
.radius-right {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}
</style>
