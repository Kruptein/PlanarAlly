<script lang="ts" setup>
defineProps<{ player: string; display: string; result: string }>();
</script>

<template>
    <div class="dice-roll-toast-body">
        <div class="result">{{ result }}</div>
        <div class="info">
            <div class="player" :title="player">{{ player }}</div>
            <div class="expression" :title="display">
                <font-awesome-icon icon="dice-six" class="icon" />
                <span>{{ display }}</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
.Vue-Toastification__toast.dice-roll-toast {
    min-height: unset;
    min-width: 280px;
    max-width: 380px;
    padding: 0.75rem 1rem 0.75rem 0.75rem;
    border-left: solid 6px #2196f3;
    background-color: rgba(250, 253, 255, 1);
    color: black;
    cursor: pointer;

    .Vue-Toastification__close-button {
        color: black;
        align-self: start;
    }

    .Vue-Toastification__progress-bar {
        height: 3px;
        background-color: rgba(33, 150, 243, 0.5);
    }
}
</style>

<style lang="scss" scoped>
.dice-roll-toast-body {
    display: flex;
    align-items: center;
    column-gap: 1rem;

    .result {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 4rem;
        height: 4rem;
        padding: 0 0.5rem;
        box-sizing: border-box;

        border: solid 4px black;
        border-radius: 0.5rem;
        background-color: white;

        font-size: 2rem;
        font-weight: bold;
        line-height: 1;
        animation: dice-roll-pop 0.3s cubic-bezier(0.04, 0.97, 0.84, 1.305);
    }

    .info {
        display: flex;
        flex-direction: column;
        min-width: 0;
        row-gap: 0.25rem;

        > div {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .player {
            font-size: 1.25rem;
            font-weight: bold;
            line-height: 1.2;
        }

        .expression {
            font-size: 1rem;
            line-height: 1.2;
            opacity: 0.75;

            > .icon {
                margin-right: 0.4rem;
                font-size: 0.9em;
            }
        }
    }
}

@keyframes dice-roll-pop {
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
