<template>
</template>

<script lang="ts">
import Tool from "./tool.vue";

import { GlobalPoint } from "../geom";
import gameManager from "../planarally";
import { l2g } from "../units";
import { getMouse } from "../utils";
import Line from "../shapes/line";
import Text from "../shapes/text";
import Settings from "../settings";
import { socket } from "../socket";

export default Tool.extend({
    data() {
        return {
            name: "ruler",
            active: false,
            startPoint: <GlobalPoint|null> null,
            ruler: <Line|null> null,
            text: <Text|null> null,
        }
    },
    methods: {
        onMouseDown(event: MouseEvent) {
            const layer = gameManager.layerManager.getLayer("draw");
            if (layer === undefined) {
                console.log("No draw layer!");
                return;
            }
            this.active = true;
            this.startPoint = l2g(getMouse(event));
            this.ruler = new Line(this.startPoint, this.startPoint, 3);
            this.text = new Text(this.startPoint.clone(), "", "bold 20px serif");
            this.ruler.owners.push(Settings.username);
            this.text.owners.push(Settings.username);
            layer.addShape(this.ruler, true, true);
            layer.addShape(this.text, true, true);
        },
        onMouseMove(event: MouseEvent) {
            if (!this.active || this.ruler === null || this.startPoint === null || this.text === null) return;
            
            const layer = gameManager.layerManager.getLayer("draw");
            if (layer === undefined) {
                console.log("No draw layer!");
                return;
            }
            const endPoint = l2g(getMouse(event));

            this.ruler.endPoint = endPoint;
            socket.emit("shapeMove", { shape: this.ruler!.asDict(), temporary: true });

            const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
            const xdiff = Math.abs(endPoint.x - this.startPoint.x);
            const ydiff = Math.abs(endPoint.y - this.startPoint.y);
            const label = Math.round(Math.sqrt((xdiff) ** 2 + (ydiff) ** 2) * Settings.unitSize / Settings.gridSize) + " ft";
            let angle = Math.atan2(diffsign * ydiff, xdiff);
            const xmid = Math.min(this.startPoint.x, endPoint.x) + xdiff / 2;
            const ymid = Math.min(this.startPoint.y, endPoint.y) + ydiff / 2;
            this.text.refPoint.x = xmid;
            this.text.refPoint.y = ymid;
            this.text.text = label;
            this.text.angle = angle;
            socket.emit("shapeMove", { shape: this.text.asDict(), temporary: true });
            layer.invalidate(true);
        },
        onMouseUp(event: MouseEvent) {
            if (!this.active || this.ruler === null || this.startPoint === null || this.text === null) return;
            
            const layer = gameManager.layerManager.getLayer("draw");
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }
            this.active = false;
            
            layer.removeShape(this.ruler, true, true);
            layer.removeShape(this.text, true, true);
            layer.invalidate(true);
            this.ruler = this.startPoint = this.text = null;
        }
    }
})
</script>