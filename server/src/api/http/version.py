import os
import subprocess
import tomllib

from aiohttp import web

from ...utils import FILE_DIR

release_version: str | None
env_version: str | None

try:
    with open(FILE_DIR / "pyproject.toml", "rb") as pyproject_file:
        release_version = tomllib.load(pyproject_file)["project"]["version"]

    env_version = release_version

    try:
        env_version = subprocess.check_output(["git", "describe", "--tags"]).strip().decode("utf-8")
    except:  # noqa: S110
        pass

    if "PA_GIT_INFO" in os.environ:
        env_version = os.environ["PA_GIT_INFO"]
except:
    release_version = None
    env_version = None


async def get_version(_request: web.Request):
    if env_version is None:
        return web.HTTPInternalServerError(reason="Version could not be loaded from pyproject.toml")

    from ...storage import get_storage

    return web.json_response(
        {
            "release": release_version,
            "env": env_version,
            "assetUrl": get_storage().get_public_url_base(),
        }
    )
