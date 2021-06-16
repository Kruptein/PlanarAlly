<script lang="ts">
import { defineComponent, toRef } from "vue";
import VueMarkdownIt from "vue3-markdown-it";

import { uiStore } from "../../store/ui";

export default defineComponent({
    components: { VueMarkdownIt },
    setup() {
        return { text: toRef(uiStore.state, "annotationText") };
    },
});
</script>

<template>
    <VueMarkdownIt v-show="text.length > 0" :source="text" id="annotation" :html="true" />
</template>

<style scoped>
#annotation {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    margin: auto;
    z-index: 10;
    width: fit-content;
    height: fit-content;

    border: solid 1px #9c455e;
    border-top: none;
    padding: 0.5em;
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
    background-color: white;
}
</style>
