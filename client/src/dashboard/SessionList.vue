<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { baseAdjust, http } from "../core/http";
import { useModal } from "../core/plugins/modals/plugin";
import { getValue } from "../core/utils";
import { router } from "../router";
import { coreStore } from "../store/core";

import { socket } from "./socket";
import type { RoomInfo } from "./types";

const props = defineProps<{
    dmMode: boolean;
    sessions: RoomInfo[];
}>();
const emit = defineEmits(["remove-room", "rename", "update-logo"]);

const { t } = useI18n();
const modals = useModal();

const notes = ref("");
const lastPlayed = ref("");
const selectedIndex = ref(0);

const selected = computed(() => {
    if (props.sessions.length <= selectedIndex.value) return undefined;
    return props.sessions[selectedIndex.value];
});

// This is neded for the Create tab that is mounted later
onMounted(async () => {
    if (props.sessions.length > 0) await updateInfo();
});
// This is needed for the Play tab that is immediately mounted without props.sessions
watch(selected, async () => updateInfo());

async function select(index: number): Promise<void> {
    selectedIndex.value = index;
    await updateInfo();
}

async function open(session: RoomInfo): Promise<void> {
    coreStore.setLoading(true);
    await router.push(`/game/${encodeURIComponent(session.creator)}/${encodeURIComponent(session.name)}`);
}

async function updateInfo(): Promise<void> {
    const response = await http.get(`/api/rooms/${selected.value!.creator}/${selected.value!.name}/info`);
    const data = await response.json();
    notes.value = data.notes;
    lastPlayed.value = data.last_played;
}

async function rename(): Promise<void> {
    if (selected.value === undefined) return;

    const name = await modals.prompt(
        "What should the new name be for this session?",
        t("common.rename").toString(),
        (val) => ({
            valid: !props.sessions.some((s) => s.name === val),
            reason: t("common.name_already_in_use").toString(),
        }),
    );
    if (name === undefined) return;
    const success = await http.patchJson(`/api/rooms/${selected.value.creator}/${selected.value.name}`, { name });
    if (success.ok) {
        emit("rename", selectedIndex.value, name);
    }
}

async function setLogo(): Promise<void> {
    if (selected.value === undefined) return;

    const data = await modals.assetPicker();
    if (data === undefined) return;
    const success = await http.patchJson(`/api/rooms/${selected.value.creator}/${selected.value.name}`, {
        logo: data.id,
    });
    if (success.ok) {
        emit("update-logo", selectedIndex.value, data.file_hash);
    }
}

async function setNotes(text: string): Promise<void> {
    if (selected.value === undefined) return;

    const success = await http.patchJson(`/api/rooms/${selected.value.creator}/${selected.value.name}/info`, {
        notes: text,
    });
    if (success.ok) {
        notes.value = text;
    }
}

async function leaveOrDelete(): Promise<void> {
    if (selected.value === undefined) return;

    const actionWord = props.dmMode ? "Removing" : "Leaving";
    const answer = await modals.confirm(`${actionWord} ${selected.value.name}!`, "Are you sure?");
    if (answer !== true) return;
    const response = await http.delete(`/api/rooms/${selected.value.creator}/${selected.value.name}`);
    if (response.ok) {
        emit("remove-room", selectedIndex.value);
    }
}

function exportCampaign(): void {
    if (selected.value === undefined) return;

    socket.emit("Campaign.Export", selected.value.name);
}
</script>

<template>
    <div id="content">
        <div v-if="sessions.length === 0" id="empty">
            <img :src="baseAdjust('/static/img/d20-fail.svg')" />
            <div class="padding bold">OOF, That's a critical one!</div>
            <div class="padding">No active campaigns found!</div>
            <div class="bold">Are you a DM?</div>
            <div>See all your sessions in the run menu!</div>
            <div class="padding">OR start a new campaign with create!</div>
            <div class="bold">A player instead?</div>
            <div>Wait on an invite link from your DM!</div>
        </div>

        <div v-else id="sessions">
            <div v-for="(room, i) in sessions" :key="i" :class="{ selected: i === selectedIndex }" @click="select(i)">
                <div class="name">{{ room.name }}</div>
                <div class="logo">
                    <img :src="baseAdjust(room.logo ? `/static/assets/${room.logo}` : '/static/img/d20.svg')" />
                    <div v-if="dmMode || !room.is_locked" class="launch" @click="open(room)">
                        <font-awesome-icon icon="play" />
                    </div>
                    <div v-else class="launch"><font-awesome-icon icon="lock" /></div>
                </div>
            </div>
        </div>
        <div id="details" v-if="selected">
            <div class="logo" :class="{ dmMode }">
                <img :src="baseAdjust(selected.logo ? `/static/assets/${selected.logo}` : '/static/img/d20.svg')" />
                <div class="edit" v-if="dmMode" @click="setLogo"><font-awesome-icon icon="pencil-alt" /></div>
            </div>
            <div class="name">
                {{ selected.name }}
                <font-awesome-icon v-if="dmMode" @click="rename" icon="pencil-alt" />
            </div>
            <div class="creator">by {{ selected.creator }}</div>
            <div v-if="dmMode || !selected.is_locked" class="launch" @click="open(selected!)">LAUNCH!</div>
            <div v-else class="launch">ROOM LOCKED</div>
            <div :style="{ flexGrow: 1 }"></div>
            <div class="header">Last playtime</div>
            <div>{{ lastPlayed ? lastPlayed : "unknown" }}</div>
            <div :style="{ flexGrow: 1 }"></div>
            <div class="header">Notes</div>
            <textarea :style="{ flexGrow: 1 }" :value="notes" @change="setNotes(getValue($event))"></textarea>
            <div :style="{ flexGrow: 2 }"></div>
            <div class="leave" v-if="dmMode" @click="exportCampaign">EXPORT</div>
            <div class="leave" @click="leaveOrDelete">{{ dmMode ? "DELETE" : "LEAVE" }}</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#content {
    grid-area: content;
    display: flex;
    overflow-y: auto;

    #empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        margin: auto;
        padding: 50px;

        background-color: #7c253e;
        color: white;

        font-size: 20px;

        > div {
            padding-bottom: 10px;
        }

        .bold {
            font-weight: bold;
        }

        .padding {
            padding-bottom: 20px;
        }

        img {
            filter: invert(100%) sepia(0%) saturate(6492%) hue-rotate(348deg) brightness(107%) contrast(99%);
            width: 10vw;
        }
    }

    #sessions {
        display: grid;
        flex-grow: 1;
        grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));
        grid-auto-rows: 15vh;
        row-gap: 2em;
        margin-top: 5em;
        overflow-y: auto;

        > div {
            display: flex;
            // This prevents us from having to deal with z-indices
            flex-direction: row-reverse;
            justify-content: center;
            align-items: center;
            min-height: 0;

            &:hover,
            &.selected {
                cursor: pointer;

                > .name {
                    background-color: #7c253e;
                }
            }

            &.selected > .logo,
            .logo:hover {
                > img {
                    display: none;
                }

                > .launch {
                    display: block;
                }
            }

            > .name {
                display: flex;
                justify-content: center;
                align-items: center;

                border: solid 2px #7c253e;
                border-top-right-radius: 25px;
                border-bottom-right-radius: 25px;
                border-left: none;

                height: calc(7em - 40px);
                padding-left: 4.5em;
                padding-right: 1.5em;
                margin-left: -3.5em;

                width: 150px;

                font-size: 20px;
                font-weight: bold;
                color: white;
                background-color: #9c455e;
            }

            > .logo {
                width: 7em;
                height: 7em;
                border: solid 3px #7c253e;
                border-radius: 7em;
                color: rgb(43, 43, 43);

                display: flex;
                justify-content: center;
                align-items: center;

                background-color: white;

                img {
                    width: 7em;
                    height: 7em;
                    border-radius: 7em;
                }

                > .launch {
                    display: none;

                    font-weight: bold;
                    font-size: 40px;
                }

                &:hover {
                    color: white;
                    background-color: rgb(43, 43, 43);
                }
            }
        }
    }

    #details {
        box-shadow: 10px 0 50px #7c253e;
        background-color: #7c253e;
        color: white;

        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 5em;

        width: 20vw;

        .logo {
            height: 12vw;
            position: relative;

            img {
                // top: -1vw;
                // height: 12vw;
                left: calc(50% - 6.1vw);
                top: calc(50% - 7vw);
                width: 12vw;
                height: 12vw;
                position: absolute;
                border-radius: 6vw;
            }

            &::before {
                content: "";
                background-color: white;
                position: absolute;
                left: calc(50% - 6.1vw);
                top: calc(50% - 7vw);
                width: 12vw;
                height: 12vw;
                border-radius: 6vw;
            }

            > .edit {
                display: none;
            }

            &:hover > .edit {
                position: absolute;
                left: calc(50% - 6.1vw);
                top: calc(50% - 7vw);

                background-color: rgba(43, 43, 43, 0.6);
                height: 12vw;
                width: 12vw;
                border-radius: 6vw;

                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 3vw;

                cursor: pointer;
            }

            // &.dmMode:hover {
            // }
        }

        .name {
            font-size: 30px;
            font-weight: bold;
        }

        .launch,
        .leave {
            font-size: 20px;
            font-weight: bold;

            padding: 15px;

            border: solid 5px rgb(43, 43, 43);
            background-color: rgb(43, 43, 43);

            &:hover {
                cursor: pointer;

                // color: rgb(43, 43, 43);
                // background-color: white;
                background-color: #9c455e;
            }
        }

        .launch {
            margin-top: 30px;
            text-decoration: none;
        }

        .leave {
            margin-bottom: 50px;
        }

        .header {
            font-size: 20px;
            font-style: italic;
        }

        textarea {
            color: white;
            background-color: #9c455e;
            // border: solid 5px rgb(43, 43, 43);
            width: 10vw;
            height: 10vh;
            padding: 5px;
        }
    }
}
</style>
