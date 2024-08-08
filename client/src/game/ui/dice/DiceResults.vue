<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import Modal from "../../../core/components/modals/Modal.vue";
import { diceStore } from "../../dice/state";

const { t } = useI18n();

const results = computed(() => {
    // const key = diceStore.state.showKey;
    // if (key === undefined) return { total: 0, details: [] };
    // return diceStore.state.results.get(key)?.results[0] ?? { total: 0, details: [] };
    return { total: 0, details: [] };
});

function close(): void {
    diceStore.setShowDiceResults(undefined);
}

defineExpose({ close });

function sum(data: readonly number[]): number {
    return data.reduce((acc, val) => acc + val);
}
</script>

<template>
    <Modal :visible="diceStore.state.showKey !== undefined" :mask="false" @close="close">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>Dice Results</div>
                <div class="header-close" :title="t('common.close')" @click="close">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <div id="dice-body">
                <template v-if="diceStore.state.pending">
                    <div id="total">...</div>
                </template>
                <!-- <template v-else-if="diceStore.state.results.size > 0">
                    <div id="total">{{ results.total }}</div>
                    <div id="breakdown">
                        <template v-for="result of results.details.entries()" :key="result[0]">
                            <div v-if="result[1].type === 'dice'">
                                <div class="input">{{ result[1].input }}</div>
                                <div class="value">{{ sum(result[1].output) }}</div>
                                <div class="details">
                                    <div v-for="res of result[1].output" :key="res">{{ res }}</div>
                                </div>
                            </div>
                            <div v-else-if="result[1].type === 'op'">
                                {{ result[1].value }}
                            </div>
                            <div v-else class="value">{{ result[1].output }}</div>
                        </template>
                    </div>
                </template> -->
                <template v-else>No dice data known</template>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}
.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}
.modal-body {
    padding: 10px;
    min-width: 10em;
}
#dice-body {
    width: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    #total {
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 30px;
        height: 60px;
        width: 60px;
        border-bottom: 1px solid;
        margin-bottom: 15px;
    }
    #breakdown {
        display: flex;
        flex-wrap: wrap;
        // align-items: center;
        max-width: 25vw;
        font-size: 20px;
        > div {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 3em;
            margin-bottom: 15px;
        }
        .input {
            color: grey;
            font-size: 15px;
        }
        .value {
            font-weight: bold;
        }

        .details {
            display: flex;
            font-size: 0.8em;
            flex-wrap: wrap;
            margin-top: 0.5rem;
            font-style: italic;
            justify-content: center;

            > div::after {
                content: ",";
            }

            > div:last-child::after {
                content: "";
            }
        }
    }
}
</style>
