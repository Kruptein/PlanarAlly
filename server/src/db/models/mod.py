from datetime import date
from typing import cast

from peewee import BooleanField, DateField, ForeignKeyField, TextField

from ...api.models.mods import ApiModMeta
from ..base import BaseDbModel
from .user import User


class Mod(BaseDbModel):
    id: int

    tag = cast(str, TextField())
    name = cast(str, TextField())
    version = cast(str, TextField())
    hash = cast(str, TextField())

    author = cast(str, TextField())
    description = cast(str, TextField())
    short_description = cast(str, TextField())

    api_schema = cast(str, TextField())

    first_uploaded_at = cast(date, DateField())
    first_uploaded_by = cast(
        User,
        ForeignKeyField(User, backref="mods_uploaded", on_delete="SET NULL", null=True),
    )

    has_css = cast(bool, BooleanField())

    def __repr__(self):
        return f"<Mod {self.tag}-{self.version}-{self.hash[:8]}>"

    @property
    def mod_id(self):
        return f"{self.tag}-{self.version}-{self.hash}"

    def as_pydantic(self):
        return ApiModMeta(
            apiSchema=self.api_schema,
            tag=self.tag,
            name=self.name,
            version=self.version,
            hash=self.hash,
            author=self.author,
            description=self.description,
            shortDescription=self.short_description,
            hasCss=self.has_css,
        )
