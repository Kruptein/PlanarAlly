import auth
from app import app, logger, sio, state
from models import Note
from models.db import db


@sio.on("Note.New", namespace="/planarally")
@auth.login_required(app, sio)
async def new_note(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if Note.get_or_none(uuid=data["uuid"]):
        logger.warning(
            f"{user.name} tried to overwrite existing note with id: '{data['uuid']}'"
        )
        return

    Note.create(
        uuid=data["uuid"], title=data["title"], text=data["text"], user=user, room=room
    )


@sio.on("Note.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_note(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    note = Note.get_or_none(uuid=data["uuid"])

    if not note:
        logger.warning(
            f"{user.name} tried to update non-existant note with id: '{data['uuid']}'"
        )
        return

    if note.user != user:
        logger.warn(f"{user.name} tried to update note not belonging to him/her.")
    else:
        with db.atomic():
            note.title = data["title"]
            note.text = data["text"]
            note.save()


@sio.on("Note.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def delete_note(sid, uuid):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(
            f"{user.name} tried to remove non-existant note with id: '{uuid}'"
        )
        return

    note.delete_instance()
