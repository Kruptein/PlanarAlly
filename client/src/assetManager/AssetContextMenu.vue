<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { socket } from "@/assetManager/socket";
import { assetStore } from "@/assetManager/store";
import ContextMenu from "@/core/components/contextmenu.vue";
import ConfirmDialog from "@/core/components/modals/ConfirmDialog.vue";
import Prompt from "@/core/components/modals/prompt.vue";

import AssetManager from "./AssetManager.vue";

@Component({
    components: {
        ConfirmDialog,
        ContextMenu,
        Prompt,
    },
})
export default class AssetContextMenu extends Vue {
    $refs!: {
        confirm: ConfirmDialog;
        prompt: Prompt;
    };
    $parent!: AssetManager;

    visible = false;
    left = 0;
    top = 0;

    open(event: MouseEvent, inode: number): void {
        if (!assetStore.selected.includes(inode)) this.$parent.select(event, inode);

        this.visible = true;
        this.left = event.clientX;
        this.top = event.clientY;
        this.$nextTick(() => {
            (this.$children[0].$el as HTMLElement).focus();
        });
    }
    close(): void {
        if (this.$refs.confirm.visible || this.$refs.prompt.visible) return;
        this.visible = false;
    }
    async rename(): Promise<void> {
        if (assetStore.selected.length !== 1) return;
        const asset = assetStore.idMap.get(assetStore.selected[0])!;

        const name = await this.$refs.prompt.prompt(
            this.$t("assetManager.AssetContextMenu.new_name").toString(),
            this.$t("assetManager.AssetContextMenu.renaming_NAME", { name: asset.name }).toString(),
        );
        if (name !== undefined) {
            socket.emit("Asset.Rename", {
                asset: asset.id,
                name,
            });
            asset.name = name;
            this.$parent.$forceUpdate();
        }
        this.close();
    }
    async remove(): Promise<void> {
        if (assetStore.selected.length === 0) return;
        const result = await this.$refs.confirm.open(this.$t("assetManager.AssetContextMenu.ask_remove").toString());
        if (result) {
            for (const sel of assetStore.selected) {
                socket.emit("Asset.Remove", sel);
                assetStore.removeAsset(sel);
            }
            assetStore.clearSelected();
        }
        this.close();
    }
}
</script>

<template>
    <ContextMenu :visible="visible" :left="left + 'px'" :top="top + 'px'" @close="close">
        <ConfirmDialog ref="confirm"></ConfirmDialog>
        <Prompt ref="prompt"></Prompt>
        <li @click="rename" v-t="'common.rename'"></li>
        <li @click="remove" v-t="'common.remove'"></li>
    </ContextMenu>
</template>
