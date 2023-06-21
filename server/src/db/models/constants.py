from typing import cast

from peewee import BlobField, IntegerField, TextField

from ..base import BaseDbModel


class Constants(BaseDbModel):
    save_version = IntegerField()
    secret_token = cast(bytes, BlobField())
    api_token = TextField()
