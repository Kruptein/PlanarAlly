<template>
    <ul>
        <li
            v-for="folder in folders"
            :key="folder"
            class='folder'
            @click.stop="toggle"
        >
            {{ folder }}
            <asset-node :asset="asset[folder]"></asset-node>
        </li>
        <li
            v-for="file in files"
            :key="file.name"
            class='file draggable token'
            @mouseover="showImage = file.hash"
            @mouseout="showImage = null"
        >
            {{ file.name }}
            <div v-if="showImage == file.hash" class='preview'>
                    <img :src="'/static/assets/' + file.hash" class='asset-preview-image'>
            </div>
        </li>
    </ul>
</template>


<script lang="ts">
import Vue from 'vue'
import { alphSort } from '../../core/utils';
import { AssetFileList } from '../api_types';
export default Vue.component('asset-node', {
    props: ['asset', 'open'],
    data: () => ({
        showImage: null,
    }),
    computed: {
        folders(): string[] {
            return Object.keys(this.asset).filter(el => !['__files'].includes(el)).sort(alphSort);
        },
        files(): AssetFileList[] {
            if (this.asset['__files'])
                return (<AssetFileList[]>this.asset['__files']).concat().sort((a,b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
            return [];
        }
    },
    methods: {
        toggle(event: { target: HTMLElement }) {
            for (let i=0; i < event.target.children.length; i++) {
                const el = <HTMLElement> event.target.children[i];
                el.style.display = el.style.display === '' ? 'block' : '';
            }
        }
    }
})
</script>

<style>
.preview {
    position: fixed;
    z-index:50;
    left: 200px;
}

.asset-preview-image {
    width: 100%;
    max-width: 250px;
}
</style>
