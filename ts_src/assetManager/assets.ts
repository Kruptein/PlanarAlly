import Vue from "vue";

import { Asset } from "../core/comm/types";
import confirm from "../core/components/modals/confirm.vue";
import prompt from "../core/components/modals/prompt.vue";
import { uuidv4 } from "../core/utils";
import cm from "./contextMenu";
import socket from "./socket";

const vm = new Vue({
    el: "#AssetManager",
    components: {
        prompt,
        confirm,
        cm,
    },
    data: {
        root: -1,
        files: <number[]>[],
        folders: <number[]>[],
        idMap: <Map<number, Asset>>new Map(),
        path: <number[]>[],
        selected: <number[]>[],
        draggingSelection: false,
    },
    computed: {
        currentFolder(): number {
            if (this.path.length)
                return this.path[this.path.length - 1];
            return this.root;
        },
        parentFolder(): number {
            let parent = this.path[this.path.length - 2]
            if (parent === undefined)
                parent = this.root;
            return parent;
        },
        firstSelectedFile(): Asset | null {
            for (const sel of this.selected) {
                if (this.idMap.get(sel)!.file_hash) {
                    return this.idMap.get(sel)!;
                }
            }
            return null;
        }
    },
    methods: {
        isFile(inode: number): boolean {
            return this.files.includes(inode);
        },
        changeDirectory(nextFolder: number) {
            if (nextFolder < 0) this.path.pop();
            else this.path.push(nextFolder);
            this.selected = [];
            socket.emit("Folder.Get", this.currentFolder);
        },
        createDirectory() {
            const name = window.prompt("New folder name");
            if (name !== null) {
                socket.emit("Folder.Create", { name, parent: this.currentFolder });
            }
        },
        moveInode(inode: number, target: number) {
            if (this.isFile(inode))
                this.files.splice(this.files.indexOf(inode), 1);
            else
                this.folders.splice(this.folders.indexOf(inode), 1);
            this.idMap.delete(inode);
            socket.emit("Inode.Move", { inode, target });
        },
        select(event: MouseEvent, inode: number) {
            if (event.shiftKey && this.selected.length > 0) {
                const inodes = [...this.files, ...this.folders];
                const start = inodes.indexOf(this.selected[this.selected.length - 1]);
                const end = inodes.indexOf(inode);
                for (let i = start; i !== end; start < end ? i++ : i--)
                    this.selected.push(inodes[i]);
                this.selected.push(inodes[end]);
            } else {
                if (!event.ctrlKey) {
                    this.selected = [];
                }
                this.selected.push(inode);
            }
        },
        startDrag(event: DragEvent, file: number) {
            event.dataTransfer.setData('Hack', 'ittyHack');
            event.dataTransfer.dropEffect = "move";
            if (!this.selected.includes(file)) this.selected.push(file);
            this.draggingSelection = true;
        },
        moveDrag(event: DragEvent) {
            if ((<HTMLElement>event.target).classList.contains("folder"))
                (<HTMLElement>event.target).classList.add("inode-selected");
        },
        leaveDrag(event: DragEvent) {
            if ((<HTMLElement>event.target).classList.contains("folder"))
                (<HTMLElement>event.target).classList.remove("inode-selected");
        },
        stopDrag(event: DragEvent, target: number) {
            (<HTMLElement>event.target).classList.remove("inode-selected");
            if (this.draggingSelection) {
                if ((target === this.root || this.folders.includes(target)) && !this.selected.includes(target)) {
                    for (const inode of this.selected) {
                        this.moveInode(inode, target);
                    }
                }
                this.selected = [];
            } else if (event.dataTransfer.files.length > 0) {
                this.upload(event.dataTransfer.files, target);
            }
            this.draggingSelection = false;
        },
        prepareUpload() {
            document.getElementById("files")!.click();
        },
        upload(fls?: FileList, target?: number) {
            const files = (<HTMLInputElement>document.getElementById("files")!).files;
            if (fls === undefined) {
                if (files) fls = files;
                else return;
            }
            if (target === undefined) target = this.currentFolder;
            const CHUNK_SIZE = 100000;
            for (const file of fls) {
                const uuid = uuidv4();
                const slices = Math.ceil(file.size / CHUNK_SIZE);
                for (let slice = 0; slice < slices; slice++) {
                    const fr = new FileReader();
                    fr.readAsArrayBuffer(
                        file.slice(
                            slice * CHUNK_SIZE,
                            slice * CHUNK_SIZE + Math.min(CHUNK_SIZE, file.size - slice * CHUNK_SIZE),
                        ),
                    );
                    fr.onload = e => {
                        socket.emit("Asset.Upload", {
                            name: file.name,
                            directory: target,
                            data: fr.result,
                            slice,
                            totalSlices: slices,
                            uuid,
                        });
                    };
                }
            }
        },
    },
    delimiters: ["[[", "]]"],
});

(<any>window).vm = vm;
export default vm;