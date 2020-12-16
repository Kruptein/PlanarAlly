<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class LanguageDropdown extends Vue {
    locales = ["en", "zh", "de", "ru", "dk", "es", "tw", "it"];

    changeLocale(locale: string): void {
        if (this.locales.includes(locale)) {
            this.$i18n.locale = locale;
            localStorage.setItem("locale", locale);
        }
    }
}
</script>

<template>
    <div class="box">
        <div
            class="element"
            :class="{ selected: $i18n.locale === locale }"
            v-for="locale in locales"
            :key="locale"
            :value="locale"
            v-t="'locale.' + locale"
            @click="changeLocale(locale)"
        ></div>
    </div>
</template>

<style scoped lang="scss">
.box {
    display: flex;
    flex-direction: column;
}

.element {
    padding: 5px;
    background-color: white;

    &:first-of-type {
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    }

    &:last-of-type {
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;
    }
}

.selected,
.element:hover {
    background-color: #9c455e;
    cursor: pointer;
}
</style>
