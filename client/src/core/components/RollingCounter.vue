<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = withDefaults(
    defineProps<{
        value: number;
        color?: string;
        disabled?: boolean;
        fixedWidth?: number;
        direction?: string;
    }>(),
    {
        color: "black",
        disabled: false,
        fixedWidth: 1,
        direction: "normal",
    },
);

const increased = ref(false);

watch(
    () => props.value,
    (oldVal, newVal) => {
        increased.value = newVal > oldVal;
    },
);

const transitionName = computed(() => {
    if (increased.value) {
        if (props.direction === "reverse") return "reverse-counter-roll";
        return "counter-roll";
    }
    if (props.direction === "reverse") return "counter-roll";
    return "reverse-counter-roll";
});
</script>

<template>
    <div class="rolling-counter">
        <Transition :name="transitionName">
            <div :key="value">
                {{ (Math.sign(value) == -1 ? "-" : "") + Math.abs(value).toString().padStart(fixedWidth, "0") }}
            </div>
        </Transition>
    </div>
</template>

<style scoped lang="scss">
.rolling-counter {
    position: relative;
    display: flex;
    width: 1.25em;
    color: v-bind("color");
}

.counter-roll-enter-from {
    transform: translateY(-60%) rotateX(90deg);
    opacity: 0;
}
.counter-roll-leave-to {
    position: absolute;
    transform: translateY(60%) rotateX(-90deg);
    opacity: 0;
}
.reverse-counter-roll-enter-active,
.reverse-counter-roll-leave-active,
.counter-roll-enter-active,
.counter-roll-leave-active {
    transition: all 0.2s ease-in-out;
}

.reverse-counter-roll-enter-from {
    transform: translateY(60%) rotateX(-90deg);
    opacity: 0;
}
.reverse-counter-roll-leave-to {
    position: absolute;
    transform: translateY(-60%) rotateX(90deg);
    opacity: 0;
}
</style>
