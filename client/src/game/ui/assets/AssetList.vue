<script setup lang="ts">
import { ref } from "vue";

import { useAssetSearch } from "../../../assets/search";
import AssetListCore from "../../../assets/ui/AssetListCore.vue";
import { closeAssetManager } from "../../systems/assets/ui";

const shortcuts = ref(["All Assets", "SKT", "DND"]);
const activeShortcut = ref("All Assets");
const assetsDialogFooter = ref<HTMLDivElement | null>(null);

const searchBar = ref<HTMLInputElement | null>(null);
const search = useAssetSearch(searchBar);

function setLayersBackground(color: string): void {
    const layers = document.getElementById("layers")!;
    layers.style.background = color;
    layers.style.opacity = color === "unset" ? "1" : "0.5";
}

function onDragStart(event: DragEvent): void {
    setLayersBackground("#92bbed");
    assetsDialogFooter.value!.style.display = "flex";
}

function onDragEnd(event: DragEvent): void {
    setLayersBackground("unset");
    assetsDialogFooter.value!.style.display = "none";
}

function onDragLeave(event: DragEvent): void {
    const fromElement = event.target as HTMLElement;
    const toElement = event.relatedTarget as HTMLElement;

    if (fromElement.id === "assets" && !fromElement.contains(toElement)) {
        closeAssetManager();
        setLayersBackground("unset");
    }
}
</script>

<template>
    <header>
        <div>ASSETS</div>
    </header>
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
    </div>
    <div id="assets-dialog-body" style="display: flex; overflow: hidden">
        <div v-if="search.results.value.length === 0 && search.filter.value.length > 0" id="assets-loading">
            <template v-if="search.loading.value">
                <div class="loader"></div>
                <div>Fetching data...</div>
            </template>
            <template v-else>
                <div>No results found for "{{ search.filter.value }}". Ensure you type at least 3 characters.</div>
            </template>
        </div>
        <template v-else>
            <section id="assets-shortcuts">
                <div
                    v-for="shortcut of shortcuts"
                    :key="shortcut"
                    :class="{ active: activeShortcut === shortcut }"
                    @click="activeShortcut = shortcut"
                >
                    {{ shortcut }}
                </div>
            </section>

            <AssetListCore
                font-size="8em"
                :search-results="search.results.value"
                @on-drag-end="onDragEnd"
                @on-drag-leave="onDragLeave"
                @on-drag-start="onDragStart"
            />

            <div id="assets-dialog-footer" ref="assetsDialogFooter">
                <font-awesome-icon icon="map-location-dot" />
                To drop assets on the map, drag them outside of this modal!
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
header {
    position: relative;
    display: flex;

    > :first-child {
        flex-grow: 1;
        margin-right: 1rem;
        border-bottom: solid 1px black;
        font-weight: bold;
        font-size: 1.75em;
    }
}

#assets-search {
    margin: 1rem 0;
    position: relative;

    > div {
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
}

#assets-shortcuts {
    width: 7.5rem;
    margin-right: 1rem;

    display: flex;
    flex-direction: column;
    align-items: center;

    > div {
        width: 100%;
        text-align: center;
        padding: 0.5rem 0;

        &.active {
            background-color: #666;
            color: white;
        }

        &:hover {
            background-color: #666;
            color: white;
            cursor: pointer;
        }
    }
}

#assets-dialog-footer {
    display: none;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background-color: #92bbed;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
    gap: 1rem;
}

#assets-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.loader {
    display: inline-block;
    width: 2rem;
    height: 2rem;

    border: 5px solid #a82929;
    border-bottom-color: transparent;
    border-radius: 50%;

    animation: rotation 1s linear infinite;
}

@keyframes rotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
