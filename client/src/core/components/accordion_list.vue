<template>
  <div id="accordion-container">
    <slot/>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

import Accordion from "./accordion.vue";

@Component
export default class AccordionList extends Vue {
    mounted() {
        this.$on("accordion-close", this.toggle);
    }

    toggle(target: Accordion) {
        for (const child of this.$children) {
            if (child instanceof Accordion && child !== target) child.active = false;
        }
    }
}
</script>

<style>
.accordion {
    margin-bottom: 0.2em;
}
.accordion:last-of-type {
    margin-bottom: 0;
}
</style>


<style scoped>
#accordion-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
}
</style>
