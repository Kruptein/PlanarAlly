<script lang="ts" setup>
const emit = defineEmits(["close-toast"]);
const props = defineProps<{ text: string; buttonText?: string; onClick: () => Promise<void> }>();

async function action(): Promise<void> {
    emit("close-toast");
    await props.onClick();
}
</script>

<template>
    <div class="toast-container">
        <span>{{ text }}</span>
        <span class="action" @click.stop="action">{{ buttonText ?? "USE" }}</span>
    </div>
</template>

<style lang="scss" scoped>
@import "vue-toastification/src/scss/_variables";

.toast-container {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .action {
        margin-left: 0.5rem;
        padding: 5px;
        background-color: white;
        color: $vt-color-info;
        border-radius: 7px;

        &:hover {
            cursor: pointer;
            font-weight: bold;
        }
    }
}
</style>
