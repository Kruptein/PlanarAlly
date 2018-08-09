<template>
</template>

<script lang="ts">
import Vue from 'vue'
import { onContextMenu } from '../events/mouse';
export default Vue.component('tool', {
    data() {return {
        name: '',
        active: false
    }},
    created() {
        this.$root.$on('mousedown', (event: MouseEvent, tool: string) => {
            if (tool === this.name) this.onMouseDown(event)
        });
        this.$root.$on('mouseup', (event: MouseEvent, tool: string) => {
            if (tool === this.name) this.onMouseUp(event)
        });
        this.$root.$on('mousemove', (event: MouseEvent, tool: string) => {
            if (tool === this.name) this.onMouseMove(event)
        });
        this.$root.$on('contextmenu', (event: MouseEvent, tool: string) => {
            if (tool === this.name) this.onContextMenu(event)
        });
    },
    methods: {
        onMouseDown(event: MouseEvent) {},
        onMouseUp(event: MouseEvent) {},
        onMouseMove(event: MouseEvent) {},
        onContextMenu(event: MouseEvent) {},
    }
})
</script>
