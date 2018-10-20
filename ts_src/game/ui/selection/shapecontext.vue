<template>
    <contextmenu v-if="getActiveLayer() !== undefined" :visible="visible" :left="x + 'px'" :top="y + 'px'" @close="close">
        <li v-if="getLayers().length > 1">Layer
            <ul>
                <li
                    v-for="layer in getLayers()"
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

import contextmenu from "../../../core/components/contextmenu.vue";
import gameManager from "../../manager";
import Settings from "../../settings";
import Shape from "../../shapes/shape";

import { vm } from "../../planarally";
import { l2gx, l2gy } from "../../units";

export default Vue.component("shape-menu", {
    components: {
        contextmenu,
    },
    data: () => ({
        visible: false,
        x: 0,
        y: 0,
        shape: <Shape | null>null,
    }),
    computed: {
        activeLayer: (): string => {
            const layer = gameManager.layerManager.getLayer();
            return layer === undefined ? "" : layer.name;
        },
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
        getLayers() {
            return gameManager.layerManager.layers.filter(
                l => l.selectable && (this.$store.state.IS_DM || l.playerEditable),
            );
        },
        getActiveLayer() {
            return gameManager.layerManager.getLayer();
        },
        getInitiativeWord() {
            if (this.shape === null) return "";
            const initiative = <any>vm.$refs.initiative;
            return initiative.contains(this.shape.uuid) ? "Show" : "Add";
        },
        setLayer(newLayer: string) {
            if (this.shape === null) return;
            this.shape.moveLayer(newLayer, true);
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
            const initiative = <any>vm.$refs.initiative;
            if (!initiative.contains(this.shape.uuid))
                initiative.updateInitiative(this.shape.getInitiativeRepr(), true);
            initiative.visible = true;
            this.close();
        },
    },
});
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