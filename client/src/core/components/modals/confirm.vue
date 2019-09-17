<template>
    <modal :visible="visible" @close="close">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            {{ title }}
        </div>
        <div class="modal-body">
            <button @click="confirm" ref="confirm">{{ yes }}</button>
            <button @click="deny" v-if="!!no">{{ no }}</button>
        </div>
    </modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import Modal from "@/core/components/modals/modal.vue";

@Component({
    components: {
        Modal,
    },
})
export default class ConfirmDialog extends Vue {
    $refs!: {
        confirm: HTMLButtonElement;
    };

    visible = false;
    yes = "Yes";
    no = "No";
    title = "";

    resolve = (ok: boolean) => {};
    reject = () => {};

    confirm() {
        this.resolve(true);
        this.close();
    }
    deny() {
        this.resolve(false);
        this.close();
    }
    close() {
        this.reject();
        this.visible = false;
        this.title = "";
    }
    open(title: string, yes = "yes", no = "no"): Promise<boolean> {
        this.yes = yes;
        this.no = no;
        this.title = title;

        this.visible = true;
        this.$nextTick(() => {
            this.$refs.confirm.focus();
        });

        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
</script>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.modal-body {
    padding: 10px;
    display: flex;
    justify-content: flex-end;
}

button:first-of-type {
    margin-right: 10px;
}
</style>
