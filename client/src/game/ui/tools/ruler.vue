<template></template>

<script lang="ts">
import { mapState } from "vuex";

import socket from "@/game/api/socket";
import layerManager from "@/game/layers/manager";
import Line from "@/game/shapes/line";
import Text from "@/game/shapes/text";
import Tool from "@/game/ui/tools/tool.vue";

import { GlobalPoint } from "@/game/geom";
import { l2g } from "@/game/units";
import { getMouse } from "@/game/utils";

export default Tool.extend({
    data: () => ({
        name: "Ruler",
        active: false,
        startPoint: <GlobalPoint | null>null,
        ruler: <Line | null>null,
        text: <Text | null>null,
    }),
    computed: {
        ...mapState("game", ["username", "gridSize", "unitSize"]),
    },
    methods: {
        onMouseDown(event: MouseEvent) {
            const layer = layerManager.getLayer("draw");
            if (layer === undefined) {
                console.log("No draw layer!");
                return;
            }
            this.active = true;
            this.startPoint = l2g(getMouse(event));
            this.ruler = new Line(this.startPoint, this.startPoint, 3, this.$store.state.game.rulerColour);
            this.text = new Text(this.startPoint.clone(), "", "bold 20px serif");
            this.ruler.owners.push(this.username);
            this.text.owners.push(this.username);
            layer.addShape(this.ruler, true, true);
            layer.addShape(this.text, true, true);
        },
        onMouseMove(event: MouseEvent) {
            if (!this.active || this.ruler === null || this.startPoint === null || this.text === null) return;

            const layer = layerManager.getLayer("draw");
            if (layer === undefined) {
                console.log("No draw layer!");
                return;
            }
            const endPoint = l2g(getMouse(event));

            this.ruler.endPoint = endPoint;
            socket.emit("Shape.Update", { shape: this.ruler!.asDict(), redraw: true, temporary: true });

            const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
            const xdiff = Math.abs(endPoint.x - this.startPoint.x);
            const ydiff = Math.abs(endPoint.y - this.startPoint.y);
            const label = Math.round((Math.sqrt(xdiff ** 2 + ydiff ** 2) * this.unitSize) / this.gridSize) + " ft";
            const angle = Math.atan2(diffsign * ydiff, xdiff);
            const xmid = Math.min(this.startPoint.x, endPoint.x) + xdiff / 2;
            const ymid = Math.min(this.startPoint.y, endPoint.y) + ydiff / 2;
            this.text.refPoint.x = xmid;
            this.text.refPoint.y = ymid;
            this.text.text = label;
            this.text.angle = angle;
            socket.emit("Shape.Update", { shape: this.text.asDict(), redraw: true, temporary: true });
            layer.invalidate(true);
        },
        onMouseUp(event: MouseEvent) {
            if (!this.active || this.ruler === null || this.startPoint === null || this.text === null) return;

            const layer = layerManager.getLayer("draw");
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }
            this.active = false;

            layer.removeShape(this.ruler, true, true);
            layer.removeShape(this.text, true, true);
            layer.invalidate(true);
            this.ruler = this.startPoint = this.text = null;
        },
    },
});
</script>