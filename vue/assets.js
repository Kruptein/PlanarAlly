import Vue from 'vue';
import { uuidv4 } from '../ts_src/utils'
import contextmenu from './components/contextmenu.vue';
import prompt from './components/modals/prompt.vue';
import confirm from './components/modals/confirm.vue';

// ** SOCKET COMMUNICATION ** //
const socket = io.connect(location.protocol + "//" + location.host + "/pa_assetmgmt");
socket.on("connect", function () {
    console.log("Connected");
});
socket.on("disconnect", function () {
    console.log("Disconnected");
});
socket.on("redirect", function (destination) {
    console.log("redirecting");
    window.location.href = destination;
});
socket.on("assetInfo", function (assetInfo) {
    app.assetInfo = assetInfo;
})
socket.on("uploadAssetResult", function (fileData) {
    let folder = app.assetInfo;
    for (let key of fileData.directory) {
        folder = folder[key];
    }
    if (!folder['__files']) Vue.set(folder, '__files', []);
    folder['__files'].push(fileData.fileInfo);
});

Vue.component('cm', {
    components: {
        contextmenu
    },
    data: function () {
        return {
            visible: false,
            left: 0,
            top: 0
        }
    },
    template: `
        <contextmenu :visible="visible" :left="left" :top="top" @close="close">
            <li @click='rename'>Rename</li>
            <li @click='remove'>Remove</li>
        </contextmenu>
    `,
    methods: {
        open: function (event, index, inode) {
            if (inode === '..') return;

            if (!app.selected.includes(inode))
                app.select(event, index, inode);

            this.visible = true;
            this.left = `${event.pageX}px`;
            this.top = `${event.pageY}px`;
            this.$nextTick(function() {
                this.$children[0].$el.focus();
            }.bind(this));
        },
        close: function () {
            this.visible = false;
        },
        rename: function () {
            if (app.selected.length !== 1) return;
            const isFolder = app.inodes.findIndex(e => e === app.selected[0]) < app.folders.length;
            const oldName = isFolder ? app.selected[0] : app.selected[0].name;
            
            app.$refs.prompt.prompt("New name:", `Renaming ${oldName}`).then(
                name => {
                    socket.emit("rename", {
                        isFolder: isFolder,
                        oldName: oldName,
                        newName: name,
                        directory: app.currentDirectory
                    });

                    const folder = app.directory;
                    if (isFolder) {
                        Vue.set(folder, name, folder[oldName]);
                        Vue.delete(folder, oldName);
                    } else {
                        folder['__files'].find(f => f.name === oldName).name = name;
                    }
                },
                () => {}
            );
            this.close();
        },
        remove: function () {
            if (app.selected.length === 0) return;
            app.$refs.confirm.open("Are you sure you wish to remove this?").then(
                result => {
                    if (result) {
                        for (let sel of app.selected) {
                            const isFolder = app.inodes.findIndex(e => e === sel) < app.folders.length;
                            const name = isFolder ? sel : sel.name;
                            socket.emit("remove", {isFolder: isFolder, name: name, directory: app.currentDirectory});
            
                            const folder = app.directory;
                            if (isFolder) {
                                Vue.delete(folder, name);
                            } else {
                                folder['__files'].splice(folder['__files'].findIndex(f => f.name === name), 1);
                            }
                        }
                    }
                },
                () => {}
            );
            this.close();
        }
    }
})

const app = new Vue({
    el: '#AssetManager',
    components: {
        prompt,
        confirm
    },
    data: {
        assetInfo: {},
        currentDirectory: [],
        selected: [],
        draggingSelection: false
    },
    computed: {
        directory: function () {
            let folder = this.assetInfo;
            for (let key of this.currentDirectory) {
                folder = folder[key];
            }
            if (this.currentDirectory.length)
                folder['..'] = {};
            return folder;
        },
        folders: function() {
            const fold = Object.keys(this.directory).filter(el => !['__files', '..'].includes(el)).sort((a,b) => (a.toLowerCase() > b.toLowerCase()) ? 1 : -1);
            if (this.currentDirectory.length)
                fold.unshift('..');
            return fold;
        },
        files: function() {
            if (!('__files' in this.directory)) return [];
            return this.directory['__files'].concat().sort((a,b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
        },
        inodes: function() {
            return this.folders.concat(this.files);
        },
        firstSelectedFile: function () {
            for (let sel of this.selected) {
                const isFolder = this.inodes.findIndex(e => e === sel) < this.folders.length;
                if (!isFolder) {
                    return sel;
                }
            }
            return null;
        }
    },
    methods: {
        changeDirectory: function (nextFolder) {
            if (nextFolder === '..')
                this.currentDirectory.pop();
            else
                this.currentDirectory.push(nextFolder);
        },
        createDirectory: function () {
            const name = prompt("New folder name");
            if (name !== null) {
                socket.emit("createDirectory", {name: name, directory: this.currentDirectory});
                folder = app.directory;
                Vue.set(folder, name, {});
            }
        },
        moveInode: function (inode, target) {
            const isFolder = this.inodes.findIndex(e => e === inode) < this.folders.length;
            const name = isFolder ? inode : inode.name;
            const folder = this.directory;
            if (isFolder) {
                folder[target][name] = folder[name];
                Vue.delete(folder, name);
            } else {
                if (!folder[target]['__files']) Vue.set(folder[target], '__files', []);
                folder[target]['__files'].push(inode);
                folder['__files'] = folder['__files'].filter(el => el.hash !== inode.hash);
            }
        },
        select: function (event, index, inode) {
            const el = event.target.closest(".inode");
            if (index >= 0 && event.shiftKey && this.selected.length > 0) {
                const otherIndex = this.inodes.findIndex(el => el === this.selected[this.selected.length - 1]);
                for (let i=index; i !== otherIndex; (index < otherIndex) ? i++ : i--)
                    this.selected.push(this.inodes[i]);
            } else {
                if (!event.ctrlKey) {
                    this.selected = [];
                }
                this.selected.push(inode)
            }
        },
        startDrag: function (event, file) {
            event.dataTransfer.dropEffect = "move";
            if (!this.selected.includes(file))
                this.select(event, -1, file);
            this.draggingSelection = true;
        },
        moveDrag: function (event) {
            if (event.target.classList.contains("folder"))
                event.target.classList.add("inode-selected");
        },
        leaveDrag: function (event) {
            if (event.target.classList.contains("folder"))
                event.target.classList.remove("inode-selected");
        },
        stopDrag: function (event, target) {
            if (this.draggingSelection) {
                if (this.folders.includes(target) && !this.selected.includes(target)) {
                    for (let inode of this.selected) {
                        this.moveInode(inode, target);
                    }
                }
            } else if (event.dataTransfer.files.length > 0) {
                const targetDirectory = this.currentDirectory.slice();
                if (target !== ".")
                    targetDirectory.push(target);
                this.upload(event.dataTransfer.files, targetDirectory);
            }
            this.draggingSelection = false;
        },
        prepareUpload: function () {
            document.getElementById("files").click();
        },
        upload: function (fls, target) {
            if (fls === undefined)
                fls = document.getElementById("files").files;
            if (target === undefined)
                target = this.currentDirectory;
            const CHUNK_SIZE = 100000;
            for(let i=0; i < fls.length; i++) {
                const uid = uuidv4();
                const slices = Math.ceil(fls[i].size / CHUNK_SIZE)
                for (let slice = 0; slice < slices; slice++) {
                    const fr = new FileReader();
                    fr.readAsArrayBuffer(fls[i].slice(slice * CHUNK_SIZE, slice * CHUNK_SIZE + Math.min(CHUNK_SIZE, fls[i].size - slice * CHUNK_SIZE)));
                    fr.onload = (e) => {
                        socket.emit("uploadAsset", {
                            name: fls[i].name,
                            directory: target,
                            data: fr.result,
                            slice: slice,
                            totalSlices: slices,
                            uuid: uid
                        });
                    }
                }
            }
        }
    },
    delimiters: ['[[', ']]'],
});

window.app = app;