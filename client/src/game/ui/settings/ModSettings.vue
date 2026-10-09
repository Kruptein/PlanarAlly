<script setup lang="ts">
import { ref, useTemplateRef, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "vue-toastification";

import type { ApiModMeta, ApiRoomMod } from "../../../apiTypes";
import { http } from "../../../core/http";
import {
    devModsActive,
    disabledDevModTags,
    loadedModId,
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
