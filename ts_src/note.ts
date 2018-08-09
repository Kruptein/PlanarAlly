import { socket } from "./socket";
import gameManager from "./planarally";
import { Dictionary } from "../node_modules/@types/lodash/index";

export default class Note {
    name: string
    text: string
    uuid: string
    dialog: JQuery

    constructor(public Name:string, public Text: string, uid: string) {
        this.name = Name;
        this.text = Text;
        this.uuid = uid;
        this.dialog = $('<div class="dialog notedialog" title="Note"><textarea class="spanrow">' + this.text + '</textarea></div>');

        this.dialog.dialog({
            title: this.name,
            autoOpen: false,
            width: 'auto',
            resizable: false,
            buttons: [
                {
                    text: "Rename",
                    icon: "ui-icon-pencil",
                    click: () => {
                        let renameDialog = $('<div class="dialog"><input type="text" id="renameNote"></div>');
                        renameDialog.dialog({
                            title: "Renaming: '" + this.name + "'",
                            autoOpen: true,
                            width: 'auto',
                            resizable: false,
                            buttons: [
                                {
                                    text: "Confirm",
                                    icon: "ui-icon-check",
                                    click: () => {
                                        let editName = renameDialog.children().eq(0);

                                        this.name = <string> editName.val();
                                        this.dialog.dialog({
                                            title: this.name
                                        });

                                        $('#menu-notes button[note-id=' + this.uuid + ']').html(this.name);
                                        this.updateNote();

                                        renameDialog.dialog("close");
                                    }
                                },
                                {
                                    text: "Cancel",
                                    icon: "ui-icon-cancel",
                                    click: function() {
                                        $(this).dialog("close");
                                    }
                                },
                            ]
                        });
                    }
                },
                {
                    text: "Delete",
                    icon: "ui-icon-trash",
                    click: () => {
                        $('#menu-notes button[note-id="' + this.uuid + '"]').remove();
                        gameManager.notes.remove(this.uuid);
                        this.dialog.dialog("close");
                        this.dialog.remove();
                        socket.emit("deleteNote", this.uuid);
                    },
                    showText: false
                }
            ]
        });
        this.dialog.children().eq(0).bind('input propertychange', () => {
            this.text = <string> this.dialog.children().eq(0).val();
            this.updateNote();
        });
    }

    updateNote() {
        socket.emit("updateNote", this.asDict());
    }

    show(): void {
        this.dialog.dialog({title: this.name});
        this.dialog.children().eq(0).val(this.text);
        this.dialog.dialog("open");
    }

    asDict(): Dictionary<string> {
        return {"uuid": this.uuid, "name": this.name, "text": this.text};
    }
}