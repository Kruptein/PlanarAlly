<script setup lang="ts"></script>

<template>
    <header>
        <div id="header-title">PlanarAlly Admin Dashboard</div>
        <nav>
            <router-link to="/users">users</router-link>
            <router-link to="/campaigns">campaigns</router-link>
        </nav>
    </header>
    <div>
        <router-view v-slot="{ Component }">
            <component :is="Component" />
        </router-view>
    </div>
</template>

<style lang="scss">
html,
body {
    margin: 0;
    padding: 0;

    background-color: rgba(255, 69, 0, 0.1);
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;

    width: 100%;

    display: grid;
    grid-template-rows: auto 1fr;

    header {
        display: flex;
        padding: 1em;

        align-items: center;

        background-color: rgba(255, 69, 0, 0.3);
        border-bottom: solid 2px rgb(255, 69, 0);

        #header-title {
            font-size: 25px;
            margin-right: 25px;
        }

        nav {
            font-size: 20px;

            > a {
                margin-right: 5px;
                text-decoration: none;
                color: black;

                &.router-link-active,
                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }
}
</style>
