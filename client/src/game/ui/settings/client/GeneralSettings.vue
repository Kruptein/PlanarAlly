<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import LanguageDropdown from "@/core/components/languageDropdown.vue";

@Component({
    components: {
        languageDropdown: LanguageDropdown,
    },
})
export default class GeneralSettings extends Vue {}
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="languageSelect" v-t="'locale.select'"></label>
            <div><languageDropdown id="languageSelect" /></div>
        </div>
    </div>
</template>
