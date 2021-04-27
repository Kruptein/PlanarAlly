<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
    setup() {
        const { availableLocales, locale, t } = useI18n({ useScope: "global" });

        function setLocale(newLocale: string): void {
            locale.value = newLocale;
            localStorage.setItem("locale", newLocale);
        }

        return { availableLocales, locale, setLocale, t };
    },
});
</script>

<template>
    <select @change="setLocale($event.target.value)" size="">
        <option
            v-for="availableLocale in availableLocales"
            :key="'locale-' + availableLocale"
            :value="availableLocale"
            :label="t('locale.' + availableLocale)"
            :selected="availableLocale === locale"
        ></option>
    </select>
</template>
