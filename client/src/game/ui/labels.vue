<template>
    <Modal :visible="visible" @close="visible = false" :mask="false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div>Label manager</div>
            <div class="header-close" @click="visible = false">
                <i class="far fa-window-close"></i>
            </div>
        </div>
        <div class="modal-body">
            <div id='grid'>
                <div class="header"><abbr title="Select">Sel.</abbr></div>
                <div class="header"><abbr title="Category">Cat.</abbr></div>
                <div class="header">Name</div>
                <div class="header"><abbr title="Visible">Vis.</abbr></div>
                <div class="header"><abbr title="Delete">Del.</abbr></div>
                <template v-for="label in $store.state.game.labels">
                    <input type="checkbox" :key="'sel-'+label.uuid">
                    <div :key="'cat-'+label.uuid">{{ label.name.split(":")[0] }}</div>
                    <div :key="'name-'+label.uuid">{{ label.name.split(":").splice(1).join(":") }}</div>
                    <div :key="'visible-'+label.uuid">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div :key="'delete-'+label.uuid">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                </template>
                <template v-if='$store.state.game.labels.length === 0'>
                    <div id='no-labels'>No labels exist yet</div>
                </template>
                <span></span>
                <input type='text'>
                <input type='text'>
                <button id='addLabelButton'>Add</button>
            </div>
        </div>
    </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import Modal from "@/core/components/modals/modal.vue";

import { uuidv4 } from "@/core/utils";
import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { gameStore } from "@/game/store";

@Component({
    components: {
        Modal,
    },
})
export default class LabelManager extends Vue {
    visible = false;

    mounted() {
        EventBus.$on("LabelManager.Open", () => {
            this.visible = true;
        });
    }

    beforeDestroy() {
        EventBus.$off();
    }
}
</script>

<style scoped>

abbr {
    text-decoration: none;
}

.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    padding: 10px;
    max-width: 450px;
}

#grid {
    display: grid;
    grid-template-columns: [start] 30px [cat] 50px [name] 1fr [visible] 30px [remove] 30px [end];
    grid-column-gap: 5px;
    grid-row-gap: 5px;
    align-items: center;
}

#no-labels {
    grid-column: start/end;
    font-style: italic;
    padding-left: 50px;
}

#addLabelButton {
    grid-column: visible/end;
}
</style>