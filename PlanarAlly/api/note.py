import auth
from app import sio, app, logger


@sio.on("Note.New", namespace="/planarally")
@auth.login_required(app, sio)
async def new_note(sid, data):
    username = app['AuthzPolicy'].sid_map[sid]['user'].name
    room = app['AuthzPolicy'].sid_map[sid]['room']

    if data["uuid"] in room.notes:
        logger.warning(f"{username} tried to overwrite existing note with id: '{data['uuid']}'")
        return

    room.add_new_note(data, username)


@sio.on("Note.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_note(sid, data):
    username = app['AuthzPolicy'].sid_map[sid]['user'].name
    room = app['AuthzPolicy'].sid_map[sid]['room']

    if data["uuid"] not in room.notes:
        logger.warning(f"{username} tried to update non-existant note with id: '{data['uuid']}'")
        return

    room.update_note(data, username)


@sio.on("Note.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def delete_note(sid, uuid):
    username = app['AuthzPolicy'].sid_map[sid]['user'].name
    room = app['AuthzPolicy'].sid_map[sid]['room']

    if uuid not in room.notes:
        logger.warning(f"{username} tried to remove non-existant note with id: '{uuid}'")
        return

    room.delete_note(uuid, username)
