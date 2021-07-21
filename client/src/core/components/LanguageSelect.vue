<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { availableLocales, locale, t } = useI18n({ useScope: "global" });

function setLocale(event: Event): void {
    const newLocale = (event.target as HTMLSelectElement).value;
    locale.value = newLocale;
    localStorage.setItem("locale", newLocale);
}
</script>

<template>
    <select @change="setLocale">
        <option
            v-for="availableLocale in availableLocales"
            :key="'locale-' + availableLocale"
            :value="availableLocale"
            :label="t('locale.' + availableLocale)"
            :selected="availableLocale === locale"
        ></option>
    </select>
</template>
