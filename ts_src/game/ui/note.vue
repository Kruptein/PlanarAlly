<template>
    <modal v-if='note !== null' :visible="visible" @close="visible = false">
        <div class='modal-header' slot='header' slot-scope='m' @mousedown='m.startDrag' @mouseup='m.stopDrag'>
            <input v-model="note.name">
        </div>
        <div class='modal-body'>
            <textarea
                ref='textarea'
                v-model='note.text'
                :style="{'height': calcHeight()}"
            ></textarea>
        </div>
    </modal>
</template>

<script lang="ts">
import Vue from 'vue'
import modal from "../../core/components/modals/modal.vue";

import { mapState } from 'vuex';
import { uuidv4 } from '../../core/utils';
import { Note } from '../api_types';

export default Vue.component('initiative-dialog', {
    data: () => ({
        visible: false,
        note: <Note | null> null,
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
                const el = (<HTMLElement>this.$refs.textarea);
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
                // Using the return value without the above did not achieve what I want, so hey /shrug
                return el.scrollHeight + 'px';
            }
            return '100px';
        }
    }
});
</script>

<style scoped>
.modal-header {
    background-color: #FF7052;
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

.modal-body {
    padding: 10px;
}

.modal-body > textarea {
    width: 100%;
    min-height: 100px;
    max-height: 500px;
}
</style>
