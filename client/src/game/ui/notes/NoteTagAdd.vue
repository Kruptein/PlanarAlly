<script setup lang="ts" generic="T extends PropertyKey">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModal } from "../../../core/plugins/modals/plugin";
import { noteSystem } from "../../systems/notes";
import { noteState } from "../../systems/notes/state";

import { customFilterOptions } from "./noteFilters";

const { t } = useI18n();
const modals = useModal();

const searchQuery = ref("");
const isOpen = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

const filteredOptions = computed(() => {
    if (!searchQuery.value.trim()) {
        return customFilterOptions.tags;
    }
    const query = searchQuery.value.toLowerCase();
    return customFilterOptions.tags.filter((option) => option.toLowerCase().includes(query));
});

function openDropdown(): void {
    if (isOpen.value) {
        closeDropdown();
        return;
    }
    isOpen.value = true;
    searchQuery.value = "";
    setTimeout(() => {
        searchInput.value?.focus();
    }, 0);
}

function closeDropdown(): void {
    isOpen.value = false;
    searchQuery.value = "";
}

async function selectTag(option: string): Promise<void> {
    const noteId = noteState.raw.currentNote;
    if (!noteId) return;
    await noteSystem.addTag(noteId, option, true);
    closeDropdown();
}

async function addNewTag(): Promise<void> {
    const noteId = noteState.raw.currentNote;
    if (!noteId) return;
    const answer = await modals.prompt("Enter the name of the tag to add.", "New tag");
    if (answer !== undefined && answer.length > 0) await noteSystem.addTag(noteId, answer, true);
}

function onFocusOut(event: FocusEvent): void {
    if (!event.currentTarget) {
        closeDropdown();
        return;
    }
    const elem = event.currentTarget as HTMLDivElement;
    if (!elem.contains(event.relatedTarget as Node)) {
        closeDropdown();
    }
}
</script>

<template>
    <div id="note-tag-add">
        <div class="note-filter-dropdown" tabindex="0" @focusout="onFocusOut">
            <div :title="t('game.ui.notes.NoteEdit.add_tag')" @click="openDropdown">
                <font-awesome-icon icon="plus" />
            </div>
            <div v-show="isOpen" class="note-filter-menu">
                <div class="note-filter-options">
                    <div class="note-filter-option" @click="addNewTag">
                        {{ t("game.ui.notes.NoteEdit.add_new_tag") }}
                    </div>
                </div>
                <div class="note-filter-search">
                    <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Search options..." />
                </div>
                <div class="note-filter-options">
                    <div
                        v-for="option of filteredOptions"
                        :key="option"
                        class="note-filter-option"
                        @click="selectTag(option)"
                    >
                        {{ option }}
                    </div>
                    <div v-if="filteredOptions.length === 0" class="note-filter-no-results">No options found</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#note-tag-add {
    .note-filter-dropdown {
        position: relative;

        &:hover {
            background-color: #f5f5f5;
        }

        .note-filter-menu {
            position: absolute;
            width: 10rem;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 0.25rem;
            border: solid 1px black;
            border-radius: 0.25rem;
            background-color: white;
            box-shadow: 0 0.1rem 0.675rem 0 rgba(0, 0, 0, 0.5);
            z-index: 10;

            .note-filter-search {
                padding: 0.5rem;
                border-bottom: solid 1px #e0e0e0;

                input {
                    width: 100%;
                    padding: 0.25rem 0.5rem;
                    border: solid 1px #ccc;
                    border-radius: 0.25rem;
                    font-size: 0.9em;
                    outline: none;

                    &:focus {
                        border-color: lightblue;
                    }
                }
            }

            .note-filter-options {
                max-height: 200px;
                overflow-y: auto;

                .note-filter-option {
                    padding: 0.5rem;
                    cursor: pointer;
                    user-select: none;

                    display: flex;
                    align-items: center;
                    gap: 0.5rem;

                    &.is-selected {
                        background-color: lightgreen;
                    }

                    &.is-disabled {
                        opacity: 0.5;
                    }

                    &:hover,
                    &.is-active {
                        background-color: lightblue;
                    }
                }

                .note-filter-no-results {
                    padding: 0.5rem;
                    color: #999;
                    font-style: italic;
                    text-align: center;
                }
            }
        }
    }
}
</style>
