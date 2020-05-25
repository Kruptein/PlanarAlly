import os
import subprocess
from typing import Optional

from aiohttp import web

release_version: Optional[str]
env_version: Optional[str]
changelog: Optional[str]

try:
    with open("VERSION", "r") as version_file:
        release_version, _, *changelog = version_file.read().splitlines()

    env_version = release_version

    try:
        env_version = (
            subprocess.check_output(["git", "describe", "--tags"])
            .strip()
            .decode("utf-8")
        )
    except:
        pass

    if "PA_GIT_INFO" in os.environ:
        env_version = os.environ["PA_GIT_INFO"]
except:
    release_version = None
    env_version = None


async def get_version(request: web.Request):
    if env_version is None:
        return web.HTTPInternalServerError(reason="Version file could not be loaded")

    return web.json_response({"release": release_version, "env": env_version})


async def get_changelog(request: web.Request):
    if changelog is None:
        return web.HTTPInternalServerError(reason="Version file could not be loaded")

    return web.json_response({"changelog": "\n".join(changelog)})
