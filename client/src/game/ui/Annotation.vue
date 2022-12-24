<script setup lang="ts">
import VueMarkdownIt from "vue3-markdown-it";

import { uiState } from "../systems/ui/state";
</script>

<template>
    <VueMarkdownIt
        v-show="uiState.reactive.annotationText.length > 0"
        :source="uiState.reactive.annotationText"
        id="annotation"
        :html="true"
    />
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
