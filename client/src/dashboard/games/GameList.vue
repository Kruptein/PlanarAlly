<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { getImageSrcFromHash } from "../../assets/utils";
import { baseAdjust, getStaticImg, http } from "../../core/http";
import { useModal } from "../../core/plugins/modals/plugin";
import { getErrorReason } from "../../core/utils";
import { coreStore } from "../../store/core";
import { socket } from "../socket";

import type { RoomInfo } from "./types";
import { open } from "./utils";

const modals = useModal();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

type RoomInfoWithId = RoomInfo & { id: number };

interface SessionState {
    owned: RoomInfoWithId[];
    joined: RoomInfoWithId[];
    error: string;
    focussed?: RoomInfoWithId;
}

const state: SessionState = reactive({
    owned: [],
    joined: [],
    error: "",
});
const sort = ref<"clock" | "az" | "za">("clock");

watch(sort, () => {
    sortData(state.owned);
    sortData(state.joined);
});

function sortData(data: RoomInfoWithId[]): void {
    data.sort((a, b) => {
        if (sort.value === "clock") {
            if (a.last_played === null) return 1;
            if (b.last_played === null) return -1;
            return b.last_played.localeCompare(a.last_played);
        } else {
            return a.name.localeCompare(b.name) * (sort.value === "az" ? 1 : -1);
        }
    });
}

onMounted(async () => {
    if (route.params.error === "join_game") {
        await modals.confirm(
            "Failed to join session",
            "It was not possible to join the game session. This might be because the DM has locked the session.",
            { showNo: false, yes: "Ok" },
        );
    }

    const response = await http.get("/api/rooms");
    if (response.ok) {
        const data = (await response.json()) as { owned: RoomInfo[]; joined: RoomInfo[] };
        // Add an arbitrary id to each one to do some checks that survive sorting
        state.owned = data.owned.map((r, i) => ({ ...r, id: i }));
        state.joined = data.joined.map((r, i) => ({ ...r, id: -i - 1 }));
        sortData(state.owned);
        sortData(state.joined);
    } else {
        state.error = await getErrorReason(response);
    }
});

function focus(session: RoomInfoWithId): void {
    if (state.focussed?.id === session.id) {
        state.focussed = undefined;
    } else {
        state.focussed = session;
    }
}

async function rename(): Promise<void> {
    if (state.focussed === undefined) return;

    const name = await modals.prompt(
        "What should the new name be for this session?",
        t("common.rename").toString(),
        (val) => ({
            valid: !state.owned.some((s) => s.name === val),
            reason: t("common.name_already_in_use").toString(),
        }),
    );
    if (name === undefined) return;
    const success = await http.patchJson(`/api/rooms/${state.focussed.creator}/${state.focussed.name}`, { name });
    if (success.ok) {
        state.focussed.name = name;
    }
}

async function setLogo(): Promise<void> {
    if (state.focussed === undefined) return;

    const data = await modals.assetPicker();
    if (data === undefined) return;
    const success = await http.patchJson(`/api/rooms/${state.focussed.creator}/${state.focussed.name}`, {
        logo: data.id,
    });
    if (success.ok) {
        state.focussed.logo = data.fileHash ?? undefined;
    }
}

async function leaveOrDelete(): Promise<void> {
    if (state.focussed === undefined) return;

    const isOwner = state.focussed.creator === coreStore.state.username;
    if (isOwner) {
        const name = await modals.prompt(
            `Type the room name to confirm: ${state.focussed.name}`,
            "Removing Campaign",
            (val) => ({
                valid: val === state.focussed?.name,
                reason: "Room name does not match!",
            }),
        );
        if (name !== state.focussed.name) return;
    } else {
        const answer = await modals.confirm(`Leaving ${state.focussed.name}!`, "Are you sure?");
        if (answer !== true) return;
    }
    const response = await http.delete(`/api/rooms/${state.focussed.creator}/${state.focussed.name}`);
    if (response.ok) {
        if (isOwner) state.owned = state.owned.filter((s) => s !== state.focussed);
        else state.joined = state.joined.filter((s) => s !== state.focussed);
        state.focussed = undefined;
    }
}

async function exportCampaign(): Promise<void> {
    if (state.focussed === undefined) return;
    socket.emit("Campaign.Export", state.focussed.name);
    await router.push({ name: "export-game" });
}
</script>

<template>
    <div id="content">
        <div id="dm">
            <div class="title">
                <span>DUNGEON MASTER</span>
                <span @click="router.push({ name: 'create-game' })">NEW GAME +</span>
            </div>
            <div class="filters">
                <span>Sort:</span>
                <font-awesome-icon
                    icon="clock-rotate-left"
                    :class="{ selected: sort === 'clock' }"
                    @click="sort = 'clock'"
                />
                <font-awesome-icon icon="arrow-down-a-z" :class="{ selected: sort === 'az' }" @click="sort = 'az'" />
                <font-awesome-icon icon="arrow-down-z-a" :class="{ selected: sort === 'za' }" @click="sort = 'za'" />
            </div>
            <div class="sessions">
                <div
                    v-for="session of state.owned"
                    :key="session.creator + '-' + session.name"
                    :class="{ focus: state.focussed?.name === session.name }"
                    @click="focus(session)"
                >
                    <img
                        class="logo"
                        :src="
                            baseAdjust(
                                session.logo
                                    ? getImageSrcFromHash(session.logo, { addBaseUrl: false })
                                    : '/static/img/dice.svg',
                            )
                        "
                        alt="Campaign logo"
                    />
                    <div v-if="state.focussed?.name === session.name" class="logo-edit" @click.stop="setLogo">
                        <img :src="baseAdjust('/static/img/edit.svg')" alt="Edit" />
                    </div>
                    <div class="data">
                        <div class="name">{{ session.name }}</div>
                        <div class="played">
                            <span>LAST PLAYED:</span>
                            <span>{{ session.last_played ?? "unknown" }}</span>
                        </div>
                    </div>
                    <div class="edit" @click.stop="rename">
                        <img :src="baseAdjust('/static/img/edit.svg')" alt="Rename" />
                    </div>
                    <div class="actions">
                        <button @click.stop="open(session)">
                            <img :src="getStaticImg('play.svg')" alt="Play" />
                            LAUNCH
                        </button>
                        <button @click.stop="exportCampaign">
                            <font-awesome-icon icon="download" />
                            EXPORT
                        </button>
                        <button @click.stop="leaveOrDelete">
                            <img :src="getStaticImg('cross.svg')" alt="Remove" />
                            DELETE
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div id="player">
            <div class="title">
                <span>PLAYER</span>
                <span></span>
            </div>
            <div class="filters">
                <span>Sort:</span>
                <font-awesome-icon
                    icon="clock-rotate-left"
                    :class="{ selected: sort === 'clock' }"
                    @click="sort = 'clock'"
                />
                <font-awesome-icon icon="arrow-down-a-z" :class="{ selected: sort === 'az' }" @click="sort = 'az'" />
                <font-awesome-icon icon="arrow-down-z-a" :class="{ selected: sort === 'za' }" @click="sort = 'za'" />
            </div>
            <div class="sessions">
                <div
                    v-for="session of state.joined"
                    :key="session.id"
                    :class="{ focus: state.focussed?.id === session.id }"
                    @click="focus(session)"
                >
                    <img
                        class="logo"
                        :src="
                            baseAdjust(
                                session.logo
                                    ? getImageSrcFromHash(session.logo, { addBaseUrl: false })
                                    : '/static/img/dice.svg',
                            )
                        "
                        alt="Campaign logo"
                    />
                    <div class="data">
                        <div class="name">{{ session.name }}</div>
                        <div class="played">
                            <span>DM:</span>
                            <span>{{ session.creator }}</span>
                        </div>
                        <div class="played">
                            <span>LAST PLAYED:</span>
                            <span>{{ session.last_played ?? "unknown" }}</span>
                        </div>
                    </div>
                    <div class="edit"></div>
                    <div class="actions">
                        <button @click.stop="open(session)">
                            <img :src="getStaticImg('play.svg')" alt="Play" />
                            LAUNCH
                        </button>
                        <button @click.stop="leaveOrDelete">
                            <img :src="getStaticImg('cross.svg')" alt="Leave" />
                            LEAVE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#content {
    display: flex;
    flex-direction: column;
    width: 100%;

    .filters {
        display: flex;
        align-items: center;
        font-size: 1.3em;

        > span {
            margin-right: 1rem;
        }

        > svg {
            margin-right: 0.25rem;

            &.selected,
            &:hover {
                stroke: white;
                stroke-width: 1rem;
            }

            &:not(.selected) {
                color: lightgray;
            }
        }
    }

    #dm {
        margin-bottom: 2.5rem;
    }

    #dm,
    #player {
        background-color: rgba(77, 59, 64, 0.6);
        border-radius: 20px;
        padding: 3.75rem;
        padding-right: 2rem; // adjust for scroll bar

        min-height: 40vh;

        display: flex;
        flex-direction: column;

        .title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 3.125em;
            color: white;
            border-bottom: 5px solid #ffa8bf;
            font-weight: bold;

            > span:last-child {
                color: #ffa8bf;

                &:hover {
                    cursor: pointer;
                }
            }
        }

        .sessions {
            display: grid;
            grid-template-columns: repeat(auto-fit, 25em);
            grid-auto-rows: 6.25rem;
            gap: 3.125rem;
            height: inherit;
            margin-top: 0.5rem;
            padding-top: 1rem;
            z-index: 0; // force stacking context
            overflow: visible;

            > div {
                background-color: rgba(77, 59, 64, 1);
                box-shadow: 0 0 10px 0 rgba(6, 6, 6, 0.5);
                border-radius: 20px;
                display: grid;
                grid-template-areas: "logo data edit" "actions actions actions";
                position: relative;

                &:hover {
                    cursor: pointer;
                }

                .logo {
                    border-radius: 20px;
                    width: 6.25rem;
                    height: 6.25rem;
                    grid-area: logo;
                    background-color: white;
                }

                .logo-edit {
                    position: absolute;
                    top: -2rem;
                    left: 4rem;

                    &:hover {
                        cursor: pointer;
                    }
                }

                .data {
                    height: 6.25rem;
                    grid-area: data;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    margin-left: 1rem;

                    .name {
                        width: 12rem;
                        font-weight: bold;
                        font-size: 1.2em;
                    }

                    .played {
                        span:first-of-type {
                            color: #ffa8bf;
                            font-weight: bold;
                            margin-right: 0.3rem;
                        }
                    }
                }

                .edit {
                    height: 6.25rem;
                    visibility: hidden;
                    grid-area: edit;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;

                    img {
                        filter: drop-shadow(0 0 10px rgba(6, 6, 6, 0.5));
                    }
                }

                .actions {
                    grid-area: actions;
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    margin-top: 1.25rem;

                    > button {
                        width: 23.75rem;
                        height: 2.5rem;
                        margin-bottom: 1.25rem;
                        background-color: transparent;
                        border-radius: 10px;
                        color: white;
                        border: solid 3px rgb(190, 59, 64);
                        font-size: 1.25em;
                        display: flex;
                        justify-content: center;
                        align-items: center;

                        img,
                        svg {
                            width: 24px;
                            margin-right: 0.3rem;
                        }

                        &:hover {
                            cursor: pointer;
                            font-weight: bold;
                        }

                        &:first-of-type {
                            background-color: rgb(190, 59, 64);
                        }
                    }
                }

                &.focus {
                    height: 18rem;
                    z-index: 1;
                    overflow: visible;

                    &:hover {
                        cursor: default;
                    }

                    .edit {
                        visibility: visible;

                        &:hover {
                            cursor: pointer;
                        }
                    }

                    .actions {
                        height: 12.5rem;
                        display: flex;
                    }
                }
            }
        }
    }

    #player > .sessions > div.focus {
        height: 15rem;
        .actions {
            height: 12.5rem;
        }
    }
}
</style>
