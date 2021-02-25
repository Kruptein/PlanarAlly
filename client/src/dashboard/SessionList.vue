<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import { baseAdjust } from "../core/utils";

@Component
export default class SessionList extends Vue {
    @Prop() sessions!: [string, string][];

    private selectedIndex = 0;

    get selected(): string[] {
        if (this.sessions.length <= this.selectedIndex) return [];
        return this.sessions[this.selectedIndex];
    }

    baseAdjust(src: string): string {
        return baseAdjust(src);
    }
}
</script>

<template>
    <div id="content">
        <div id="sessions">
            <div
                v-for="(room, i) in sessions"
                :key="i"
                :class="{ selected: i === selectedIndex }"
                @click="selectedIndex = i"
            >
                <div class="logo">
                    <img :src="baseAdjust('/static/img/d20.svg')" />
                    <router-link
                        class="launch"
                        :to="'/game/' + encodeURIComponent(room[1]) + '/' + encodeURIComponent(room[0])"
                    >
                        <font-awesome-icon icon="play" />
                    </router-link>
                </div>
                <div class="name">{{ room[0] }}</div>
            </div>
        </div>
        <div id="details">
            <div class="logo">
                <img :src="baseAdjust('/static/img/d20.svg')" />
            </div>
            <div class="name">{{ selected[0] }}</div>
            <div class="creator">by {{ selected[1] }}</div>
            <router-link
                class="launch"
                :to="'/game/' + encodeURIComponent(selected[1]) + '/' + encodeURIComponent(selected[0])"
            >
                LAUNCH!
            </router-link>
            <div style="flex-grow: 1"></div>
            <div class="header">Last playtime</div>
            <div>2020/5/2</div>
            <div style="flex-grow: 1"></div>
            <div class="header">Notes</div>
            <textarea style="flex-grow: 1"></textarea>
            <div style="flex-grow: 2"></div>
            <div class="leave">LEAVE</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#content {
    grid-area: content;
    display: flex;
    overflow-y: auto;

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
                border: solid 1px #7c253e;
                border-radius: 7em;
                color: rgb(43, 43, 43);

                display: flex;
                justify-content: center;
                align-items: center;

                background-color: white;
                z-index: 5;

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
                height: 10vw;
                position: relative;
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
