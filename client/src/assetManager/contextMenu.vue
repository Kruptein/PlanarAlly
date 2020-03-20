<template>
    <ContextMenu :visible="visible" :left="left + 'px'" :top="top + 'px'" @close="close">
        <li @click="rename">Rename</li>
        <li @click="remove">Remove</li>
    </ContextMenu>
</template>

<script lang="ts">
import Vue from "vue";

import Component from "vue-class-component";

import ContextMenu from "@/core/components/contextmenu.vue";
import ConfirmDialog from "@/core/components/modals/confirm.vue";
import Prompt from "@/core/components/modals/prompt.vue";
import AssetManager from "./manager.vue";

import { socket } from "@/assetManager/socket";
import { assetStore } from "@/assetManager/store";

@Component({
    components: {
        ContextMenu,
    },
})
export default class AssetContextMenu extends Vue {
    visible = false;
    left = 0;
    top = 0;

    get parent(): AssetManager {
        return <AssetManager>this.$parent;
    }

    open(event: MouseEvent, inode: number): void {
        if (!assetStore.selected.includes(inode)) this.parent.select(event, inode);

        this.visible = true;
        this.left = event.pageX;
        this.top = event.pageY;
        this.$nextTick(() => {
            (<HTMLElement>this.$children[0].$el).focus();
        });
    }
    close(): void {
        this.visible = false;
    }
    async rename(): Promise<void> {
        if (assetStore.selected.length !== 1) return;
        const asset = assetStore.idMap.get(assetStore.selected[0])!;

        const name = await (<Prompt>this.parent.$refs.prompt).prompt("New name:", `Renaming ${asset.name}`);
        socket.emit("Asset.Rename", {
            asset: asset.id,
            name,
        });
        asset.name = name;
        this.parent.$forceUpdate();
        this.close();
    }
    async remove(): Promise<void> {
        if (assetStore.selected.length === 0) return;
        const result = await (<ConfirmDialog>this.parent.$refs.confirm).open("Are you sure you wish to remove this?");
        if (result) {
            for (const sel of assetStore.selected) {
                socket.emit("Asset.Remove", sel);
                if (assetStore.files.includes(sel)) assetStore.files.splice(assetStore.files.indexOf(sel), 1);
                else assetStore.folders.splice(assetStore.folders.indexOf(sel), 1);
            }
            assetStore.clearSelected();
        }
        this.close();
    }
}
</script>
