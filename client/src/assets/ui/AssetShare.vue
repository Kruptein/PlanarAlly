<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import Modal from "../../core/components/modals/Modal.vue";
import { sendCreateShare, sendEditShareRight, sendRemoveShare } from "../emits";
import type { AssetId } from "../models";
import { socket } from "../socket";
import { assetState } from "../state";

const props = defineProps<{ visible: boolean; asset: AssetId | undefined }>();
const emit = defineEmits<(e: "close") => void>();

const { t } = useI18n();

const userInput = ref<string>("");
const selectedRight = ref<"view" | "edit">("view");
const autoComplete = ref<HTMLDivElement | null>(null);

const names = ref<string[]>([]);

watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            socket.emit("Connections.Usernames.Get", (userNames: string[]) => (names.value = userNames));
        }
    },
);

const rights = ["view", "edit"] as const;

const shares = computed(() => {
    if (!props.asset) return [];
    return assetState.reactive.idMap.get(props.asset)?.shares ?? [];
});

function setRight(event: Event, user: string): void {
    if (props.asset === undefined) return;
    const right = (event.target as HTMLSelectElement).value as "view" | "edit";
    sendEditShareRight({ user, asset: props.asset, right });
}

function remove(user: string): void {
    if (props.asset === undefined) return;
    sendRemoveShare({ asset: props.asset, user });
}

// NEW SHARES

const filteredNames = computed(() => names.value.filter((n) => n.startsWith(userInput.value)));

function setNewRight(event: Event): void {
    selectedRight.value = (event.target as HTMLSelectElement).value as "view" | "edit";
}

function submit(): void {
    if (props.asset === undefined) return;
    sendCreateShare({ right: selectedRight.value, user: userInput.value, asset: props.asset });
}
</script>

<template>
    <Modal :visible="visible" :colour="'transparent'">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                Asset Sharing
                <div class="header-close" :title="t('common.close')" @click="emit('close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <template #default>
            <div class="modal-body">
                <template v-if="shares.length > 0">
                    <h3>Existing Shares</h3>
                    <div id="share-table">
                        <template v-for="share of shares" :key="share.user">
                            <div>{{ share.user }}</div>
                            <div class="right">
                                <select @change="setRight($event, share.user)">
                                    <option v-for="right of rights" :key="right" :selected="share.right === right">
                                        {{ right }}
                                    </option>
                                </select>
                            </div>
                            <div><font-awesome-icon icon="trash-alt" @click="remove(share.user)" /></div>
                            <div class="line"></div>
                        </template>
                    </div>
                </template>

                <h3>Add a new share {{ selectedRight }}</h3>
                <div id="user-input">
                    <div id="bar">
                        <input
                            v-model="userInput"
                            type="text"
                            @focus="autoComplete!.style.visibility = 'visible'"
                            @blur="autoComplete!.style.visibility = 'hidden'"
                        />
                        <select @change="setNewRight">
                            <option v-for="right of rights" :key="right" :selected="selectedRight === right">
                                {{ right }}
                            </option>
                        </select>
                    </div>
                    <div v-show="userInput.length >= 1" id="autocomplete" ref="autoComplete">
                        <div v-for="name of filteredNames" :key="name" @mousedown="userInput = name">
                            {{ name }}
                        </div>
                        <div v-if="filteredNames.length === 0" style="font-style: italic">
                            You have no known users that match this filter.
                        </div>
                    </div>
                </div>

                <button
                    :disabled="!names.includes(userInput)"
                    :title="
                        names.includes(userInput)
                            ? `Share this asset with ${userInput}`
                            : 'Enter a valid username before sharing'
                    "
                    @click="submit"
                >
                    Submit
                </button>
            </div>
        </template>
    </Modal>
</template>

<style scoped lang="scss">
.modal-header {
    background-color: rgba(77, 0, 21);
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
    border-radius: 1rem;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.header-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
}

.modal-body {
    min-width: 15vw;
    padding: 10px;
    padding-top: 0;
    display: flex;
    flex-direction: column;
    align-items: left;
    color: black;
    background-color: white;
}

select {
    appearance: none;
    width: 100%;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    margin: 0;
    outline: none;

    &:hover {
        cursor: pointer;
    }
}

#share-table {
    padding: 0.75rem 1rem;
    display: grid;
    grid-template-columns: 1fr auto 1rem;
    background-color: bisque;
    border-radius: 1rem;
    align-content: center;
    justify-content: center;
    align-items: center;

    row-gap: 0.5rem;

    > div {
        &.right {
            margin-right: 1rem;
        }

        &.line {
            grid-column: 1/-1;
            border-bottom: 1px dashed black;

            &:last-of-type {
                display: none;
            }
        }
    }
}

#user-input {
    display: flex;
    flex-direction: column;
    position: relative;

    > #bar {
        height: 2rem;
        width: 100%;
        border: solid 1px black;
        border-radius: 1rem;
        overflow: hidden;

        display: flex;
        align-items: center;

        &:focus-within {
            box-shadow: 0px 0px 5px black;
            border: none;
        }

        > input {
            border: none;
            outline: none;
            width: 100%;
            padding: 0.5rem;
            padding-left: 1.5rem;
        }

        > select {
            background-color: bisque;
            width: auto;
            border-radius: 0;
            height: 100%;
            border: none;
            border-left: solid 1px black;
        }
    }

    > #autocomplete {
        visibility: none;
        position: absolute;
        top: 2rem;
        left: 1rem;
        width: calc(100% - 7rem);
        max-height: 10rem;
        padding: 0.5rem;

        border: solid 1px black;
        border-radius: 1rem;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        border-top: none;

        background-color: white;
        overflow: auto;

        > div {
            border-bottom: dotted 1px black;
            padding: 0.2rem 0;

            &:first-of-type {
                padding-top: 0;
            }

            &:last-of-type {
                border-bottom: none;
                padding-bottom: 0;
            }

            &:hover {
                cursor: pointer;
                font-weight: bold;
            }
        }

        &:focus {
            visibility: visible;
        }
    }
}

button {
    // border: solid 1px black;
    border-radius: 1rem;
    padding: 0.35rem;
    margin-top: 1rem;
    width: 5rem;
    align-self: flex-end;

    &:hover {
        cursor: pointer;
    }
}
</style>
