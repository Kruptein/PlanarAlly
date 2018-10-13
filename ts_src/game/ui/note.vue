<template>
    <modal v-if='note !== null' :visible="visible" @close="visible = false" :mask="false">
        <div
            class='modal-header'
            slot='header'
            slot-scope='m'
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <span @click='$refs.title.select()'><i class="fas fa-pencil-alt" style='font-size: 15px'></i></span>
            <input v-model="note.name" ref='title' @change='updateNote'>
            <div class='header-close' @click="visible = false"><i class="far fa-window-close"></i></div>
        </div>
        <div class='modal-body'>
            <textarea
                ref='textarea'
                v-model='note.text'
                :style="{'height': calcHeight()}"
                @change='updateNote'
            ></textarea>
        </div>
        <div class='modal-footer'>
            <button @click="removeNote"><i class='far fa-trash-alt'></i> Remove</button>
        </div>
    </modal>
</template>

<script lang="ts">
import Vue from "vue";

import { mapState } from "vuex";

import modal from "../../core/components/modals/modal.vue";

import { Note } from "../api_types";
import { vm } from "../planarally";

export default Vue.component("initiative-dialog", {
    data: () => ({
        visible: false,
        note: <Note | null>null,
    }),
    components: {
        modal,
    },
    methods: {
        open(note: Note) {
            this.visible = true;
            this.note = note;
        },
        calcHeight() {
            if (this.$refs.textarea) {
                const el = <HTMLElement>this.$refs.textarea;
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
                // Using the return value without the above did not achieve what I want, so hey /shrug
                return el.scrollHeight + "px";
            }
            return "100px";
        },
        updateNote() {
            this.$store.commit("updateNote", { note: this.note, sync: true });
        },
        removeNote() {
            (<any>vm.$refs.confirm).open("Are you sure you wish to remove this?").then(
                (result: boolean) => {
                    if (result) {
                        this.$store.commit("removeNote", { note: this.note, sync: true });
                        this.visible = false;
                    }
                },
                () => {},
            );
        },
    },
});
</script>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.modal-header > input {
    background-color: inherit;
    border: none;
    font-weight: bold;
    font-size: large;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    padding: 10px;
}

.modal-body > textarea {
    width: 100%;
    min-height: 100px;
    max-height: 500px;
}

.modal-footer {
    padding-top: 0;
    padding: 10px;
    text-align: right;
}
</style>
