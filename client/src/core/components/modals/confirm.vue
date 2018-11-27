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
            <button @click="confirm" ref="confirm">{{ yes }}</button>
            <button @click="deny" v-if="!!no">{{ no }}</button>
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
        yes: "Yes",
        no: "No",
        title: "",
    }),
    methods: {
        confirm() {
            this.resolve(true);
            this.close();
        },
        deny() {
            this.resolve(false);
            this.close();
        },
        close() {
            this.reject();
            this.visible = false;
            this.title = "";
        },
        open(title, yes, no) {
            this.yes = yes === undefined ? "Yes" : yes;
            this.no = no === undefined ? "No" : no;
            this.title = title;

            this.visible = true;
            this.$nextTick(
                function() {
                    this.$refs.confirm.focus();
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
    display: flex;
    justify-content: flex-end;
}

button:first-of-type {
    margin-right: 10px;
}
</style>