import os
import subprocess
from aiohttp import web

try:
    with open("VERSION", "r") as version_file:
        version = version_file.read()

    try:
        version = (
            subprocess.check_output(["git", "describe", "--tags"])
            .strip()
            .decode("utf-8")
        )
    except:
        pass

    if "PA_GIT_INFO" in os.environ:
        version = os.environ["PA_GIT_INFO"]

except:
    version = None


async def get_version(request: web.Request):
    if version is None:
        return web.HTTPInternalServerError(reason="Version file could not be loaded")

    return web.json_response({"version": version})
