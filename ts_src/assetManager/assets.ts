import * as io from "socket.io-client";
import Vue from "vue";

import contextmenu from "../core/components/contextmenu.vue";
import confirm from "../core/components/modals/confirm.vue";
import prompt from "../core/components/modals/prompt.vue";
import { uuidv4 } from "../core/utils";
import { AssetFile, AssetList } from "../game/api_types";

// ** SOCKET COMMUNICATION ** //
const socket = io.connect(location.protocol + "//" + location.host + "/pa_assetmgmt");
socket.on("connect", () => {
    console.log("Connected");
});
socket.on("disconnect", () => {
    console.log("Disconnected");
});
socket.on("redirect", (destination: string) => {
    console.log("redirecting");
    window.location.href = destination;
});
socket.on("assetInfo", (assetInfo: AssetList) => {
    vm.assetInfo = assetInfo;
});
socket.on("uploadAssetResult", (fileData: { directory: string[]; fileInfo: { hash: string; name: string } }) => {
    let folder = vm.assetInfo;
    for (const key of fileData.directory) {
        folder = <AssetList>folder[key];
    }
    if (!folder.__files) Vue.set(folder, "__files", []);
    (<AssetFile[]>folder.__files).push(fileData.fileInfo);
});

Vue.component("cm", {
    components: {
        contextmenu,
    },
    data: () => ({
        visible: false,
        left: 0,
        top: 0,
    }),
    template: `
        <contextmenu :visible="visible" :left="left + 'px'" :top="top + 'px'" @close="close">
            <li @click='rename'>Rename</li>
            <li @click='remove'>Remove</li>
        </contextmenu>
    `,
    methods: {
        open(event: MouseEvent, index: number, inode: string) {
            if (inode === "..") return;

            if (!vm.selected.includes(inode)) vm.select(event, index, inode);

            this.visible = true;
            this.left = event.pageX;
            this.top = event.pageY;
            this.$nextTick(() => {
                this.$children[0].$el.focus();
            });
        },
        close() {
            this.visible = false;
        },
        rename() {
            if (vm.selected.length !== 1) return;
            const isFolder = vm.inodes.findIndex(e => e === vm.selected[0]) < vm.folders.length;
            const oldName = isFolder ? <string>vm.selected[0] : (<AssetFile>vm.selected[0]).name;

            (<any>vm.$refs.prompt).prompt("New name:", `Renaming ${oldName}`).then(
                (name: string) => {
                    socket.emit("rename", {
                        isFolder,
                        oldName,
                        newName: name,
                        directory: vm.currentDirectory,
                    });

                    const folder = vm.directory;
                    if (isFolder) {
                        Vue.set(folder, name, folder[oldName]);
                        Vue.delete(folder, oldName);
                    } else {
                        const fls = <AssetFile[]>folder.__files;
                        fls.find(f => f.name === oldName)!.name = name;
                    }
                },
                () => {},
            );
            this.close();
        },
        remove() {
            if (vm.selected.length === 0) return;
            (<any>vm.$refs.confirm).open("Are you sure you wish to remove this?").then(
                (result: boolean) => {
                    if (result) {
                        for (const sel of vm.selected) {
                            const isFolder = vm.inodes.findIndex(e => e === sel) < vm.folders.length;
                            const name = isFolder ? <string>sel : (<AssetFile>sel).name;
                            socket.emit("remove", { isFolder, name, directory: vm.currentDirectory });

                            const folder = vm.directory;
                            if (isFolder) {
                                Vue.delete(folder, name);
                            } else {
                                const fls = <AssetFile[]>folder.__files;
                                fls.splice(fls.findIndex(f => f.name === name), 1);
                            }
                        }
                    }
                },
                () => {},
            );
            this.close();
        },
    },
});

const vm = new Vue({
    el: "#AssetManager",
    components: {
        prompt,
        confirm,
    },
    data: {
        assetInfo: <AssetList>{},
        currentDirectory: <string[]>[],
        selected: <(string | AssetFile)[]>[],
        draggingSelection: false,
    },
    computed: {
        directory(): AssetList {
            let folder = this.assetInfo;
            for (const key of this.currentDirectory) {
                folder = <AssetList>folder[key];
            }
            if (this.currentDirectory.length) folder[".."] = {};
            return folder;
        },
        folders(): string[] {
            const fold = Object.keys(this.directory)
                .filter(el => !["__files", ".."].includes(el))
                .sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1));
            if (this.currentDirectory.length) fold.unshift("..");
            return fold;
        },
        files(): AssetFile[] {
            if (!("__files" in this.directory)) return [];
            return (<AssetFile[]>this.directory.__files)
                .concat()
                .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
        },
        inodes(): (string | AssetFile)[] {
            const fo: (string | AssetFile)[] = this.folders;
            const fi: (string | AssetFile)[] = this.files;
            return fo.concat(fi);
        },
        firstSelectedFile(): AssetFile | null {
            for (const sel of this.selected) {
                const isFolder = this.inodes.findIndex(e => e === sel) < this.folders.length;
                if (!isFolder) {
                    return <AssetFile>sel;
                }
            }
            return null;
        },
    },
    methods: {
        getDirectory(path: string[]) {
            let folder = this.assetInfo;
            for (const key of path) {
                folder = <AssetList>folder[key];
            }
            return folder;
        },
        changeDirectory(nextFolder: string) {
            if (nextFolder === "..") this.currentDirectory.pop();
            else this.currentDirectory.push(nextFolder);
        },
        createDirectory() {
            const name = window.prompt("New folder name");
            if (name !== null) {
                socket.emit("createDirectory", { name, directory: this.currentDirectory });
                const folder = this.directory;
                Vue.set(folder, name, {});
            }
        },
        moveInode(inode: string | AssetFile, target: string) {
            const isFolder = this.inodes.findIndex(e => e === inode) < this.folders.length;
            const name = isFolder ? <string>inode : (<AssetFile>inode).name;
            const folder = this.directory;
            const targetDirectory =
                target === ".." ? this.currentDirectory.slice(0, -1) : this.currentDirectory.concat(target);
            const targetFolder = this.getDirectory(targetDirectory);
            if (isFolder) {
                targetFolder[name] = folder[name];
                Vue.delete(folder, name);
            } else {
                if (!targetFolder.__files) Vue.set(targetFolder, "__files", []);
                (<AssetFile[]>targetFolder.__files).push(<AssetFile>inode);
                folder.__files = (<AssetFile[]>folder.__files).filter(el => el.hash !== (<AssetFile>inode).hash);
            }
            socket.emit("moveInode", {
                isFolder,
                directory: this.currentDirectory,
                inode,
                target,
            });
        },
        select(event: MouseEvent, index: number, inode: string | AssetFile) {
            if (index >= 0 && event.shiftKey && this.selected.length > 0) {
                const otherIndex = this.inodes.findIndex(el => el === this.selected[this.selected.length - 1]);
                for (let i = index; i !== otherIndex; index < otherIndex ? i++ : i--)
                    this.selected.push(this.inodes[i]);
            } else {
                if (!event.ctrlKey) {
                    this.selected = [];
                }
                this.selected.push(inode);
            }
        },
        startDrag(event: DragEvent, file: string | AssetFile) {
            event.dataTransfer.setData('Hack', 'ittyHack');
            event.dataTransfer.dropEffect = "move";
            if (!this.selected.includes(file)) this.select(event, -1, file);
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
        stopDrag(event: DragEvent, target: string) {
            (<HTMLElement>event.target).classList.remove("inode-selected");
            if (this.draggingSelection) {
                if (this.folders.includes(target) && !this.selected.includes(target)) {
                    for (const inode of this.selected) {
                        this.moveInode(inode, target);
                    }
                }
                this.selected = [];
            } else if (event.dataTransfer.files.length > 0) {
                const targetDirectory = this.currentDirectory.slice();
                if (target !== ".") targetDirectory.push(target);
                this.upload(event.dataTransfer.files, targetDirectory);
            }
            this.draggingSelection = false;
        },
        prepareUpload() {
            document.getElementById("files")!.click();
        },
        upload(fls?: FileList, target?: string[]) {
            const files = (<HTMLInputElement>document.getElementById("files")!).files;
            if (fls === undefined) {
                if (files) fls = files;
                else return;
            }
            if (target === undefined) target = this.currentDirectory;
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
                        socket.emit("uploadAsset", {
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
