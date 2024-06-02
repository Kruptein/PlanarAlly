<script setup lang="ts" generic="T extends string">
const props = withDefaults(
    defineProps<{
        options: readonly T[];
        borderColor?: string;
        color?: string;
        disabled?: boolean;
    }>(),
    {
        borderColor: "rgba(236, 242, 255, 1)",
        color: "rgba(236, 242, 255, 0.25)",
        disabled: false,
    },
);
const emit = defineEmits<(e: "click", s: T) => void>();

function click(option: T): void {
    if (props.disabled) return;
    emit("click", option);
}
</script>

<template>
    <div class="click-group" :class="{ disabled }">
        <div v-for="option of options" :key="option" @click="click(option)">
            {{ option }}
        </div>
    </div>
</template>

<style scoped lang="scss">
.click-group {
    display: flex;
    flex-wrap: wrap;
    width: fit-content;
    overflow: hidden;
    border-radius: 1rem;
    background-color: v-bind("color");
    border: solid 2px v-bind("borderColor");

    > div {
        padding: 0.4rem 0.7rem;

        &:hover {
            cursor: pointer;
            background-color: v-bind("borderColor");
        }
    }

    &.disabled {
        opacity: 0.5;

        > div:hover {
            cursor: not-allowed;
        }
    }
}
</style>
