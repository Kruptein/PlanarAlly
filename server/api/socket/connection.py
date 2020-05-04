from urllib.parse import unquote

from aiohttp_security import authorized_userid

from .location import load_location
from app import logger, sio
from models import Asset, Label, LabelSelection, Location, PlayerRoom, Room, User
from models.role import Role
from state.game import game_state


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
            for pr in room.players:
                if pr.player == user:
                    if pr.role != Role.DM and room.is_locked:
                        return False
                    break
            else:
                return False

        pr = PlayerRoom.get(room=room, player=user)

        # todo: just store PlayerRoom as it has all the info
        await game_state.add_sid(sid, pr)

        logger.info(f"User {user.name} connected with identifier {sid}")

        labels = Label.select().where((Label.user == user) | (Label.visible == True))
        label_filters = LabelSelection.select().where(
            (LabelSelection.user == user) & (LabelSelection.room == room)
        )

        sio.enter_room(sid, pr.active_location.get_path(), namespace="/planarally")
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
                "default_options": room.default_options.as_dict(),
                "players": [
                    {
                        "id": rp.player.id,
                        "name": rp.player.name,
                        "location": rp.active_location.id,
                    }
                    for rp in room.players
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
        if pr.role == Role.DM:
            await sio.emit(
                "Locations.Settings.Set",
                {
                    l.name: {} if l.options is None else l.options.as_dict()
                    for l in pr.room.locations
                },
                room=sid,
                namespace="/planarally",
            )
        await load_location(sid, pr.active_location)


@sio.on("disconnect", namespace="/planarally")
async def disconnect(sid):
    if not game_state.has_sid(sid):
        return

    user = game_state.get_user(sid)

    logger.info(f"User {user.name} disconnected with identifier {sid}")
    await game_state.remove_sid(sid)
