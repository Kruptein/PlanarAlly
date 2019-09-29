import Modal from "@/core/components/modals/modal.vue";

import { rootStore } from "@/store";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { EventBus } from "@/game/event-bus";

@Module({ dynamic: true, store: rootStore, name: "modals", namespaced: true })
class ModalsStore extends VuexModule {
    modals: Modal[] = [];

    get topModal(): Modal {
        return this.modals[0];
    }

    @Mutation
    setTopModal(modal: Modal): void {
        // Dont bother doing anything if the chosen modal is already at the top
        if (this.topModal === modal) return;
        // Put the chosen modal at the start of the array, and remove it from the rest of the list if exists
        this.modals = [modal, ...this.modals.filter(item => item !== modal).slice(0, 999)];
        this.modals.forEach((element: Modal, i: number) => {
            element.$data.zIndex = 8999 - i;
        });
    }

    @Mutation
    removeFromModals(modal: Modal): void {
        this.modals = this.modals.filter(item => item !== modal);
    }

    @Mutation
    closeAll(): void {
        this.modals.forEach(modal => modal.$emit("close"));
        this.modals = [];
    }
}

export const modalsStore = getModule(ModalsStore);

EventBus.$on("General.CloseAll", () => {
    modalsStore.closeAll();
});
