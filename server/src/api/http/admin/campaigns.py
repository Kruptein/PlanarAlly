from typing import List, cast

from aiohttp import web

from models.campaign import Room


async def collect(_request: web.Request) -> web.Response:
    rooms = cast(List[Room], Room.select())
    rooms_response = [{"name": r.name, "creator": r.creator.name} for r in rooms]
    return web.json_response(rooms_response)
