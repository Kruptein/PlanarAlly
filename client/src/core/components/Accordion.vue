<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";

import type { ApiLabel } from "../../apiTypes";

const emit = defineEmits<(e: "selectionupdate", selection: string[]) => void>();
const props = defineProps<{ title: string; items: ApiLabel[]; initialValues: string[] }>();

const overall = ref<HTMLInputElement | null>(null);

const state = reactive({
    active: false,
    selected: [] as string[],
});

onMounted(() => {
    state.selected = props.initialValues;
    updateCategory();
});

function toggleCategory(): void {
    if (overall.value!.checked) state.selected = props.items.map((i) => i.uuid);
    else state.selected = [];
    emit("selectionupdate", state.selected);
}

function toggleSelection(item: string): void {
    const found = state.selected.indexOf(item);
    if (found === -1) state.selected.push(item);
    else state.selected.splice(found, 1);
    updateCategory();
    emit("selectionupdate", state.selected);
}

function updateCategory(): void {
    if (state.selected.length === 0) {
        overall.value!.checked = false;
        overall.value!.indeterminate = false;
    } else if (state.selected.length === props.items.length) {
        overall.value!.checked = true;
        overall.value!.indeterminate = false;
    } else {
        overall.value!.checked = false;
        overall.value!.indeterminate = true;
    }
}
</script>

<template>
    <div class="accordion">
        <div id="header" @click.prevent="state.active = !state.active">
            <input ref="overall" type="checkbox" @click.stop="toggleCategory" />
            <strong>{{ title }}</strong>
        </div>
        <div v-show="state.active" id="body">
            <div v-for="item in items" :key="item.uuid" class="item" @click="toggleSelection(item.uuid)">
                <input type="checkbox" :checked="state.selected.includes(item.uuid)" @click.prevent />
                {{ item.name }}
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
