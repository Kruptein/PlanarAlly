import { POSITION, useToast } from "vue-toastification";

import type {
    ApiNote,
    ApiNoteAccessEdit,
    ApiNoteRoomLink,
    ApiNoteSetBoolean,
    ApiNoteSetString,
    ApiNoteShape,
} from "../../../apiTypes";
import SingleButtonToastVue from "../../../core/components/toasts/SingleButtonToast.vue";
import { coreStore } from "../../../store/core";
import { socket } from "../../api/socket";
import { getLocalId } from "../../id";

import type { NoteId } from "./types";
import { popoutNote } from "./ui";

import { noteSystem } from ".";

const toast = useToast();

socket.on("Note.Add", async (data: ApiNote) => {
    await noteSystem.newNote(data, false);

    if (data.creator === coreStore.state.username) return;

    toast.info(
        {
            component: SingleButtonToastVue,
            props: {
                text: `You were granted access to a note: ${data.title}`,
                buttonText: "Open",
                onClick: () => popoutNote(data.uuid),
            },
        },
        {
            position: POSITION.TOP_RIGHT,
            timeout: 10_000,
        },
    );
});

socket.on("Note.Remove", (data: NoteId) => noteSystem.removeNote(data, false));

socket.on("Note.Title.Set", (data: ApiNoteSetString) => {
    noteSystem.setTitle(data.uuid, data.value, false);
});

socket.on("Note.Text.Set", (data: ApiNoteSetString) => {
    noteSystem.setText(data.uuid, data.value, false);
});

socket.on("Note.Tag.Add", async (data: ApiNoteSetString) => {
    await noteSystem.addTag(data.uuid, data.value, false);
});

socket.on("Note.Tag.Remove", (data: ApiNoteSetString) => {
    noteSystem.removeTag(data.uuid, data.value, false);
});

socket.on("Note.Access.Add", (data: ApiNoteAccessEdit) => {
    const { note, name, ...rest } = data;
    noteSystem.addAccess(note, name, rest, false);
});

socket.on("Note.Access.Edit", (data: ApiNoteAccessEdit) => {
    const { note, name, ...rest } = data;
    noteSystem.setAccess(note, name, rest, false);
});

socket.on("Note.Access.Remove", (data: ApiNoteSetString) => {
    noteSystem.removeAccess(data.uuid, data.value, false);
});

socket.on("Note.Shape.Add", (data: ApiNoteShape) => {
    const id = getLocalId(data.shape_id);
    if (id === undefined) return;
    noteSystem.attachShape(data.note_id, id, false);
});
socket.on("Note.Shape.Remove", (data: ApiNoteShape) => {
    const id = getLocalId(data.shape_id);
    if (id === undefined) return;
    noteSystem.removeShape(data.note_id, id, false);
});

socket.on("Note.ShowOnHover.Set", (data: ApiNoteSetBoolean) => {
    noteSystem.setShowOnHover(data.uuid, data.value, false);
});

socket.on("Note.ShowIconOnShape.Set", (data: ApiNoteSetBoolean) => {
    noteSystem.setShowIconOnShape(data.uuid, data.value, false);
});

socket.on("Note.Room.Link", (data: ApiNoteRoomLink) => {
    noteSystem.linkToRoom(data.note, data.roomCreator, data.roomName, data.locationId, data.locationName, false);
});

socket.on("Note.Room.Unlink", (data: ApiNoteRoomLink) => {
    noteSystem.removeRoomLink(data.note, data.roomCreator, data.roomName, data.locationId, false);
});
