<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";

import AssetPicker from "@/core/components/modals/AssetPicker.vue";
import Prompt from "@/core/components/modals/prompt.vue";

import { baseAdjust, baseAdjustedFetch, patchFetch } from "../core/utils";

import { RoomInfo } from "./types";

@Component({ components: { AssetPicker, Prompt } })
export default class SessionList extends Vue {
    @Prop() sessions!: RoomInfo[];
    @Prop() dmMode!: boolean;
    $refs!: {
        assetPicker: AssetPicker;
        prompt: Prompt;
    };

    notes = "";
    last_played?: string = "";
    private selectedIndex = 0;

    @Watch("selected")
    async onSelectedChange(): Promise<void> {
        await this.updateInfo();
    }

    get selected(): RoomInfo | undefined {
        if (this.sessions.length <= this.selectedIndex) return undefined;
        return this.sessions[this.selectedIndex];
    }

    async select(index: number): Promise<void> {
        this.selectedIndex = index;
        await this.updateInfo();
    }

    private async updateInfo(): Promise<void> {
        const response = await baseAdjustedFetch(`/api/rooms/${this.selected!.creator}/${this.selected!.name}/info`);
        const data = await response.json();
        this.notes = data.notes;
        this.last_played = data.last_played;
    }

    baseAdjust(src: string): string {
        return baseAdjust(src);
    }

    async rename(): Promise<void> {
        if (this.selected === undefined) return;

        const name = await this.$refs.prompt.prompt(
            "What should the new name be for this session?",
            this.$t("common.rename").toString(),
            (val) => ({
                valid: !this.sessions.some((s) => s.name === val),
                reason: this.$t("common.name_already_in_use").toString(),
            }),
        );
        if (name === undefined) return;
        const success = await patchFetch(`/api/rooms/${this.selected.creator}/${this.selected.name}`, { name });
        if (success.ok) {
            this.$emit("rename", this.selectedIndex, name);
        }
    }

    async setLogo(): Promise<void> {
        if (this.selected === undefined) return;

        const data = await this.$refs.assetPicker.open();
        if (data === undefined) return;
        const success = await patchFetch(`/api/rooms/${this.selected.creator}/${this.selected.name}`, {
            logo: data.id,
        });
        if (success.ok) {
            this.$emit("update-logo", this.selectedIndex, data.file_hash);
        }
    }

    async setNotes(event: { target: HTMLTextAreaElement }): Promise<void> {
        const text = event.target.value;
        const success = await patchFetch(`/api/rooms/${this.selected!.creator}/${this.selected!.name}/info`, {
            notes: text,
        });
        if (success.ok) {
            this.notes = text;
        }
    }
}
</script>

<template>
    <div id="content">
        <AssetPicker ref="assetPicker" />
        <Prompt ref="prompt" />

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
                <div class="logo">
                    <img :src="baseAdjust(room.logo ? `/static/assets/${room.logo}` : '/static/img/d20.svg')" />
                    <router-link
                        v-if="dmMode || !room.is_locked"
                        class="launch"
                        :to="'/game/' + encodeURIComponent(room.creator) + '/' + encodeURIComponent(room.name)"
                    >
                        <font-awesome-icon icon="play" />
                    </router-link>
                    <div v-else class="launch"><font-awesome-icon icon="lock" /></div>
                </div>
                <div class="name">{{ room.name }}</div>
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
            <router-link
                v-if="dmMode || !selected.is_locked"
                class="launch"
                :to="'/game/' + encodeURIComponent(selected.creator) + '/' + encodeURIComponent(selected.name)"
            >
                LAUNCH!
            </router-link>
            <div v-else class="launch">ROOM LOCKED</div>
            <div style="flex-grow: 1"></div>
            <div class="header">Last playtime</div>
            <div>{{ last_played ? last_played : "unknown" }}</div>
            <div style="flex-grow: 1"></div>
            <div class="header">Notes</div>
            <textarea style="flex-grow: 1" :value="notes" @change="setNotes"></textarea>
            <div style="flex-grow: 2"></div>
            <div class="leave">{{ dmMode ? "DELETE" : "LEAVE" }}</div>
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

        .bold {
            font-weight: bold;
        }

        .padding {
            padding-bottom: 10px;
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
            justify-content: center;
            align-items: center;
            min-height: 0;

            &.selected,
            &:hover {
                cursor: pointer;

                > .name {
                    background-color: #7c253e;
                }

                > .logo {
                    > img {
                        display: none;
                    }

                    > .launch {
                        display: block;
                    }
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
                z-index: 5;

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
