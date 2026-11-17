<script lang="ts" setup>
// Toasts are rendered in a separate app where useI18n is not available, so all text is passed in translated
const emit = defineEmits<(e: "close-toast") => void>();
defineProps<{ title: string; message: string; whatsNewText: string; blogUrl: string }>();
</script>

<template>
    <div class="update-toast-body">
        <div class="title">
            <font-awesome-icon icon="wand-magic-sparkles" class="icon" />
            {{ title }}
        </div>
        <div class="message">{{ message }}</div>
        <div class="actions">
            <a :href="blogUrl" target="_blank" rel="noopener noreferrer" @click="emit('close-toast')">
                {{ whatsNewText }}
                <font-awesome-icon icon="external-link-alt" />
            </a>
        </div>
    </div>
</template>

<style lang="scss">
.Vue-Toastification__toast.update-toast {
    min-height: unset;
    min-width: 320px;
    max-width: 400px;
    padding: 0.9rem 1rem;
    border-left: solid 6px #fa5a5a;
    background-color: white;
    color: black;
    cursor: default;

    .Vue-Toastification__close-button {
        color: black;
        align-self: start;
    }

    .Vue-Toastification__progress-bar {
        height: 3px;
        background-color: rgba(250, 90, 90, 0.5);
    }
}
</style>

<style lang="scss" scoped>
.update-toast-body {
    display: flex;
    flex-direction: column;
    row-gap: 0.3rem;
    min-width: 0;

    .title {
        font-size: 1.15rem;
        font-weight: bold;
        line-height: 1.2;

        > .icon {
            margin-right: 0.3rem;
            color: #fa5a5a;
            animation: update-toast-pop 0.3s cubic-bezier(0.04, 0.97, 0.84, 1.305);
        }
    }

    .message {
        line-height: 1.3;
        opacity: 0.75;
    }

    .actions {
        display: flex;
        margin-top: 0.4rem;

        > a {
            display: inline-flex;
            align-items: center;
            column-gap: 0.4rem;
            padding: 0.35rem 0.8rem;
            border-radius: 0.4rem;
            background-color: #fa5a5a;
            color: white;
            font-weight: bold;
            text-decoration: none;

            &:hover {
                background-color: #e04848;
            }
        }
    }
}

@keyframes update-toast-pop {
    from {
        transform: scale(0);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
