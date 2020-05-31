<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";

import { AssetFile, AssetList } from "@/core/comm/types";
import { alphSort } from "@/core/utils";

@Component({
    name: "asset-node",
})
export default class AssetNode extends Vue {
    @Prop() asset!: AssetList;
    @Prop() search!: string;
    @Prop() name!: string;

    empty = false;
    emptyFolders: string[] = [];

    @Watch("search")
    test(_val: string): void {
        this.checkVisibility();
    }

    checkVisibility(): void {
        const newEmpty = this.files.length === 0 && this.folders.length <= this.emptyFolders.length;
        if (!this.empty && newEmpty) {
            this.empty = true;
            this.$emit("folderEmpty", this.name);
        } else if (this.empty && !newEmpty) {
            this.empty = false;
            this.$emit("folderShow", this.name);
        }
    }

    showImage = null;
    get folders(): string[] {
        return Object.keys(this.asset)
            .filter(el => "__files" !== el)
            .sort(alphSort);
    }

    get files(): AssetFile[] {
        if (this.asset.__files)
            return (<AssetFile[]>this.asset.__files)
                .concat()
                .filter(f => f.name.toLowerCase().includes(this.search.toLowerCase()))
                .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
        return [];
    }

    folderEmpty(name: string): void {
        this.emptyFolders.push(name);
        this.checkVisibility();
    }

    folderShow(name: string): void {
        this.emptyFolders.splice(
            this.emptyFolders.findIndex(x => x === name),
            1,
        );
        this.checkVisibility();
    }

    toggle(event: { target: HTMLElement }): void {
        for (let i = 0; i < event.target.children.length; i++) {
            const el = <HTMLElement>event.target.children[i];
            el.style.display = el.style.display === "" ? "block" : "";
        }
    }

    dragStart(event: DragEvent, imageSource: string): void {
        this.showImage = null;
        if (event === null || event.dataTransfer === null) return;
        const img = (<HTMLElement>event.target).querySelector(".preview")!;
        event.dataTransfer.setDragImage(img, 0, 0);
        event.dataTransfer.setData("text/plain", imageSource);
    }
}
</script>

<template>
    <ul>
        <li
            v-for="folder in folders"
            :key="folder"
            class="folder"
            @click.stop="toggle"
            v-show="!emptyFolders.includes(folder)"
        >
            {{ folder }}
            <asset-node
                :asset="asset[folder]"
                :name="folder"
                :search="search"
                @folderShow="folderShow"
                @folderEmpty="folderEmpty"
            ></asset-node>
        </li>
        <li
            v-for="file in files"
            :key="file.uuid"
            class="file draggable token"
            draggable="true"
            @mouseover="showImage = file.hash"
            @mouseout="showImage = null"
            @dragstart="dragStart($event, '/static/assets/' + file.hash)"
        >
            {{ file.name }}
            <div v-if="showImage == file.hash" class="preview">
                <img class="asset-preview-image" :src="'/static/assets/' + file.hash" alt="" />
            </div>
        </li>
    </ul>
</template>

<style scoped>
.preview {
    position: fixed;
    z-index: 50;
    left: 200px;
    top: 0;
}

.asset-preview-image {
    width: 100%;
    max-width: 250px;
}

.draggable {
    list-style: none;
    font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande",
        sans-serif;
}

.token {
    /* padding: 5px 10px; */
    padding-top: 5px;
    padding-bottom: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.token img {
    margin-right: 5px;
}

.token svg {
    margin-left: auto;
}

/*
DIRECTORY.CSS changes

* Collapse all folders by default, use js to toggle visibility on click.
* On hover over folder show some visual feedback
* On hover over file show the image

*/
.folder > * {
    display: none;
}

.directory > .folder,
.directory > .file {
    display: block;
}

.folder:hover {
    font-weight: bold;
    cursor: pointer;
}

.folder:hover > * {
    font-weight: normal;
}
</style>
