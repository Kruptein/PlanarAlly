<template>
    <contextmenu v-if="getActiveLayer() !== undefined" :visible="visible" :left="x + 'px'" :top="y + 'px'" @close="close">
        <li>Layer
            <ul>
                <li
                    v-for="layer in getLayers()"
                    v-if="layer.selectable"
                    :key="layer.name"
                    :style="[getActiveLayer().name === layer.name ? {'background-color':'#82c8a0'}: {}]"
                    @click='setLayer(layer.name)'
                >
                    {{ layer.name }}
                </li>
            </ul>
        </li>
        <li @click='moveToBack'>Move to back</li>
        <li @click='moveToFront'>Move to front</li>
        <li @click='addInitiative'>{{ getInitiativeWord() }} initiative</li>
    </contextmenu>
</template>

<script lang="ts">
import Vue from "vue";
import contextmenu from "../../vue/components/contextmenu.vue";

import Settings from "../settings";
import gameManager from "../planarally";
import { l2gx, l2gy } from "../units";
import { socket } from "../socket";
import Shape from "./shape";

export default Vue.component('shape-menu', {
    components: {
        contextmenu
    },
    data: () => ({
        visible: false,
        x: 0,
        y: 0,
        shape: <Shape|null>null
    }),
    computed: {
        activeLayer: () => {
            const layer = gameManager.layerManager.getLayer();
            return (layer === undefined) ? '' : layer.name;
        }
    },
    methods: {
        open(event: MouseEvent, shape: Shape) {
            this.visible = true;
            this.x = event.pageX;
            this.y = event.pageY;
            this.shape = shape;
            this.$nextTick(() => this.$children[0].$el.focus());
        },
        close() {
            this.visible = false;
            this.shape = null;
        },
        getLayers() { return gameManager.layerManager.layers },
        getActiveLayer() {
            return gameManager.layerManager.getLayer();
        },
        getInitiativeWord() {
            if (this.shape === null) return '';
            return gameManager.initiativeTracker.contains(this.shape.uuid) ? "Show" : "Add"
        },
        setLayer(newLayer: string) {
            if (this.shape === null) return;
            const layer = this.getActiveLayer()!;
            layer.removeShape(this.shape, true);
            gameManager.layerManager.getLayer(newLayer)!.addShape(this.shape, true);
            this.close();
        },
        moveToBack() {
            if (this.shape === null) return;
            const layer = this.getActiveLayer()!;
            layer.moveShapeOrder(this.shape, 0, true);
            this.close();
        },
        moveToFront() {
            if (this.shape === null) return;
            const layer = this.getActiveLayer()!;
            layer.moveShapeOrder(this.shape, layer.shapes.length - 1, true);
            this.close();
        },
        addInitiative() {
            if (this.shape === null) return;
            if (gameManager.initiativeTracker.contains(this.shape.uuid)) gameManager.initiativeTracker.show();
            gameManager.initiativeTracker.addInitiative(this.shape.getInitiativeRepr(), true);
            this.close();
        }
    }
})
</script>

<style scoped>
.ContextMenu ul {
    border: 1px solid #82c8a0;
}
.ContextMenu ul li {
    border-bottom: 1px solid #82c8a0;
}
.ContextMenu ul li:hover {
    background-color: #82c8a0;
}
</style>