<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, type Component, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "vue-toastification";

import type { ApiModMeta, ApiRoomMod } from "../../../apiTypes";
import Modal from "../../../core/components/modals/Modal.vue";
import { http } from "../../../core/http";
import {
    devModsActive,
    disabledDevModTags,
    loadedModId,
    loadedMods,
    roomMods,
    setDevModEnabled,
    setRoomModEnabled,
} from "../../../mods";
import {
    sendLinkModToRoom,
    sendReloadDevMods,
    sendRemoveModFromRoom,
    sendSetRoomModEnabled,
    sendSyncDevModActiveState,
} from "../../api/emits/mods";

defineProps<{ global: boolean; tabSelected: ComputedRef<string> }>();

const { t } = useI18n();
const toast = useToast();

const uploadInput = useTemplateRef<HTMLInputElement>("uploadInput");
const selectedName = ref<string>();
const settingsId = ref<string>();

const modEntry = computed(() => loadedMods.value.find((mod) => mod.id === settingsId.value));
const settingsComponent = computed((): Component | undefined => modEntry.value?.mod.ui?.dmModSettings?.component);

watch(settingsComponent, (component) => {
    if (settingsId.value !== undefined && component === undefined) settingsId.value = undefined;
});

function onFileChange(): void {
    selectedName.value = uploadInput.value?.files?.[0]?.name;
}

function addMod(): void {
    const file = uploadInput.value?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", async (event) => {
        const data = event.target?.result as ArrayBuffer | null;
        if (data) {
            const response = await http.post("/api/mod/upload", data);
            if (response.status === 200) {
                const mod = (await response.json()) as ApiModMeta;
                sendLinkModToRoom({
                    tag: mod.tag,
                    version: mod.version,
                    hash: mod.hash,
                });
                toast.success("Mod added successfully.");
            } else {
                toast.error(await response.text(), { timeout: false });
            }
        }
        uploadInput.value!.value = "";
        selectedName.value = undefined;
    });
    reader.readAsArrayBuffer(file);
}

function removeMod(meta: ApiModMeta): void {
    sendRemoveModFromRoom({
        tag: meta.tag,
        version: meta.version,
        hash: meta.hash,
    });
}

function syncDevModState(): void {
    sendSyncDevModActiveState({ disabled: disabledDevModTags() });
}

function modSettings(mod: ApiRoomMod): Component | undefined {
    return loadedMods.value.find((loaded) => loaded.id === loadedModId(mod))?.mod.ui?.dmModSettings?.component;
}

function openSettings(mod: ApiRoomMod): void {
    if (modSettings(mod) === undefined) return;
    settingsId.value = loadedModId(mod);
}

function closeSettings(): void {
    settingsId.value = undefined;
}

function setEnabled(mod: ApiRoomMod, enabled: boolean): void {
    if (mod.dev) {
        setDevModEnabled(mod.tag, enabled).catch((error: unknown) => {
            console.error("Failed to set dev mod enabled state", mod.tag, error);
        });
        return;
    }
    sendSetRoomModEnabled({
        tag: mod.tag,
        version: mod.version,
        hash: mod.hash,
        enabled,
    });
    setRoomModEnabled({ tag: mod.tag, version: mod.version, hash: mod.hash, enabled }).catch((error: unknown) => {
        console.error("Failed to set mod enabled state", mod.tag, error);
    });
}
</script>

<template>
    <div class="panel">
        <teleport to="#teleport-modals">
            <Modal
                v-if="!(modEntry?.mod.ui?.dmModSettings?.customModal ?? false)"
                :visible="settingsComponent !== undefined"
                :mask="false"
                @close="closeSettings"
            >
                <template #header="modal">
                    <div class="modal-header" draggable="true" @dragstart="modal.dragStart" @dragend="modal.dragEnd">
                        <div>{{ modEntry?.meta.name }}</div>
                        <div class="header-close" :title="t('common.close')" @click="closeSettings">
                            <font-awesome-icon :icon="['far', 'window-close']" />
                        </div>
                    </div>
                </template>
                <div class="mod-settings-body">
                    <component :is="settingsComponent" v-if="settingsComponent" @close="closeSettings" />
                </div>
            </Modal>
            <component v-else :is="settingsComponent" @close="closeSettings" />
        </teleport>
        <em style="max-width: 40vw; grid-column: span 2">Mods are in an experimental phase. Use at your own risk.</em>
        <div class="spanrow header">Add new mod</div>
        <div class="row">
            <label>Mod file (.pam):</label>
            <div class="actions">
                <span class="filename" :class="{ empty: selectedName === undefined }">
                    {{ selectedName ?? "No file chosen" }}
                </span>
                <button type="button" @click="uploadInput?.click()">Choose file</button>
                <button type="button" :disabled="selectedName === undefined" @click="addMod">
                    {{ t("common.submit") }}
                </button>
                <input ref="uploadInput" type="file" accept=".pam" hidden @change="onFileChange" />
            </div>
        </div>
        <div v-if="devModsActive" class="row">
            <label>Development mods</label>
            <div class="actions dev-actions">
                <button type="button" title="Reload dev mods from disk" @click="sendReloadDevMods">
                    Reload dev mods
                </button>
                <button
                    type="button"
                    title="Sync enabled dev mods with other connected clients"
                    @click="syncDevModState"
                >
                    Sync active state
                </button>
            </div>
        </div>
        <div class="spanrow header">List of added mods</div>
        <template v-for="mod in roomMods" :key="loadedModId(mod)">
            <div class="row">
                <label :for="`mod-enabled-${loadedModId(mod)}`" :class="{ inactive: !mod.enabled }">
                    {{ mod.tag }} {{ mod.version }}<template v-if="mod.dev"> (dev)</template>
                </label>
                <div class="actions">
                    <font-awesome-icon
                        v-if="modSettings(mod)"
                        class="mod-settings"
                        icon="cog"
                        :title="t('game.ui.ui.open_settings')"
                        @click="openSettings(mod)"
                    />
                    <input
                        :id="`mod-enabled-${loadedModId(mod)}`"
                        type="checkbox"
                        :checked="mod.enabled"
                        :title="t('common.enabled')"
                        :aria-label="t('common.enabled')"
                        @change="setEnabled(mod, ($event.currentTarget as HTMLInputElement).checked)"
                    />
                    <font-awesome-icon v-if="!mod.dev" icon="trash-alt" @click="removeMod(mod)" />
                </div>
            </div>
            <div class="description" :class="{ inactive: !mod.enabled }">{{ mod.shortDescription }}</div>
        </template>
        <div v-if="roomMods.length === 0" class="spanrow">No mods added yet.</div>
    </div>
</template>

<style lang="scss" scoped>
.actions {
    justify-content: flex-end;
    gap: 0.5rem;
}

.dev-actions button {
    cursor: pointer;
}

.mod-settings {
    cursor: pointer;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 2rem 0.75rem 1rem;
    background-color: #ff7052;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 0.4rem;
    right: 0.5rem;
    cursor: pointer;
}

.mod-settings-body {
    padding: 1rem;
    min-width: 20rem;
    max-width: 40rem;
    max-height: 70vh;
    overflow: auto;
}

.filename {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 12rem;

    &.empty {
        color: #767676;
        font-style: italic;
    }
}

.description {
    grid-column: span 2;
    padding-left: 1rem;
    margin-top: 0;
    font-style: italic;
}

.inactive {
    opacity: 0.55;
}
</style>
