<template>
    <ContextMenu
        v-if="getActiveLayer() !== undefined"
        :visible="visible"
        :left="x + 'px'"
        :top="y + 'px'"
        @close="close"
    >
        <li v-if="getLayers().length > 1">Layer
            <ul>
                <li
                    v-for="layer in getLayers()"
                    :key="layer.name"
                    :style="[getActiveLayer().name === layer.name ? {'background-color':'#82c8a0'}: {}]"
                    @click="setLayer(layer.name)"
                >{{ layer.name }}</li>
            </ul>
        </li>
        <li @click="moveToBack">Move to back</li>
        <li @click="moveToFront">Move to front</li>
        <li @click="addInitiative">{{ getInitiativeWord() }} initiative</li>
        <li @click="openEditDialog">Show properties</li>
    </ContextMenu>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ContextMenu from "@/core/components/contextmenu.vue";
import Initiative from "@/game/ui/initiative.vue";

import { getRef } from "@/core/utils";
import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";

@Component({
    components: {
        ContextMenu,
    },
})
export default class ShapeContext extends Vue {
    visible = false;
    x = 0;
    y = 0;
    shape: Shape | null = null;
    get activeLayer(): string {
        const layer = layerManager.getLayer();
        return layer === undefined ? "" : layer.name;
    }
    open(event: MouseEvent, shape: Shape) {
        this.visible = true;
        this.x = event.pageX;
        this.y = event.pageY;
        this.shape = shape;
        this.$nextTick(() => (<HTMLElement>this.$children[0].$el).focus());
    }
    close() {
        this.visible = false;
        this.shape = null;
    }
    getLayers() {
        return layerManager.layers.filter(l => l.selectable && (gameStore.IS_DM || l.playerEditable));
    }
    getActiveLayer() {
        return layerManager.getLayer();
    }
    getInitiativeWord() {
        if (this.shape === null) return "";
        return getRef<Initiative>("initiative").contains(this.shape.uuid) ? "Show" : "Add";
    }
    setLayer(newLayer: string) {
        if (this.shape === null) return;
        this.shape.moveLayer(newLayer, true);
        this.close();
    }
    moveToBack() {
        if (this.shape === null) return;
        const layer = this.getActiveLayer()!;
        layer.moveShapeOrder(this.shape, 0, true);
        this.close();
    }
    moveToFront() {
        if (this.shape === null) return;
        const layer = this.getActiveLayer()!;
        layer.moveShapeOrder(this.shape, layer.shapes.length - 1, true);
        this.close();
    }
    addInitiative() {
        if (this.shape === null) return;
        const initiative = getRef<Initiative>("initiative");
        if (!initiative.contains(this.shape.uuid)) initiative.addInitiative(this.shape.getInitiativeRepr());
        initiative.visible = true;
        this.close();
    }
    openEditDialog() {
        EventBus.$emit("EditDialog.Open", this.shape);
        this.close();
    }
}
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