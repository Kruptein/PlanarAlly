import os
from collections import defaultdict

from aiohttp import web

from ...utils import STATIC_DIR

# The below code is a shitty way to get the mod list
# this is temporary stuff (TM), hence why I don't really mind

_mods = defaultdict(set)

for fl in os.listdir(STATIC_DIR / "mods"):
    name, ext = fl.rsplit(".")
    _mods[name].add(ext)

mods = []
for name, extensions in _mods.items():
    if "js" in extensions:
        mods.append({"name": name, "hasCss": "css" in extensions})


async def collect(_request: web.Request) -> web.Response:
    return web.json_response(mods)
