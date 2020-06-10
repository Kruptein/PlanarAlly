import Modal from "@/core/components/modals/modal.vue";

import { rootStore } from "@/store";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

export interface ModalState {
    modals: Modal[];
}

@Module({ dynamic: true, store: rootStore, name: "modals" })
class ModalsStore extends VuexModule implements ModalState {
    modals: Modal[] = [];

    get topModal(): Modal {
        return this.modals[0];
    }

    @Mutation
    setTopModal(modal: Modal): void {
        if (this.topModal === modal) return;
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
        console.log("closeAll Called!");
        this.modals.forEach(modal => modal.$emit("close"));
        this.modals = [];
    }
}

export const modalsStore = getModule(ModalsStore);
