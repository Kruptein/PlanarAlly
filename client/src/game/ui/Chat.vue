<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { uuidv4 } from "../../core/utils";
import { chatSystem } from "../systems/chat";
import { chatState } from "../systems/chat/state";
import { playerSystem } from "../systems/players";

const { t } = useI18n();

// Check for URL that starts at word boundary && does not follow ]( as this is likely already wrapped in markdown syntax in that case
const URL_REGEX =
    /\b(?<!\]\()https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;

const chatContainer = ref<HTMLElement | null>(null);
const expanded = ref(false);
const enlargedUrl = ref<string | null>(null);
const dialog = ref<HTMLDialogElement | null>(null);
const textInput = ref<HTMLTextAreaElement | null>(null);
const messagesSeenCount = ref(chatState.raw.messages.length);

async function toggleChat(): Promise<void> {
    expanded.value = !expanded.value;
    const messageLength = chatState.raw.messages.length;
    if (expanded.value) {
        await nextTick();
        if (messagesSeenCount.value < messageLength) {
            messagesSeenCount.value = messageLength;
            scrollToBottom();
        }
        textInput.value?.focus();
    }
}

// MutationObserver to detect new images and add onload & onClick handlers

const observer = new MutationObserver(mutationHandler);

function mutationHandler(childList: MutationRecord[]): void {
    for (const child of childList) {
        if (child.addedNodes.length === 0) continue;
        for (const add of child.addedNodes) {
            if (add instanceof HTMLElement) {
                const img = add.querySelector("img");
                if (img) {
                    img.onload = scrollToBottom;
                    img.onclick = () => showDialog(img.src);
                }
            }
        }
    }
}

onMounted(() => {
    observer.observe(chatContainer.value!, { childList: true, subtree: true });
});

// Scroll to bottom when new messages are added

watch(
    () => chatState.reactive.messages,
    async (newData) => {
        if (expanded.value && newData.length !== messagesSeenCount.value) {
            messagesSeenCount.value = chatState.raw.messages.length;
            await nextTick();
            scrollToBottom();
        }
    },
    { deep: true },
);

function scrollToBottom(): void {
    const chatContainer = document.getElementById("chat-container");
    chatContainer?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
}

// Dialog handling

function showDialog(url: string): void {
    enlargedUrl.value = url;
    dialog.value?.showModal();
}

function closeDialog(): void {
    enlargedUrl.value = null;
    dialog.value?.close();
}

// Core message handling & parsing

function* parseMessage(data: string): Generator<string> {
    const urlHits = [...data.matchAll(URL_REGEX)];

    yield data.slice(0, urlHits[0]?.index);
    for (let i = 0; i < urlHits.length; i++) {
        yield urlHits[i]![0];
        yield data.slice(urlHits[i]!.index + urlHits[i]![0].length, urlHits[i + 1]?.index);
    }
}

function handleMessage(event: KeyboardEvent): void {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const data = [...parseMessage(input.value)];

    input.value = "";

    chatSystem.addMessage(uuidv4(), playerSystem.getCurrentPlayer()?.name ?? "?", data, true);
}
</script>

<template>
    <dialog v-show="enlargedUrl" ref="dialog" @click="closeDialog">
        <img v-if="enlargedUrl" :src="enlargedUrl" alt="Enlarged chat image" />
    </dialog>
    <div id="chat" :class="{ collapsed: !expanded }">
        <div id="chat-title" @click="toggleChat">
            <div>
                {{ t("game.ui.chat.title") }}
                <span v-show="chatState.raw.messages.length > messagesSeenCount">
                    ({{ chatState.raw.messages.length - messagesSeenCount }})
                </span>
            </div>
            <font-awesome-icon v-show="expanded" icon="chevron-down" title="Collapse chat" @click.stop="toggleChat" />
        </div>
        <div v-show="expanded" id="chat-container" ref="chatContainer">
            <template
                v-for="[i, message] of chatState.reactive.messages.entries()"
                :key="`${i}-${message.content.length}`"
            >
                <div class="author">{{ message.author }}</div>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div class="message" v-html="message.content"></div>
            </template>
            <template v-if="chatState.reactive.messages.length === 0">
                <div></div>
                <div style="font-style: italic">{{ t("game.ui.chat.no_messages") }}</div>
            </template>
        </div>
        <textarea v-show="expanded" ref="textInput" @keydown.enter="handleMessage" />
    </div>
</template>

<style scoped lang="scss">
dialog {
    position: absolute;
    z-index: 1;
    pointer-events: auto;

    img {
        max-width: 80vw;
        max-height: 80vh;
    }
}

#chat {
    display: flex;
    flex-direction: column;

    width: 25rem;
    min-width: 20rem;
    max-width: 75vw;

    margin-left: 1.5rem;

    background-color: lightblue;
    border-radius: 0.75rem;
    border: solid 2px lightblue;

    pointer-events: auto;

    opacity: 0.75;

    resize: horizontal;
    overflow: auto;

    &.collapsed {
        min-width: 7.5rem;
        width: 7.5rem;
    }

    &:hover,
    &:focus-within {
        opacity: 1;
        z-index: 1;
    }

    #chat-title {
        display: flex;
        justify-content: space-between;
        align-items: center;

        padding: 0.25rem 1rem;

        font-weight: bold;

        &:hover {
            cursor: pointer;
        }

        svg {
            padding: 0.25rem;

            &:hover {
                background-color: lightgray;
                border-radius: 5rem;
            }
        }
    }

    #chat-container {
        display: grid;
        grid-template-columns: 5rem minmax(15rem, 1fr);

        gap: 0.5rem;
        padding: 1rem;
        padding-right: 0;

        border-top-left-radius: 0.75rem;
        border-top-right-radius: 0.75rem;
        background-color: aliceblue;

        max-height: 35rem;
        overflow-y: scroll;
        overflow-x: hidden;
        overflow-wrap: anywhere;

        .author {
            font-weight: bold;
        }

        .message {
            margin-right: 3rem;

            :deep(p) {
                &:first-child {
                    margin-top: 0;
                }
                &:last-child {
                    margin-bottom: 0;
                }
            }

            :deep(img) {
                max-width: 100%;

                &:hover {
                    cursor: pointer;
                }
            }
        }
    }

    textarea {
        margin: 0.5rem;
        padding: 0.5rem;
        resize: none;
        border-radius: 0.5rem;
        height: 2.2rem;
    }
}
</style>
