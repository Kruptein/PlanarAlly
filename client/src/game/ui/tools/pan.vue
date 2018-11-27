<template></template>

<script lang="ts">
import { mapState } from "vuex";

import layerManager from "@/game/layers/manager";
import store from "@/game/store";
import Tool from "@/game/ui/tools/tool.vue";

import { sendClientOptions } from "@/game/api/utils";
import { LocalPoint } from "@/game/geom";
import { getMouse } from "@/game/utils";

export default Tool.extend({
    data: () => ({
        name: "Pan",
        panStart: new LocalPoint(0, 0),
        active: false,
    }),
    computed: {
        ...mapState("game", ["zoomFactor", "panX", "panY"]),
    },
    methods: {
        onMouseDown(event: MouseEvent) {
            this.panStart = getMouse(event);
            this.active = true;
        },
        onMouseMove(event: MouseEvent) {
            if (!this.active) return;
            const mouse = getMouse(event);
            const distance = mouse.subtract(this.panStart).multiply(1 / this.zoomFactor);
            store.increasePanX(Math.round(distance.x));
            store.increasePanY(Math.round(distance.y));
            this.panStart = mouse;
            layerManager.invalidate();
        },
        onMouseUp(event: MouseEvent) {
            this.active = false;
            sendClientOptions();
        },
    },
});
</script>