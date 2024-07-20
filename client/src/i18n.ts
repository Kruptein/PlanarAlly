import messages from "@intlify/unplugin-vue-i18n/messages";
import { createI18n } from "vue-i18n";

export const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem("locale") ?? (import.meta.env.VITE_APP_I18N_LOCALE as string | undefined) ?? "zh",
    fallbackLocale: (import.meta.env.VITE_APP_I18N_FALLBACK_LOCALE as string | undefined) ?? "zh",
    messages: messages as I18nOptions["messages"],
});
