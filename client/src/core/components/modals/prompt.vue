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
            {{ question }}
            <input type="text" ref="answer" v-model="answer" @keyup.enter="submit" />
        </div>
        <div class="modal-footer">
            <button @click="submit">Submit</button>
        </div>
    </Modal>
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
export default class Prompt extends Vue {
    $refs!: {
        answer: HTMLElement;
    };

    visible = false;
    question = "";
    answer = "";
    title = "";

    resolve: (value: string) => void = (_value: string) => {};
    reject: () => void = () => {};

    submit(): void {
        this.resolve(this.answer);
        this.close();
    }
    close(): void {
        this.reject();
        this.visible = false;
    }
    prompt(question: string, title: string): Promise<string> {
        this.question = question;
        this.title = title;
        this.visible = true;
        this.$nextTick(() => {
            this.$refs.answer.focus();
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
    padding-bottom: 0;
    display: flex;
    justify-content: space-between;
}

.modal-footer {
    padding-top: 0;
    padding: 10px;
    text-align: right;
}
</style>
