<template>
    <main>
        <div id="title">{{ activeComponent.title }}</div>
        <nav>
            <div
                v-for="component in components"
                :key="component.nav"
                @click="setActiveComponent(component)"
                :class="{ active: activeComponent === component }"
            >
                {{ component.nav }}
            </div>
        </nav>
        <component :is="activeComponent.class" class="main" />
    </main>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import AccountSettings from "./account.vue";
import { Route, NavigationGuard } from "vue-router";

interface ActiveComponent {
    title: string;
    nav: string;
    class: typeof Vue;
}

@Component({
    components: {
        AccountSettings,
    },
})
export default class Settings extends Vue {
    components: ActiveComponent[] = [
        {
            title: "Account Settings",
            nav: "Account",
            class: AccountSettings,
        },
    ];
    activeComponent = this.components[0];

    setActiveComponent(component: ActiveComponent): void {
        if (this.activeComponent === component) return;
        this.activeComponent = component;
        this.$router.push({ name: "settings", params: { page: component.nav.toLowerCase() } });
    }

    beforeRouteEnter(to: Route, _from: Route, next: Parameters<NavigationGuard>[2]): void {
        next(vm => {
            if ("page" in to.params && to.params.page !== undefined) {
                for (const component of (<Settings>vm).components) {
                    if (component.nav.toLowerCase() === to.params.page.toLowerCase()) {
                        (<Settings>vm).activeComponent = component;
                    }
                }
            }
        });
    }
}
</script>

<style scoped>
* {
    -ms-box-sizing: border-box;
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
}

main {
    margin: auto;
    display: grid;
    grid-template-areas:
        "title title"
        "nav   main";
    /* "nav   main  main"; */
    grid-template-rows: 60px 1fr;
    grid-template-columns: 100px 1fr;
}

#title {
    grid-area: title;
    background: #ff7052;
    padding: 15px;
    color: #fff;
    font-size: 20px;
}

nav {
    grid-area: nav;
    background-color: lightblue;
}

nav > div {
    padding: 0.5em;
}

nav > div:hover {
    cursor: pointer;
    background-color: white;
}

nav > .active {
    background-color: white;
}

nav > .active:hover {
    cursor: default;
}

.main {
    background-color: white;
    grid-area: main;
    padding-left: 1em;
    padding-right: 1em;
    display: grid;
    grid-template-columns: [setting] 1fr [value] 1fr [end];
    /* align-items: center; */
    align-content: start;
    min-height: 10em;
}

.row {
    display: contents;
}

.row > *,
.panel > *:not(.row) {
    display: flex;
    /* justify-content: center; */
    align-items: center;
    padding: 0.5em;
}

.row:first-of-type > * {
    margin-top: 0.5em;
}

.row:last-of-type > * {
    margin-bottom: 0.5em;
}

.row:hover > * {
    cursor: pointer;
    text-shadow: 0px 0px 1px black;
}

.smallrow > * {
    padding: 0.2em;
}

.header {
    line-height: 0.1em;
    margin: 20px 0 15px;
    font-style: italic;
}
.header:after {
    position: relative;
    left: 5px;
    width: 100%;
    border-bottom: 1px solid #000;
    content: "";
}

.spanrow {
    grid-column: 1 / end;
}

.danger {
    color: #ff7052;
}

.danger:hover {
    text-shadow: 0px 0px 1px #ff7052;
    cursor: pointer;
}

input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0;
    white-space: nowrap;
    display: inline-block;
}

input[type="number"],
input[type="text"],
input[type="email"] {
    width: 100%;
    padding: 5px;
}
button {
    padding: 6px 12px;
    border: 1px solid lightgray;
    border-radius: 0.25em;
    background-color: rgb(235, 235, 228);
}
</style>
