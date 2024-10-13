<script setup lang="ts">
import { computed, nextTick, ref, watch, watchEffect } from "vue";

import Modal from "../../core/components/modals/Modal.vue";
import { i18n } from "../../i18n";
import type { Aura } from "../systems/auras/models";
import { playerSettingsState } from "../systems/settings/players/state";
import type { Tracker } from "../systems/trackers/models";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const math = () => import("mathjs");

async function evaluateExpression(expression: string): Promise<number> {
    const { evaluate } = await math();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return evaluate(expression);
}

const emit = defineEmits<{
    (e: "close"): void;
    (e: "submit", data: { solution: number; relativeMode: boolean }): void;
}>();
const props = defineProps<{ tracker: Tracker | Aura | null }>();

const { t } = i18n.global;

const answer = ref("");
const input = ref<HTMLInputElement | null>(null);
const relativeMode = ref(false);
const error = ref("");

watchEffect(() => {
    relativeMode.value = playerSettingsState.reactive.defaultTrackerMode.value;
});

const title = computed(() => {
    if (props.tracker !== null) return t("game.ui.selection.SelectionInfo.updating_NAME", { name: props.tracker.name });
    return "";
});
const question = computed(() => {
    if (props.tracker !== null)
        return t("game.ui.selection.SelectionInfo.new_value_NAME", { name: props.tracker.name });
    return "";
});

watch(
    () => props.tracker,
    async () => {
        if (props.tracker !== null) {
            await nextTick(() => input.value!.focus());
        }
    },
);

function reset(): void {
    answer.value = "";
    error.value = "";
}

function close(): void {
    emit("close");
    reset();
}

function setError(): void {
    error.value = "Expression could not be evaluated properly.";
}

async function submit(): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const solution = await evaluateExpression(answer.value);
        if (typeof solution !== "number") return setError();

        emit("submit", { solution, relativeMode: relativeMode.value });
        reset();
    } catch {
        return setError();
    }
}

function setMode(mode: boolean): void {
    relativeMode.value = mode;
    input.value!.focus();
}
</script>

<template>
    <Modal :visible="props.tracker !== null" @close="close">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                {{ title }}
            </div>
        </template>
        <div class="modal-body">
            <div id="question">{{ question }}</div>
            <div id="error">{{ error }}</div>
            <div id="answer-row">
                <div id="toggle">
                    <div :class="{ active: !relativeMode }" title="Absolute mode" @click="setMode(false)">
                        <font-awesome-icon icon="equals" />
                    </div>
                    <div :class="{ active: relativeMode }" title="Relative mode" @click="setMode(true)">
                        <font-awesome-icon icon="plus-minus" />
                    </div>
                </div>
                <input ref="input" v-model="answer" type="text" @keyup.enter="submit" />
            </div>
        </div>
        <div class="modal-footer">
            <button @click="submit">{{ t("common.submit") }}</button>
        </div>
    </Modal>
</template>

<style scoped lang="scss">
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.modal-body {
    padding: 10px;
    padding-bottom: 0;
    display: flex;
    flex-direction: column;
}

#question {
    margin-bottom: 20px;
}

#error {
    color: red;
    margin-bottom: 5px;
}

.modal-footer {
    padding: 10px;
    text-align: right;
}

#answer-row {
    position: relative;

    input {
        height: 2.2rem;
        padding-left: 4rem;
        border-top-left-radius: 7px;
        border-bottom-left-radius: 7px;
        border-style: solid;

        &:focus {
            outline-color: grey;
        }
    }

    #toggle {
        position: absolute;
        top: 1px;
        left: 1px;
        padding: 2px;
        height: 2.1rem;

        display: flex;
        justify-content: center;
        align-items: center;
        border-style: solid;
        border-radius: 7px;
        border-color: grey;

        > div {
            padding: 4px;
            width: 1.5rem;
            // height: 1.5rem;

            display: flex;
            align-items: center;
            justify-content: center;

            &:hover {
                cursor: pointer;
            }
        }

        .active {
            background-color: grey;
            font-weight: bold;
            color: white;
        }
    }
}
</style>
