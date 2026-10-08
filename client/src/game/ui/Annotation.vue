<script setup lang="ts">
import VueMarkdown from "vue-markdown-render";

import { rulePlugins } from "../systems/compendium/markdown";
import { ruleClick } from "../systems/compendium/popover";
import { uiState } from "../systems/ui/state";
</script>

<template>
    <div v-show="uiState.reactive.annotationText.length > 0" id="annotation" @click="ruleClick">
        <VueMarkdown :source="uiState.reactive.annotationText" :options="{ html: true }" :plugins="rulePlugins" />
    </div>
</template>

<style scoped>
#annotation {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    margin: auto;
    z-index: 10;
    width: -moz-fit-content;
    width: fit-content;
    height: -moz-fit-content;
    height: fit-content;

    border: solid 1px #9c455e;
    border-top: none;
    padding: 0.5em;
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
    background-color: white;
}
</style>
