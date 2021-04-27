<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
    setup() {
        const { availableLocales, locale } = useI18n({ useScope: "global" });

        function setLocale(newLocale: string): void {
            locale.value = newLocale;
            localStorage.setItem("locale", newLocale);
        }

        return { availableLocales, locale, setLocale };
    },
});
</script>

<template>
    <div class="box">
        <div
            class="element"
            :class="{ selected: locale === availableLocale }"
            v-for="availableLocale in availableLocales"
            :key="`locale-${availableLocale}`"
            :value="availableLocale"
            v-t="'locale.' + availableLocale"
            @click="setLocale(availableLocale)"
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
