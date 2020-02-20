from urllib.parse import unquote

from aiohttp_security import authorized_userid

from .location import load_location
from app import logger, sio, state
from models import Asset, Label, LabelSelection, Location, Room, User


@sio.on("connect", namespace="/planarally")
async def connect(sid, environ):
    user = await authorized_userid(environ["aiohttp.request"])
    if user is None:
        await sio.emit("redirect", "/", room=sid, namespace="/planarally")
    else:
        ref = {
            k.split("=")[0]: k.split("=")[1]
            for k in unquote(environ["QUERY_STRING"]).strip().split("&")
        }
        try:
            room = (
                Room.select()
                .join(User)
                .where((Room.name == ref["room"]) & (User.name == ref["user"]))[0]
            )
        except IndexError:
            return False
        else:
            if user != room.creator and (
                user not in [pr.player for pr in room.players] or room.is_locked
            ):
                return False

        if room.creator == user:
            location = Location.get(room=room, name=room.dm_location)
        else:
            location = Location.get(room=room, name=room.player_location)

        state.add_sid(sid, user=user, room=room, location=location)

        logger.info(f"User {user.name} connected with identifier {sid}")

        labels = Label.select().where((Label.user == user) | (Label.visible == True))
        label_filters = LabelSelection.select().where(
            (LabelSelection.user == user) & (LabelSelection.room == room)
        )

        sio.enter_room(sid, location.get_path(), namespace="/planarally")
        await sio.emit("Username.Set", user.name, room=sid, namespace="/planarally")
        await sio.emit(
            "Labels.Set",
            [l.as_dict() for l in labels],
            room=sid,
            namespace="/planarally",
        )
        await sio.emit(
            "Labels.Filters.Set",
            [l.label.uuid for l in label_filters],
            room=sid,
            namespace="/planarally",
        )
        await sio.emit(
            "Room.Info.Set",
            {
                "name": room.name,
                "creator": room.creator.name,
                "invitationCode": str(room.invitation_code),
                "isLocked": room.is_locked,
                "players": [
                    {"id": rp.player.id, "name": rp.player.name} for rp in room.players
                ],
            },
            room=sid,
            namespace="/planarally",
        )
        await sio.emit(
            "Asset.List.Set",
            Asset.get_user_structure(user),
            room=sid,
            namespace="/planarally",
        )
        await load_location(sid, location)


@sio.on("disconnect", namespace="/planarally")
async def test_disconnect(sid):
    if sid not in state.sid_map:
        return
    user = state.sid_map[sid]["user"]

    logger.info(f"User {user.name} disconnected with identifier {sid}")
    await state.remove_sid(sid)
