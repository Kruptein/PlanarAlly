import hashlib
import io
from datetime import datetime
from zipfile import BadZipFile, ZipFile

import rtoml
from aiohttp import web
from pydantic import BaseModel, ValidationError

from ...auth import get_authorized_user
from ...db.models.mod import Mod
from ...utils import MODS_DIR
from ..models.mods import CoreModMeta


class Config(BaseModel):
    mod: CoreModMeta


async def upload(request: web.Request) -> web.Response:
    user = await get_authorized_user(request)

    data = await request.read()

    hash_data = hashlib.sha256(data).hexdigest()

    try:
        with ZipFile(io.BytesIO(data)) as zip_file:
            files = zip_file.namelist()

            if "mod.toml" not in files:
                return web.HTTPBadRequest(text="Invalid mod: mod.toml not found")
            if "index.js" not in files:
                return web.HTTPBadRequest(text="Invalid mod: index.js not found")

            has_css = "index.css" in files

            try:
                mod_meta = Config(
                    **rtoml.load(zip_file.read("mod.toml").decode("utf-8")),
                )
            except (rtoml.TomlParsingError, UnicodeDecodeError):
                return web.HTTPBadRequest(text="Invalid mod: mod.toml could not be opened")
            except ValidationError as e:
                return web.HTTPBadRequest(text=f"Invalid mod: mod.toml validation failed ({e})")

            # Because the mod id and version are read from the zip file,
            # and we hash the entire zip file, it should not be possible to mess with the naming scheme
            target_folder = MODS_DIR / f"{mod_meta.mod.tag}-{mod_meta.mod.version}-{hash_data}"
            if not target_folder.exists():
                target_folder.mkdir(parents=True)
                zip_file.extractall(target_folder)

            # Create the mod entry in the DB if it doesn't exist yet
            mod, _ = Mod.get_or_create(
                tag=mod_meta.mod.tag,
                name=mod_meta.mod.name,
                version=mod_meta.mod.version,
                hash=hash_data,
                defaults={
                    "api_schema": mod_meta.mod.apiSchema,
                    "first_uploaded_at": datetime.now(),
                    "first_uploaded_by": user,
                    "author": mod_meta.mod.author,
                    "description": mod_meta.mod.description,
                    "short_description": mod_meta.mod.shortDescription,
                    "has_css": has_css,
                },
            )

    except BadZipFile:
        return web.HTTPBadRequest(text="Invalid mod: not a valid pam file")

    return web.json_response(mod.as_pydantic().model_dump())
