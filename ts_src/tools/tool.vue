<template>
</template>

<script lang="ts">
import Vue from 'vue'
import { onContextMenu } from '../events/mouse';
export default Vue.component('tool', {
    data() {return {
        name: '',
        selected: false,
        active: false,
    }},
    computed: {
        detailRight(): string {
            const rect = (<any>this.$root.$refs[this.name + '-selector'])[0].getBoundingClientRect();
            const mid = rect.left + (rect.width / 2);

            return `${window.innerWidth - Math.min(window.innerWidth - 25, mid + 75)}px`;
        },
        detailArrow(): string {
            const rect = (<any>this.$root.$refs[this.name + '-selector'])[0].getBoundingClientRect();
            const mid = rect.left + (rect.width / 2);
            const right = Math.min(window.innerWidth - 25, mid + 75);
            return `${right - mid - 14}px`; // border width
        }
    },
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
        this.$root.$on('tools-select-change', (newValue: string, oldValue: string) => {
            if (oldValue === this.name) {
                this.selected = false;
                this.onDeselect();
            } else if (newValue === this.name) {
                this.selected = true;
                this.onSelect();
            }
        });
    },
    methods: {
        onSelect() {},
        onDeselect() {},
        onMouseDown(event: MouseEvent) {},
        onMouseUp(event: MouseEvent) {},
        onMouseMove(event: MouseEvent) {},
        onContextMenu(event: MouseEvent) {},
    }
})
</script>

<style>
.tool-detail {
    position: absolute;
    right: var(--detailRight);
    bottom: 80px;
    z-index: 11;
    /* width: 150px; */
    border: solid 1px #2b2b2b;
    background-color: white;
    display: grid;
    padding: 10px;
    /* grid-template-columns: 50% 50%; */
    grid-template-columns: auto auto;
    grid-column-gap: 5px;
    grid-row-gap: 2px;
}
.tool-detail:after {
    content: '';
    position: absolute;
    right: var(--detailArrow);
    bottom: 0;
    width: 0;
    height: 0;
    border: 14px solid transparent;
    border-top-color: black;
    border-bottom: 0;
    margin-left: -14px;
    margin-bottom: -14px;
}

.tool-detail input {
    width: 100%;
    box-sizing: border-box;
}
</style>
