<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import VueMarkdown from "vue-markdown-render";

import {
    type CompendiumFolder,
    type IndexedEntry,
    type RuleRef,
    getEntry,
    listBooks,
    listLevel,
    ruleMarkdown,
    searchEntries,
    viewsAt,
} from "../../systems/compendium";
import { rulePlugins } from "../../systems/compendium/markdown";
import { ruleClick } from "../../systems/compendium/popover";
import { closeCompendium, compendiumOpen } from "../../systems/compendium/ui";

const emit = defineEmits<(e: "close" | "focus") => void>();
defineExpose({ close });
defineProps<{ modalIndex: number }>();

const { t } = useI18n();

const query = ref("");
const selectedRef = ref<RuleRef | undefined>();
const bookId = ref<string | undefined>();
const folder = ref<string[]>([]);
const viewName = ref<string | undefined>();
const groupLabel = ref<string | undefined>();

const searching = computed(() => query.value.trim().length > 0);
const books = computed(() => listBooks());
const book = computed(() => (books.value.some((item) => item.mod === bookId.value) ? bookId.value : undefined));
const views = computed(() => (book.value === undefined ? [] : viewsAt(book.value, folder.value)));
const view = computed(() => (views.value.some((item) => item.name === viewName.value) ? viewName.value : undefined));
const level = computed(() => {
    if (book.value === undefined) return undefined;
    const active = views.value.find((item) => item.name === view.value);
    return listLevel(
        book.value,
        folder.value,
        active === undefined ? undefined : { by: active.by, order: active.order, group: groupLabel.value },
    );
});
const results = computed(() => (searching.value ? searchEntries(query.value) : []));
const selected = computed(() => (selectedRef.value === undefined ? undefined : getEntry(selectedRef.value)));
const bookName = computed(() => books.value.find((item) => item.mod === book.value)?.name);

const crumbs = computed(() => {
    const items: { label: string; folder: string[] | undefined }[] = [
        { label: t("game.ui.compendium.title"), folder: undefined },
    ];
    if (bookName.value === undefined) return items;
    items.push({ label: bookName.value, folder: [] });
    for (let i = 0; i < folder.value.length; i++) {
        items.push({ label: folder.value[i]!, folder: folder.value.slice(0, i + 1) });
    }
    if (view.value !== undefined && groupLabel.value !== undefined) {
        items.push({ label: groupLabel.value, folder: [...folder.value] });
    }
    return items;
});

function close(): void {
    closeCompendium();
    emit("close");
}

function openCrumb(next: string[] | undefined): void {
    selectedRef.value = undefined;
    if (next === undefined) {
        bookId.value = undefined;
        folder.value = [];
        viewName.value = undefined;
        groupLabel.value = undefined;
        return;
    }
    const sameFolder =
        next.length === folder.value.length && next.every((segment, index) => segment === folder.value[index]);
    if (sameFolder) {
        groupLabel.value = undefined;
        return;
    }
    folder.value = next;
    viewName.value = undefined;
    groupLabel.value = undefined;
}

function openBook(mod: string): void {
    bookId.value = mod;
    folder.value = [];
    viewName.value = undefined;
    groupLabel.value = undefined;
}

function openFolder(item: CompendiumFolder): void {
    if (item.kind === "group") {
        groupLabel.value = item.name;
        return;
    }
    folder.value = [...folder.value, item.name];
    viewName.value = undefined;
    groupLabel.value = undefined;
}

function pickView(name: string | undefined): void {
    viewName.value = name;
    groupLabel.value = undefined;
}

function choose(entry: IndexedEntry): void {
    selectedRef.value = entry.ref;
}

async function copyLink(entry: IndexedEntry): Promise<void> {
    await navigator.clipboard.writeText(ruleMarkdown(entry));
}

function place(entry: IndexedEntry): string {
    return [entry.book, ...entry.path].join(" / ");
}
</script>

<template>
    <div v-show="compendiumOpen" id="compendium-container">
        <div id="compendium" @click="$emit('focus')">
            <font-awesome-icon id="close-compendium" :icon="['far', 'window-close']" @click="close" />
            <header>{{ t("game.ui.compendium.title") }}</header>
            <input v-model="query" type="search" :placeholder="t('game.ui.compendium.search')" />
            <nav v-if="!searching && crumbs.length > 1">
                <template v-for="(crumb, index) of crumbs" :key="index">
                    <span v-if="index > 0">/</span>
                    <button type="button" :disabled="index === crumbs.length - 1" @click="openCrumb(crumb.folder)">
                        {{ crumb.label }}
                    </button>
                </template>
            </nav>
            <div id="compendium-body" :class="{ split: selected !== undefined }">
                <div id="compendium-list">
                    <p v-if="searching && results.length === 0">{{ t("game.ui.compendium.empty") }}</p>
                    <template v-else-if="searching">
                        <button
                            v-for="entry of results"
                            :key="entry.ref"
                            type="button"
                            :class="{ selected: selected?.ref === entry.ref }"
                            @click="choose(entry)"
                        >
                            <span>{{ entry.name }}</span>
                            <small>{{ place(entry) }}</small>
                        </button>
                    </template>
                    <template v-else-if="book === undefined">
                        <p v-if="books.length === 0">{{ t("game.ui.compendium.empty") }}</p>
                        <button v-for="item of books" :key="item.mod" type="button" @click="openBook(item.mod)">
                            <span><font-awesome-icon icon="book" /> {{ item.name }}</span>
                            <small>{{ item.count }}</small>
                            <font-awesome-icon class="chevron" icon="chevron-right" />
                        </button>
                    </template>
                    <template v-else-if="level">
                        <div v-if="views.length > 0" id="compendium-views">
                            <button
                                type="button"
                                :class="{ selected: view === undefined }"
                                @click="pickView(undefined)"
                            >
                                {{ t("game.ui.compendium.alphabetical") }}
                            </button>
                            <button
                                v-for="item of views"
                                :key="item.name"
                                type="button"
                                :class="{ selected: view === item.name }"
                                @click="pickView(item.name)"
                            >
                                {{ item.name }}
                            </button>
                        </div>
                        <button
                            v-for="item of level.folders"
                            :key="`${item.kind}:${item.name}`"
                            type="button"
                            @click="openFolder(item)"
                        >
                            <span><font-awesome-icon icon="folder" /> {{ item.name }}</span>
                            <small>{{ item.count }}</small>
                            <font-awesome-icon class="chevron" icon="chevron-right" />
                        </button>
                        <button
                            v-for="entry of level.entries"
                            :key="entry.ref"
                            type="button"
                            :class="{ selected: selected?.ref === entry.ref }"
                            @click="choose(entry)"
                        >
                            <span>{{ entry.name }}</span>
                        </button>
                        <p v-if="level.folders.length === 0 && level.entries.length === 0">
                            {{ t("game.ui.compendium.empty") }}
                        </p>
                    </template>
                </div>
                <div v-if="selected" id="compendium-detail" @click="ruleClick">
                    <div id="compendium-detail-title">
                        <h2>{{ selected.name }}</h2>
                        <button type="button" @click="copyLink(selected)">
                            {{ t("game.ui.compendium.copy_link") }}
                        </button>
                    </div>
                    <p class="place">{{ place(selected) }}</p>
                    <VueMarkdown :source="selected.body" :plugins="rulePlugins" />
                </div>
            </div>
            <p id="compendium-hint">{{ t("game.ui.compendium.insert_hint") }}</p>
        </div>
    </div>
</template>

<style lang="scss">
#compendium-container {
    position: absolute;
    display: grid;
    justify-items: center;
    padding-top: 10vh;
    align-items: start;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
}

#compendium {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem 2rem;
    border-radius: 1rem;
    max-height: 80vh;
    width: min(65rem, 90vw);
    background-color: white;
    pointer-events: all;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    color: #222;

    #close-compendium {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        font-size: 1.25rem;
        cursor: pointer;
    }

    header {
        font-size: 1.4rem;
    }

    nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;

        button {
            border: none;
            background: transparent;
            padding: 0;
            color: #7a2940;
            cursor: pointer;

            &:disabled {
                color: inherit;
                cursor: default;
            }
        }
    }

    #compendium-body {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
        min-height: 0;
        overflow: hidden;

        &.split {
            grid-template-columns: 16rem 1fr;
        }
    }

    #compendium-list,
    #compendium-detail {
        overflow: auto;
        max-height: 50vh;
    }

    #compendium-views {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-bottom: 0.35rem;

        button {
            border: solid 1px #e4c9d0;
            border-radius: 1rem;
            background: transparent;
            padding: 0.15rem 0.65rem;
            color: #7a2940;
            cursor: pointer;

            &.selected {
                border-color: #7a2940;
                background: #7a2940;
                color: white;
            }
        }
    }

    #compendium-list > button {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        width: 100%;
        padding: 0.4rem 0.5rem;
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;

        &.selected,
        &:hover {
            background: #f3e4e8;
        }

        small,
        .chevron {
            color: #777;
        }

        small {
            margin-left: auto;
            white-space: nowrap;
        }
    }

    #compendium-detail-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h2 {
            margin: 0;
            flex: 1;
        }
    }

    .place,
    #compendium-hint {
        margin: 0;
        color: #666;
        font-size: 0.85rem;
    }
}
</style>
