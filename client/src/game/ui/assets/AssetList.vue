<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { assetSystem } from "../../../assets";
import type { AssetId } from "../../../assets/models";
import { useAssetSearch } from "../../../assets/search";
import { socket } from "../../../assets/socket";
import { assetState } from "../../../assets/state";
import AssetListCore from "../../../assets/ui/AssetListCore.vue";
import AssetUploadProgress from "../../../assets/ui/AssetUploadProgress.vue";
import { assetGameSystem } from "../../systems/assets";
import { assetGameState } from "../../systems/assets/state";
import { closeAssetManager } from "../../systems/assets/ui";

const { t } = useI18n();

const assetsDialogFooter = ref<HTMLDivElement | null>(null);

const searchBar = ref<HTMLInputElement | null>(null);
const search = useAssetSearch(searchBar);

async function load(): Promise<void> {
    await assetSystem.loadFolder(assetState.currentFolder.value);
}

onMounted(async () => {
    if (socket.connected) {
        await load();
    } else {
        socket.connect();
        socket.once("connect", load);
    }
});

const shortcuts = computed(() => {
    const root = {
        name: t("assets.all_assets"),
        id: assetState.reactive.root,
    };
    const _shortcuts = assetGameState.reactive.shortcuts.map((id) => {
        const asset = assetState.reactive.idMap.get(id);
        return { name: asset?.name ?? "Unknown", id };
    });
    return [root, ..._shortcuts];
});

const activeShortcut = computed(() => assetState.currentFolder.value);

async function open(id: AssetId | undefined): Promise<void> {
    const target = id ?? assetState.reactive.root;
    if (target) await assetSystem.changeDirectory(target);
}

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

const contextAsset = computed(() => {
    if (assetState.reactive.selected.length !== 1) return undefined;
    if (assetState.raw.selected[0] === undefined) return undefined;
    return assetState.reactive.idMap.get(assetState.raw.selected[0]);
});

const canShortcut = computed(() => {
    if (assetState.reactive.selected.length !== 1) return false;
    if (contextAsset.value === undefined) return false;
    if (assetGameState.reactive.shortcuts.includes(contextAsset.value.id)) return false;
    return contextAsset.value.fileHash === null;
});

const canRemoveShortcut = computed(() => {
    if (assetState.reactive.selected.length !== 1) return false;
    if (contextAsset.value === undefined) return false;
    return assetGameState.reactive.shortcuts.includes(contextAsset.value.id);
});

function addToShortcuts(): boolean {
    if (contextAsset.value === undefined) return false;
    assetGameSystem.addShortcut(contextAsset.value.id);
    return true;
}

function removeFromShortcuts(): boolean {
    if (contextAsset.value === undefined) return false;
    assetGameSystem.removeShortcut(contextAsset.value.id);
    return true;
}

const extraContextSections = computed(() => {
    return [
        {
            title: t("assets.add_shortcut"),
            action: addToShortcuts,
            disabled: !canShortcut.value,
        },
        {
            title: t("assets.remove_shortcut"),
            action: removeFromShortcuts,
            disabled: !canRemoveShortcut.value,
        },
    ];
});

const canPick = computed(() => {
    const selection = assetState.reactive.selected[0];
    if (selection === undefined) return false;
    return (
        assetState.reactive.selected.length === 1 &&
        assetGameState.reactive.picker !== null &&
        assetState.reactive.idMap.get(selection)?.fileHash !== null
    );
});

function pickAsset(): void {
    assetGameState.raw.picker?.(assetState.raw.selected[0]!);
    closeAssetManager();
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
                    :key="shortcut.id"
                    :class="{ active: activeShortcut === shortcut.id }"
                    @click="open(shortcut.id)"
                >
                    {{ shortcut.name }}
                </div>
            </section>

            <AssetListCore
                font-size="8em"
                :search-results="search.results.value"
                :extra-context-sections="extraContextSections"
                @on-drag-end="onDragEnd"
                @on-drag-leave="onDragLeave"
                @on-drag-start="onDragStart"
            />

            <div v-if="assetGameState.reactive.picker !== null" id="asset-picker" class="asset-footer">
                <button @click="closeAssetManager">Cancel</button>
                <button :disabled="!canPick" @click="pickAsset">Pick</button>
            </div>

            <div class="asset-footer">
                <AssetUploadProgress />
            </div>

            <div id="drag-info-helper" ref="assetsDialogFooter" class="asset-footer">
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

.asset-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
    gap: 1rem;
}

#drag-info-helper {
    display: none;
    background-color: #92bbed;
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

#asset-picker {
    display: flex;
    justify-content: flex-end;

    button {
        height: 2rem;
        width: 10rem;
        border-radius: 0.5rem;
    }
}
</style>
