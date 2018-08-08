<template>
</template>

<script lang="ts">
import Tool from "./tool.vue";

export default Tool.extend({
    data() {
        return {
            name: "select",
        }
    },
    methods: {
        onMouseDown(event: MouseEvent) {
            console.log("A");
        }
    }
})
</script>