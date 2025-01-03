<script setup lang="ts" generic="T, MS extends boolean">
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        // data
        options: readonly { label: string; value: T }[];
        modelValue: MS extends true ? T[] : T;
        // styles
        id?: string;
        activeColor?: string;
        color?: string;
        disabled?: boolean;
        multiSelect: MS;
    }>(),
    {
        id: undefined,
        color: "rgba(236, 242, 255, 0.25)",
        activeColor: "rgba(236, 242, 255, 1)",
        disabled: false,
    },
);
const emit = defineEmits<(e: "update:modelValue", s: MS extends true ? T[] : T) => void>();

const data = computed(() => (props.multiSelect ? props.modelValue : [props.modelValue]) as T[]);

function toggle(option: T): void {
    if (props.disabled) return;
    let data: MS extends true ? T[] : T;
    if (props.multiSelect) {
        const arr = props.modelValue as T[];
        if (arr.includes(option)) {
            data = arr.filter((d) => d !== option) as MS extends true ? T[] : T;
        } else {
            data = [...arr, option] as MS extends true ? T[] : T;
        }
    } else {
        // idk eslint and typescript are not agreeing with eachother
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        data = option as MS extends true ? T[] : T;
    }
    emit("update:modelValue", data);
}
</script>

<template>
    <div :id="id" class="toggle-group" :class="{ disabled }">
        <div
            v-for="option of options"
            :key="option.label"
            :class="{ selected: data.includes(option.value) }"
            @click="toggle(option.value)"
        >
            {{ option.label }}
        </div>
    </div>
</template>

<style scoped lang="scss">
.toggle-group {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;

    width: fit-content;
    overflow: hidden;

    border-radius: 1rem;
    background-color: v-bind("color");
    border: solid 2px v-bind("activeColor");

    > div {
        padding: 0.5rem 0.7rem;
        display: flex;
        align-items: center;

        &:hover {
            cursor: pointer;
            background-color: v-bind("activeColor");
        }

        &.selected {
            background-color: v-bind("activeColor");
        }
    }

    &.disabled {
        opacity: 0.5;
        > div:hover {
            cursor: not-allowed;
        }

        > :not(.selected):hover {
            background-color: inherit;
        }
    }
}
</style>
