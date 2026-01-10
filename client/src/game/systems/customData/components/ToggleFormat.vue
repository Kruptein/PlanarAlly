<script setup lang="ts">
import type { ApiShapeCustomDataBoolean } from "../../../../apiTypes";
import type { ElementId } from "../types";

defineProps<{
    element: ApiShapeCustomDataBoolean & { id: ElementId };
}>();
</script>

<template>
    <input type="checkbox" :checked="element.value" @click.stop />
</template>
