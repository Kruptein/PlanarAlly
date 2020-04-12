<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

@Component
export default class Accordion extends Vue {
    @Prop(String) title!: string;
    @Prop({ default: true, type: Boolean }) showArrow!: boolean;
    @Prop({ default: () => [] }) items!: [string, string][];
    @Prop({ default: () => [] }) initialValues!: string[];

    selected: string[] = [];

    active = false;

    mounted(): void {
        this.selected = this.initialValues;
        this.updateCategory();
    }

    toggleDisplay(_event: MouseEvent): void {
        this.active = !this.active;
    }

    toggleCategory(): void {
        const overall = <HTMLInputElement>this.$refs.overall;
        if (overall.checked) this.selected = this.items.map(i => i[0]);
        else this.selected = [];
        this.$emit("selectionupdate", { title: this.title, selection: this.selected });
    }

    updateCategory(): void {
        const overall = <HTMLInputElement>this.$refs.overall;
        if (this.selected.length === 0) {
            overall.checked = false;
            overall.indeterminate = false;
        } else if (this.selected.length === this.items.length) {
            overall.checked = true;
            overall.indeterminate = false;
        } else {
            overall.checked = false;
            overall.indeterminate = true;
        }
    }

    toggleSelection(item: string): void {
        const found = this.selected.indexOf(item);
        if (found === -1) this.selected.push(item);
        else this.selected.splice(found, 1);
        this.updateCategory();
        this.$emit("selectionupdate", { title: this.title, selection: this.selected });
    }
}
</script>

<template>
    <div class="accordion">
        <div id="header" @click.prevent="toggleDisplay">
            <input type="checkbox" @click.stop="toggleCategory" ref="overall" />
            <strong>{{ title }}</strong>
            <template v-if="showArrow">
                <span class="down-Arrow" v-show="showArrow && !active">&#9660;</span>
                <span class="up-Arrow" v-show="showArrow && active">&#9650;</span>
            </template>
        </div>
        <div v-show="active" id="body">
            <div v-for="item in items" :key="item[0]" class="item" @click="toggleSelection(item[0])">
                <input type="checkbox" :checked="selected.includes(item[0])" @click.prevent />
                {{ item[1] }}
            </div>
        </div>
    </div>
</template>

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
