<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import Modal from "@/core/components/modals/modal.vue";

@Component({
    components: {
        Modal,
    },
})
export default class SelectionBox extends Vue {
    visible = false;
    title = "";
    choices: string[] = [];

    resolve: (value: string) => void = (_value: string) => {};
    reject: () => void = () => {};

    select(choice: string): void {
        this.resolve(choice);
        this.close();
    }

    close(): void {
        this.reject();
        this.visible = false;
    }

    open(title: string, choices: string[]): Promise<string> {
        this.title = title;
        this.visible = true;
        this.choices = choices;
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
</script>

<template>
    <Modal :visible="visible" @close="close">
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
            <div id="selectionbox">
                <template v-for="choice of choices">
                    <div :key="choice" @click="select(choice)">{{ choice }}</div>
                </template>
            </div>
        </div>
    </Modal>
</template>

<style scoped>
.modal-header {
    background-color: #7c253e;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.modal-body {
    padding: 10px;
    padding-bottom: 0;
    display: flex;
    flex-direction: column;
}

#selectionbox {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
}

#selectionbox div {
    padding: 10px 25px;
    padding-left: 15px;
    border: solid 1px;
    border-top: none;
}

#selectionbox div:first-child {
    border-top: solid 1px;
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
}

#selectionbox div:last-child {
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
}

#selectionbox div:hover {
    background-color: #9c455e;
    cursor: pointer;
}
</style>
