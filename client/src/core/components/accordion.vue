<template>
  <div class="accordion">
    <div id="header" @click.prevent="toggleDisplay">
        <input type="checkbox" @click.stop="toggleCategory" ref="overall">
        <strong>{{title}}</strong>
        <template v-if="showArrow">
            <span class="down-Arrow" v-show="showArrow && !active">&#9660;</span>
            <span class="up-Arrow" v-show="showArrow && active">&#9650;</span>
        </template>
    </div>
    <div v-show="active" id="body">
        <div v-for="item in items" :key="item" class="item" @click="toggleSelection(item)">
            <input type="checkbox" :checked="selected.includes(item)" @click.prevent> {{ item }}
        </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

@Component
export default class Accordion extends Vue {
    @Prop(String) title!: string;
    @Prop({ default: true, type: Boolean }) showArrow!: boolean;
    @Prop({ default: () => []}) items!: string[];

    active = false;

    selected: string[] = [];

    toggleDisplay(event: MouseEvent) {
        this.active = !this.active;
        this.$parent.$emit("accordion-close", this);
    }

    toggleCategory() {
        const overall = this.$refs.overall as HTMLInputElement;
        if (overall.checked) this.selected = this.items;
        else this.selected = [];
    }

    toggleSelection(item: string) {
        const found = this.selected.indexOf(item);
        if (found === -1) this.selected.push(item);
        else this.selected.splice(found, 1);

        const overall = this.$refs.overall as HTMLInputElement;
        if (this.selected.length === 0) {
            overall.checked = false;
            overall.indeterminate = false;
        } else if(this.selected.length === this.items.length) {
            overall.checked = true;
            overall.indeterminate = false;
        } else {
            overall.checked = false;
            overall.indeterminate = true;
        }
    }
}
</script>

<style scoped>
.accordion {
    border: solid 2px #ff7052;
    user-select: none !important;
    -webkit-user-drag: none !important;
}

#header {
    background-color: #ff7052;
    cursor: pointer;
    padding: 0.5em;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
}

*[type="checkbox"] {
    width: min-content;
    margin-right: 10px;
}

#body {
    padding: 0.3em;
    display: flex;
    flex-direction: column;
    /* background-color: red; */
}

.item {
    padding: 0.2em;
    display: flex;
    align-items: center;
}

.item:hover {
    background-color: #ff7052;
    cursor: pointer;
}
</style>
