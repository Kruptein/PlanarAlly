<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import VueMarkdown from "vue-markdown";

import Modal from "@/core/components/modals/modal.vue";

@Component({
    components: {
        Modal,
        VueMarkdown,
    },
})
export default class SelectionBox extends Vue {
    visible = false;
    title = "";
    text = "";
    choices: string[] = [];
    defaultButton = "";
    customName = "";
    customButton = "";
    activeSelection = 0;

    error = "";

    resolve: (value: string | undefined) => void = (_value: string | undefined) => {};
    reject: () => void = () => {};

    select(choice: number): void {
        this.activeSelection = choice;
    }

    create(): void {
        if (this.customName === "") {
            this.error = this.$t("core.components.selectionbox.non_empty_warning").toString();
        } else if (this.choices.includes(this.customName)) {
            this.error = this.$t("core.components.selectionbox.already_exists_warning").toString();
        } else {
            this.resolve(this.customName);
            this.close();
        }
    }

    submit(): void {
        this.resolve(this.choices[this.activeSelection]);
        this.close();
    }

    close(): void {
        this.resolve(undefined);
        this.visible = false;
    }

    open(
        title: string,
        choices: string[],
        options?: { text?: string; defaultButton?: string; customButton?: string },
    ): Promise<string | undefined> {
        this.title = title;
        this.visible = true;
        this.choices = choices;
        this.text = options?.text ?? "";
        this.defaultButton = options?.defaultButton ?? this.$t("common.select").toString();
        this.customButton = options?.customButton ?? "";
        this.error = "";
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
            <vue-markdown :source="text"></vue-markdown>
            <div id="error" v-if="error.length > 0">{{ error }}</div>
            <div id="selectionbox">
                <template v-for="[i, choice] of choices.entries()">
                    <div :key="choice" :class="{ selected: i === activeSelection }" @click="activeSelection = i">
                        {{ choice }}
                    </div>
                </template>
            </div>
            <div class="button" @click="submit()">{{ defaultButton }}</div>
            <template v-if="customButton.length > 0">
                <h4>
                    <span>
                        {{ $t("common.or").toLocaleUpperCase().toString() }}
                    </span>
                </h4>
                <input type="text" class="input" v-model="customName" />
                <div class="button" @click="create()">{{ customButton }}</div>
            </template>
        </div>
    </Modal>
</template>

<style scoped lang="scss">
.modal-header {
    background-color: #7c253e;
    color: white;
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

#error {
    margin: 10px;
    color: #7c253e;
}

#selectionbox {
    display: flex;
    flex-direction: column;

    max-height: 60vh;
    overflow: auto;

    div {
        padding: 10px 25px;
        padding-left: 15px;
        border: solid 1px black;
        border-top: none;

        &:first-child {
            border-top: solid 1px black;
            border-top-left-radius: 15px;
            border-top-right-radius: 15px;
        }

        &:last-child {
            border-bottom-left-radius: 15px;
            border-bottom-right-radius: 15px;
        }
    }
}

.selected,
.button:hover,
#selectionbox div:hover {
    color: white;
    background-color: #9c455e;
    cursor: pointer;
}

.button {
    border: solid 1px black;
    border-radius: 20px;
    padding: 5px 10px;
    margin: 10px;
    margin-right: 0;
    align-self: flex-end;
}

.input {
    border: solid 1px black;
    border-radius: 20px;
    padding: 5px 10px;
}

h4 {
    font-weight: normal;
    background-color: white;
    text-align: center;
    border-bottom: 1px solid #000;
    line-height: 0.1em;

    span {
        background: #fff;
        padding: 0 10px;
    }
}
</style>
