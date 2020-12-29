<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import VueMarkdown from "vue-markdown";

@Component({
    components: {
        VueMarkdown,
    },
})
export default class Annotation extends Vue {
    private text = "";

    get hasText(): boolean {
        return this.text !== "";
    }

    setActiveText(text: string): void {
        this.text = text;
    }
}
</script>

<template>
    <vue-markdown v-show="text.length > 0" :source="text" id="annotation"></vue-markdown>
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
