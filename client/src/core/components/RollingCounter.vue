<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";

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

const counterElement = ref<HTMLElement | null>(null);
const resizeObserver = ref<ResizeObserver | null>(null);
const width = ref("1.25em");

function handleResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
        console.log('Element size changed: ', entry.contentRect.width, ', ', entry.contentRect.height);
        width.value = entry.contentRect.width + "px";
    }
}

onMounted(() => {
    setTimeout(() => {
        if (counterElement.value !== null) {
            resizeObserver.value = new ResizeObserver(handleResize);
            resizeObserver.value.observe(counterElement.value);
        }
    }, 100);
});

onBeforeUnmount(() => {
    if (resizeObserver.value && counterElement.value) {
        resizeObserver.value.unobserve(counterElement.value);
    }
});

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
    <div class="counter-wrapper">
        <div ref="counterElement" class="rolling-counter">
            <Transition :name="transitionName">
                <div :key="value">
                    {{ (Math.sign(value) == -1 ? "-" : "") + Math.abs(value).toString().padStart(fixedWidth, "0") }}
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped lang="scss">
.counter-wrapper {
    position: relative;
    transition: width 0.3s ease 0.05s;
    width: v-bind("width");
    height: calc(1.25em - 1px);
}
.rolling-counter {
    position: absolute;
    bottom: 0;
    left: 0;
    display: flex;
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
