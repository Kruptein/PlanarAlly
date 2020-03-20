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
            <div class="grid">
                <div class="header">
                    <abbr title="Category">Cat.</abbr>
                </div>
                <div class="header name">Name</div>
                <div class="header">
                    <abbr title="Visible">Vis.</abbr>
                </div>
                <div class="header">
                    <abbr title="Delete">Del.</abbr>
                </div>
                <div class="separator spanrow" style="margin: 0 0 7px;"></div>
                <input class="spanrow" type="text" placeholder="search" v-model="search" ref="search" />
            </div>
            <div class="grid scroll">
                <template v-for="category in categories">
                    <template v-for="label in labels[category]">
                        <div :key="'row-' + label.uuid" class="row" @click="selectLabel(label.uuid)">
                            <template v-if="label.category">
                                <div :key="'cat-' + label.uuid">{{ label.category }}</div>
                                <div class="name" :key="'name-' + label.uuid">{{ label.name }}</div>
                            </template>
                            <template v-if="!label.category">
                                <div :key="'cat-' + label.uuid"></div>
                                <div class="name" :key="'name-' + label.uuid">{{ label.name }}</div>
                            </template>
                            <div
                                :key="'visible-' + label.uuid"
                                :style="{ textAlign: 'center' }"
                                :class="{ 'lower-opacity': !label.visible }"
                                @click.stop="toggleVisibility(label)"
                            >
                                <i class="fas fa-eye"></i>
                            </div>
                            <div :key="'delete-' + label.uuid" @click.stop="deleteLabel(label.uuid)">
                                <i class="fas fa-trash-alt"></i>
                            </div>
                        </div>
                    </template>
                </template>
                <template v-if="labels.length === 0">
                    <div id="no-labels">No labels exist yet</div>
                </template>
            </div>
            <div class="grid">
                <div class="separator spanrow"></div>
                <input type="text" v-model.trim="newCategory" />
                <input type="text" v-model.trim="newName" />
                <button id="addLabelButton" @click.stop="addLabel">Add</button>
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
    newCategory = "";
    newName = "";
    search = "";

    mounted(): void {
        EventBus.$on("LabelManager.Open", () => {
            this.visible = true;
            this.newCategory = "";
            this.newName = "";
            this.$nextTick(() => (<HTMLInputElement>this.$refs.search).focus());
        });
    }

    beforeDestroy(): void {
        EventBus.$off("LabelManager.Open");
    }

    get labels(): { [category: string]: Label[] } {
        const cat: { [category: string]: Label[] } = { "": [] };
        for (const uuid of Object.keys(gameStore.labels)) {
            const label = gameStore.labels[uuid];
            if (
                this.search.length &&
                `${label.category.toLowerCase()}${label.name.toLowerCase()}`.search(this.search.toLowerCase()) < 0
            )
                continue;
            if (label.user !== gameStore.username) continue;
            if (!label.category) cat[""].push(label);
            else {
                if (!(label.category in cat)) cat[label.category] = [];
                cat[label.category].push(label);
                cat[label.category].sort((a, b) => a.name.localeCompare(b.name));
            }
        }
        return cat;
    }

    get categories(): string[] {
        return Object.keys(this.labels).sort();
    }

    selectLabel(label: string): void {
        EventBus.$emit("EditDialog.AddLabel", label);
        this.visible = false;
    }

    toggleVisibility(label: Label): void {
        label.visible = !label.visible;
        socket.emit("Label.Visibility.Set", { uuid: label.uuid, visible: label.visible });
    }

    addLabel(): void {
        if (this.newName === "") return;
        const label = {
            uuid: uuidv4(),
            category: this.newCategory,
            name: this.newName,
            visible: false,
            user: gameStore.username,
        };
        gameStore.addLabel(label);
        socket.emit("Label.Add", label);
        this.newCategory = "";
        this.newName = "";
    }

    deleteLabel(uuid: string): void {
        gameStore.deleteLabel({ uuid, user: gameStore.username });
        socket.emit("Label.Delete", uuid);
    }
}
</script>

<style scoped>
abbr {
    text-decoration: none;
}

.scroll {
    max-height: 20em;
    overflow-y: auto;
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

.separator {
    line-height: 0.1em;
    margin: 7px 0;
}

.separator:after {
    position: absolute;
    left: 10px;
    right: 10px;
    border-bottom: 1px solid #000;
    content: "";
}

.spanrow {
    grid-column: start / end;
}

.lower-opacity > * {
    opacity: 0.3;
}

.grid {
    display: grid;
    grid-template-columns: [start] 50px [name] 1fr [visible] 30px [remove] 30px [end];
    grid-row-gap: 5px;
    align-items: center;
}

.grid > * {
    text-align: center;
}

.name {
    text-align: left !important;
}

.row {
    display: contents;
}

.row > * {
    padding: 5px;
    height: 20px;
    border: solid 1px rgba(0, 0, 0, 0);
}

.row:hover > * {
    cursor: pointer;
    border-top: solid 1px #ff7052;
    border-bottom: solid 1px #ff7052;
    background-color: rgba(0, 0, 0, 0.2);
}

.row:hover > *:first-child {
    border-left: solid 1px #ff7052;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
}

.row:hover > *:last-child {
    border-right: solid 1px #ff7052;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
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
