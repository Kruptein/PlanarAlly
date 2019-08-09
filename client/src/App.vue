<template>
    <div id="app">
        <router-view ref="activeComponent"></router-view>
    </div>
</template>

<style>
@import url("https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css");
@import url("https://fonts.googleapis.com/css?family=Open+Sans");

html,
body,
#app {
    margin: 0;
    padding: 0;
    border: 0;
    width: 100%;
    height: 100%;
    font-family: "Open Sans", sans-serif;
    font-weight: 200;
}

#app {
    display: flex;
    background: url("/static/img/login_background.png") repeat fixed;
}
</style>
