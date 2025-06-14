from aiohttp import web

from ...config import cfg


async def get_limit(_request: web.Request):
    return web.json_response(cfg().webserver.max_upload_size_in_bytes)
