from datetime import datetime
from typing import cast
from uuid import uuid4

from peewee import BlobField, DateTimeField, IntegerField, TextField

from ..base import BaseDbModel


class Constants(BaseDbModel):
    save_version = IntegerField()
    secret_token = cast(bytes, BlobField())
    api_token = TextField()

    # Stats data
    stats_uuid = cast(str, TextField(null=True, default=uuid4))
    last_export_date = cast(datetime, DateTimeField(null=True, default=None))
