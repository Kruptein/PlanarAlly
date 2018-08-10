<template>
    <modal :visible="visible" @close="close">
        <div class='modal-header'>
            Create basic token
        </div>
        <div class='modal-body'>
            <label for="createtokendialog-text">Text</label>
            <input type="text" id="createtokendialog-name">
            <label for="createtokendialog-fill">Fill</label>
            <input type="text" id="createtokendialog-fill" title="Fill colour">
            <label for="createtokendialog-border">Border</label>
            <input type="text" id="createtokendialog-border" title="Border colour">
        </div>
        <div class='modal-footer'>
            <button @click="submit">Submit</button>
        </div>
    </modal>
</template>

<script lang="ts">
import Vue from "vue";
import modal from "../../vue/components/modals/modal.vue";

export default Vue.component('createtoken-modal', {
    components: {
        modal
    },
    data: function () {
        return {
            visible: false,
            resolve: () => {},
            reject: () => {}
        }
    },
    methods: {
        submit: function () {
            this.resolve();
            this.close();
        },
        close: function () {
            this.reject();
            this.visible = false;
        },
    }
})
</script>

<style scoped>
.modal-header {
    background-color: #FF7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
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