<template>
    <modal :visible="visible" @close="close">
        <div
            class='modal-header'
            slot='header'
            slot-scope='m'
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            {{ title }}
        </div>
        <div class='modal-body'>
            {{ question }} <input type='text' ref='answer' v-model="answer" @keyup.enter="submit">
        </div>
        <div class='modal-footer'>
            <button @click="submit">Submit</button>
        </div>
    </modal>
</template>

<script>
import modal from "@/core/components/modals/modal.vue";
export default {
    components: {
        modal,
    },
    data: () => ({
        visible: false,
        question: "",
        answer: "",
        title: "",
    }),
    methods: {
        submit() {
            this.resolve(this.answer);
            this.close();
        },
        close() {
            this.reject();
            this.visible = false;
            this.question = "";
            this.answer = "";
            this.title = "";
        },
        prompt(question, title) {
            this.question = question;
            this.title = title;
            this.visible = true;
            this.$nextTick(
                function() {
                    this.$refs.answer.focus();
                }.bind(this),
            );
            return new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        },
    },
};
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