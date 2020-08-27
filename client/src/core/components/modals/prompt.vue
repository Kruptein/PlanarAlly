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
    error = "";

    validation: (value: string) => { valid: true } | { valid: false; reason: string } = _value => ({
        valid: true,
    });
    resolve: (value: string) => void = (_value: string) => {};
    reject: () => void = () => {};

    submit(): void {
        const validation = this.validation(this.answer);
        if (validation.valid) {
            this.resolve(this.answer);
            this.close();
        } else {
            this.error = validation.reason;
        }
    }

    close(): void {
        this.reject();
        this.visible = false;
    }

    prompt(
        question: string,
        title: string,
        validation?: (value: string) => { valid: true } | { valid: false; reason: string },
    ): Promise<string> {
        this.answer = "";
        this.question = question;
        this.title = title;
        this.visible = true;
        this.error = "";
        if (validation) this.validation = validation;
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
            <div id="question">{{ question }}</div>
            <div id="error" v-if="error">{{ error }}</div>
            <input id="answer" type="text" ref="answer" v-model="answer" @keyup.enter="submit" />
        </div>
        <div class="modal-footer">
            <button @click="submit" v-t="'common.submit'"></button>
        </div>
    </Modal>
</template>

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
    flex-direction: column;
}

#question {
    margin-bottom: 20px;
}

#error {
    color: red;
    margin-bottom: 5px;
}

.modal-footer {
    padding: 10px;
    text-align: right;
}
</style>
