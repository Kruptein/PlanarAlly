import asyncio
import io
from datetime import datetime
from typing import Dict, List, Optional, cast
from typing_extensions import TypedDict

from aiohttp import web
from aiohttp_security import check_authorized

from ...app import sio
from ...config import config
from ...export.campaign import export_campaign, import_campaign
from ...models import Location, LocationOptions, PlayerRoom, Room, User
from ...models.db import db
from ...models.role import Role
from ..socket.constants import DASHBOARD_NS


async def get_list(request: web.Request):
    user: User = await check_authorized(request)

    # We should rework this to a playerroom.as_dashboard_dict
    # to prevent these extra queries we're doing for the info
    return web.json_response(
        {
            "owned": [
                {**r.as_dashboard_dict(), "last_played": get_info(r, user)}
                for r in user.rooms_created
            ],
            "joined": [
                {**r.room.as_dashboard_dict(), "last_played": get_info(r.room, user)}
                for r in user.rooms_joined.join(Room).where(Room.creator != user)
            ],
        }
    )


def get_info(room: Room, user: User):
    info = room.players.where(PlayerRoom.player == user)

    last_played = cast(datetime, info[0].last_played)

    if last_played is None:
        return None
    else:
        return last_played.strftime("%Y/%m/%d")


async def set_info(request: web.Request):
    user: User = await check_authorized(request)

    creator = request.match_info["creator"]
    roomname = request.match_info["roomname"]

    data = await request.json()

    rooms = (
        PlayerRoom.select()
        .join(Room)
        .join(User)
        .filter(player=user)
        .where((User.name == creator) & (Room.name == roomname))
    )

    if len(rooms) != 1:
        return web.HTTPNotFound()

    room = rooms[0]

    if "notes" in data:
        room.notes = data["notes"]
    room.save()

    return web.HTTPOk()


async def create(request: web.Request):
    user: User = await check_authorized(request)
    data = await request.json()
    roomname = data["name"]
    logo = data["logo"]
    if not roomname:
        return web.HTTPBadRequest()
    else:

        if Room.get_or_none(name=roomname, creator=user):
            return web.HTTPConflict()

        with db.atomic():
            default_options = LocationOptions.create()
            room = Room.create(
                name=roomname,
                creator=user,
                default_options=default_options,
            )

            if logo >= 0:
                room.logo_id = logo

            loc = Location.create(room=room, name="start", index=1)
            loc.create_floor()
            PlayerRoom.create(player=user, room=room, role=Role.DM, active_location=loc)
            room.save()
        return web.HTTPOk()


async def patch(request: web.Request):
    user: User = await check_authorized(request)
    data = await request.json()

    creator = request.match_info["creator"]
    roomname = request.match_info["roomname"]

    if creator != user.name:
        return web.HTTPUnauthorized()

    new_name = data.get("name")
    new_logo = data.get("logo")

    if not any([new_name, new_logo]):
        return web.HTTPBadRequest()

    room = Room.get_or_none(name=roomname, creator=user)
    if room is None:
        return web.HTTPBadRequest()

    if new_name:
        if Room.filter(name=new_name, creator=user).count() > 0:
            return web.HTTPBadRequest()

        room.name = new_name

    if new_logo:
        room.logo_id = new_logo

    room.save()
    return web.HTTPOk()


async def delete(request: web.Request):
    user: User = await check_authorized(request)

    creator = request.match_info["creator"]
    roomname = request.match_info["roomname"]

    if creator == user.name:
        room = Room.get_or_none(name=roomname, creator=user)
        if room is None:
            return web.HTTPBadRequest()

        room.delete_instance(True)
        return web.HTTPOk()
    else:
        pr = (
            PlayerRoom.select()
            .join(Room)
            .join(User)
            .filter(player=user)
            .where((User.name == creator) & (Room.name == roomname))
        )
        if len(pr) == 1:
            pr[0].delete_instance(True)
            return web.HTTPOk()

    return web.HTTPUnauthorized()


async def export(request: web.Request):
    if not config.getboolean("General", "enable_export"):
        return web.HTTPForbidden()

    user: User = await check_authorized(request)

    creator = request.match_info["creator"]
    roomname = request.match_info["roomname"]

    if creator == user.name:
        room: Optional[Room] = Room.get_or_none(name=roomname, creator=user)
        if room is None:
            return web.HTTPBadRequest()

        await asyncio.create_task(export_campaign(f"{roomname}-{creator}", [room]))

        return web.HTTPAccepted(
            text=f"Processing started. Check /static/temp/{room.name}-{room.creator.name}.pac soon."
        )
    return web.HTTPUnauthorized()


async def export_all(request: web.Request):
    if not config.getboolean("General", "enable_export"):
        return web.HTTPForbidden()

    user: User = await check_authorized(request)

    creator = request.match_info["creator"]

    if creator == user.name:
        rooms = [r for r in user.rooms_created]

        asyncio.create_task(
            export_campaign(
                f"{creator}-all",
                rooms,
                export_all_assets=True,
            )
        )

        return web.HTTPAccepted(
            text=f"Processing started. Check /static/temp/{creator}-all.pac soon."
        )
    return web.HTTPUnauthorized()


class ImportData(TypedDict):
    totalLength: int
    chunks: List[Optional[bytes]]
    sid: Optional[str]


import_mapping: Dict[str, ImportData] = {}


async def import_info(request: web.Request):
    if not config.getboolean("General", "enable_export"):
        return web.HTTPForbidden(reason="Import is disabled by the server.")

    await check_authorized(request)

    name = request.match_info["name"]

    data = await request.json()

    try:
        length = data["totalChunks"]
    except KeyError:
        return web.HTTPBadRequest(
            reason="Bad Request: something went wrong with this import request. (missing chunk length)"
        )

    try:
        length = int(length)
    except ValueError:
        return web.HTTPBadRequest(
            reason="Bad Request: something went wrong with this import request. (Chunk Length is not an integer)"
        )

    import_mapping[name] = {
        "totalLength": length,
        "chunks": [None for _ in range(length)],
        "sid": data.get("sid", None),
    }

    # todo: some timer / or other condition to clear the import_mapping

    return web.HTTPOk()


async def import_chunk(request: web.Request):
    if not config.getboolean("General", "enable_export"):
        return web.HTTPForbidden()

    user: User = await check_authorized(request)

    name = request.match_info["name"]
    try:
        chunk = int(request.match_info["chunk"])
    except ValueError:
        return web.HTTPBadRequest()

    print(f"Got chunk {chunk} for {name}")

    if name not in import_mapping:
        return web.HTTPNotFound()
    if not (0 <= chunk < import_mapping[name]["totalLength"]):
        return web.HTTPBadRequest()

    data = await request.read()

    import_mapping[name]["chunks"][chunk] = data
    sid = import_mapping[name]["sid"]

    await sio.emit("Campaign.Import.Chunk", chunk, room=sid, namespace=DASHBOARD_NS)

    chunks = import_mapping[name]["chunks"]
    if all(chunks):
        print(f"Got all chunks for {name}")
        await asyncio.create_task(
            import_campaign(
                user,
                io.BytesIO(b"".join(cast(List[bytes], chunks))),
                sid=sid,
            )
        )
        del import_mapping[name]

    return web.HTTPOk()
