<script setup lang="ts" generic="T extends PropertyKey">
import { computed, ref } from "vue";

import { NO_FILTER } from "../../systems/notes/types";

const props = defineProps<{
    label: string;
    options: {
        default: { label: string; value: T; disabled?: boolean }[];
        search?: { label: string; value: T; icon?: string }[];
    };
    disabled?: boolean;
    multiSelect: boolean;
}>();
const selected = defineModel<T[]>({ required: true });

const searchQuery = ref("");
const isOpen = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

const filteredOptions = computed(() => {
    if (props.options.search === undefined) {
        return [];
    }
    if (!searchQuery.value.trim()) {
        return props.options.search;
    }
    const query = searchQuery.value.toLowerCase();
    return props.options.search.filter((option) => option.label.toLowerCase().includes(query));
});

function openDropdown(): void {
    if (props.disabled) return;
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

function selectOption(option: T): void {
    if (props.multiSelect) {
        const arr = selected.value;
        if (option === NO_FILTER) {
            selected.value = [props.options.default[0]!.value];
        } else {
            let newArr = arr.filter((o) => o !== NO_FILTER);
            if (newArr.includes(option)) {
                newArr = arr.filter((o) => o !== option);
            } else {
                newArr.push(option);
            }
            if (newArr.length === 0) {
                newArr.push(NO_FILTER as T);
            }
            selected.value = newArr;
        }
    } else {
        selected.value = [option];
        closeDropdown();
    }
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
    <div class="note-filter" :class="{ disabled }">
        <div class="note-filter-dropdown" tabindex="0" @focusout="onFocusOut">
            <div class="note-filter-selected" @click="openDropdown">
                <span class="note-filter-label">{{ label }}:</span>
                <span class="note-filter-value">
                    {{
                        selected.length > 1
                            ? `${selected.length} selected`
                            : (options.default.find((o) => selected.includes(o.value))?.label ??
                              options.search?.find((o) => selected.includes(o.value))?.label ??
                              selected[0])
                    }}
                </span>
                <font-awesome-icon icon="chevron-down" class="chevron-icon" />
            </div>
            <div v-show="isOpen" class="note-filter-menu">
                <div class="note-filter-options">
                    <div
                        v-for="option of options.default"
                        :key="option.value"
                        class="note-filter-option"
                        :class="{
                            'is-selected': selected.includes(option.value),
                            'is-disabled': option.disabled,
                        }"
                        @click="selectOption(option.value)"
                    >
                        {{ option.label }}
                    </div>
                </div>
                <template v-if="options.search !== undefined && options.search.length > 0">
                    <div class="note-filter-search">
                        <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Search options..." />
                    </div>
                    <div class="note-filter-options">
                        <div
                            v-for="option of filteredOptions"
                            :key="option.value"
                            class="note-filter-option"
                            :class="{
                                'is-selected': selected.includes(option.value),
                            }"
                            @click="selectOption(option.value)"
                        >
                            <img v-if="option.icon" :src="option.icon" width="20px" height="20px" />
                            {{ option.label }}
                        </div>
                        <div v-if="filteredOptions.length === 0" class="note-filter-no-results">No options found</div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.note-filter {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    margin-right: 1rem;

    &.disabled {
        opacity: 0.5;

        &:hover * {
            cursor: not-allowed !important;
        }

        .note-filter-value {
            text-decoration: line-through;
        }
    }

    .note-filter-dropdown {
        position: relative;

        .note-filter-label {
            margin-right: 0.5rem;

            &::first-letter {
                text-transform: capitalize;
            }
        }

        .note-filter-selected {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.25rem 0.5rem;
            border: solid 1px black;
            border-radius: 0.25rem;
            background-color: white;
            font-size: 1em;
            cursor: pointer;
            user-select: none;

            &:hover {
                background-color: #f5f5f5;
            }

            .chevron-icon {
                margin-left: 0.5rem;
                font-size: 0.75em;
                opacity: 0.6;
            }

            .note-filter-value {
                flex-grow: 0;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
                max-width: 5vw;
            }
        }

        .note-filter-menu {
            position: absolute;
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
