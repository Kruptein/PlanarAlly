<script setup lang="ts">
import { useTemplateRef } from "vue";

import { useAssetSearch } from "../search";

const searchBar = useTemplateRef("searchBar");
const search = useAssetSearch(searchBar);

defineExpose({ search });
</script>

<template>
    <div id="assets-search">
        <div>
            <font-awesome-icon icon="magnifying-glass" @click="searchBar?.focus()" />
            <div id="search-field">
                <input
                    ref="searchBar"
                    v-model="search.filter.value"
                    type="text"
                    placeholder="search through your assets.."
                />
                <font-awesome-icon
                    v-show="search.filter.value.length > 0"
                    id="clear-button"
                    icon="circle-xmark"
                    title="Clear Search"
                    @click.stop="search.clear"
                />
            </div>
        </div>
        <div v-if="search.filter.value.length >= 3" id="search-options">
            <input id="include-shared-assets" v-model="search.includeSharedAssets.value" type="checkbox" />
            <label for="include-shared-assets">Include shared assets</label>
        </div>
    </div>
</template>

<style scoped lang="scss">
#assets-search {
    margin: 1rem 0;
    position: relative;

    > div:first-of-type {
        position: relative;
        display: flex;
        align-items: center;
        height: 2.7rem;
        border: solid 2px black;
        border-radius: 1rem;

        > #kind-selector {
            flex-shrink: 0;
            height: calc(100% + 4px); // 2px border on top and bottom
            margin-left: -2px; // 2px border on left
            border-radius: 1rem;
            border: solid 2px black;
            outline: none;
            text-transform: capitalize;
            font-size: 1.25em;
            text-align-last: center;
            padding: 0 0.5em;
            background-color: rgba(238, 244, 255, 1);
            > option {
                background-color: rgba(245, 245, 245, 1);
            }
        }

        > svg:first-of-type {
            margin-left: 1rem;
        }

        > .shape-name {
            flex-shrink: 0;
            margin-left: 0.5rem;
            font-weight: bold;

            &:hover {
                text-decoration: line-through;
                cursor: pointer;
            }
        }

        > #search-field {
            flex-grow: 1;
            flex-shrink: 1;

            outline: none;
            border: none;
            border-radius: 1rem;

            display: flex;
            align-items: center;
            width: 100%;

            > input {
                padding: 0.5rem 1rem;
                outline: none;
                border: none;
                border-radius: 1rem;
                flex-grow: 1;

                font-size: 1.25em;
            }
            > #clear-button {
                border: 0;
                font-size: 1rem;
                cursor: pointer;
                margin-right: 1rem;
            }
        }
        > #search-options-icon {
            margin: 0 1rem;
        }

        #search-options-close-icon {
            position: absolute;
            right: 1rem;
            top: 0.7rem;
        }

        #search-filter {
            z-index: 1;
            position: absolute;
            top: -2px;
            right: -2px;

            display: grid;
            grid-template-columns: repeat(2, auto);
            gap: 0.5rem;

            padding: 1rem;
            padding-top: 2rem;
            border: solid 2px black;
            border-radius: 1rem;

            background-color: white;

            label {
                display: inline-block;
            }
        }
    }

    > #search-options {
        position: absolute;
        right: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: 1rem;
    }
}
</style>
