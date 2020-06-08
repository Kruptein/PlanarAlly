<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

@Component
export default class LanguageDropdown extends Vue {
    @Prop() value!: string;

    locales = ["en", "zh", "de"];

    changeLocale(event: { target: HTMLSelectElement }): void {
        const value = event.target.value;

        if (this.locales.includes(value)) {
            this.$i18n.locale = value;
            localStorage.setItem("locale", value);
        }
    }
}
</script>

<template>
    <select @change="changeLocale">
        <option
            v-for="locale in locales"
            :key="locale"
            :value="locale"
            :label="$t('locale.' + locale)"
            :selected="$i18n.locale === locale"
        ></option>
    </select>
</template>
