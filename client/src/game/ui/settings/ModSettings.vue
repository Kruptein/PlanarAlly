<script setup lang="ts">
import { useTemplateRef, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "vue-toastification";

import type { ApiModMeta } from "../../../apiTypes";
import { http } from "../../../core/http";
import { loadedMods, loadMod } from "../../../mods";
import { modEvents } from "../../../mods/events";
import { sendLinkModToRoom, sendRemoveModFromRoom } from "../../api/emits/mods";

defineProps<{ global: boolean; tabSelected: ComputedRef<string> }>();

const { t } = useI18n();
const toast = useToast();

const uploadInput = useTemplateRef<HTMLInputElement>("uploadInput");

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
                try {
                    // Load mod and initial calls it missed due to late loading
                    const modData = await loadMod(mod);
                    if (modData) {
                        await modEvents.gameOpened([modData]);
                        await modEvents.locationLoaded([modData]);
                    }
                } catch (error) {
                    console.error(`Failed to load mod ${mod.tag} ${mod.version} ${mod.hash}`, error);
                    toast.error(`Failed to load mod ${mod.tag} ${mod.version} ${mod.hash}`, {
                        timeout: false,
                    });
                }
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
    });
    reader.readAsArrayBuffer(file);
}

function removeMod(id: string, meta: ApiModMeta): void {
    sendRemoveModFromRoom({
        tag: meta.tag,
        version: meta.version,
        hash: meta.hash,
    });
    loadedMods.value = loadedMods.value.filter((mod) => mod.id !== id);
}
</script>

<template>
    <div class="panel">
        <em style="max-width: 40vw; grid-column: span 2">Mods are in an experimental phase. Use at your own risk.</em>
        <div class="spanrow header">Add new mod</div>
        <div class="row">
            <label>Mod file (.pam):</label>
            <div style="display: flex; flex-direction: column">
                <input ref="uploadInput" type="file" accept=".pam" />
                <button @click="addMod">{{ t("common.submit") }}</button>
            </div>
        </div>
        <div class="spanrow header">List of added mods</div>
        <template v-for="mod in loadedMods" :key="mod.id">
            <div class="row">
                <label>{{ mod.meta.tag }} {{ mod.meta.version }}</label>
                <div>
                    <!-- <button class="toggle" :aria-pressed="true" @click="toggle"></button> -->
                    <font-awesome-icon icon="trash-alt" @click="removeMod(mod.id, mod.meta)" />
                </div>
            </div>
            <div class="description">{{ mod.meta.shortDescription }}</div>
        </template>
        <div v-if="loadedMods.length === 0" class="spanrow">No mods added yet.</div>
    </div>
</template>

<style lang="scss" scoped>
.description {
    grid-column: span 2;
    padding-left: 1rem;
    margin-top: 0;
    font-style: italic;
}

// .toggle {
//     display: block;
//     box-sizing: border-box;
//     border: none;
//     color: inherit;
//     background: none;
//     font: inherit;
//     line-height: inherit;
//     text-align: left;
//     padding: 0.4em 0 0.4em 4em;
//     position: relative;
//     outline: none;
//     height: 2rem;

//     &:hover {
//         &::before {
//             box-shadow: 0 0 0.5em #333;
//         }

//         &::after {
//             background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='rgba(0,0,0,.25)'/%3E%3C/svg%3E");
//             background-size: 30%;
//             background-repeat: no-repeat;
//             background-position: center center;
//         }
//     }

//     &::before,
//     &::after {
//         content: "";
//         position: absolute;
//         height: 1.1em;
//         transition: all 0.25s ease;
//     }

//     &::before {
//         left: 0;
//         top: 0.2em;
//         width: 2.6em;
//         border: 0.2em solid #767676;
//         background: #767676;
//         border-radius: 1.1em;
//     }

//     &::after {
//         left: 0;
//         top: 0.25em;
//         background-color: #fff;
//         background-position: center center;
//         border-radius: 50%;
//         width: 1.1em;
//         border: 0.15em solid #767676;
//     }

//     &[aria-pressed="true"] {
//         &::after {
//             left: 1.6em;
//             border-color: #36a829;
//             color: #36a829;
//         }

//         &::before {
//             background-color: #36a829;
//             border-color: #36a829;
//         }
//     }
// }
</style>
