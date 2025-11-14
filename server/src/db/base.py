from playhouse.shortcuts import ThreadSafeDatabaseMetadata
from playhouse.signals import Model
from playhouse.sqlite_ext import SqliteExtDatabase

from .db import db
from .typed import TypedModel


class BaseDbModel(TypedModel, Model):
    class Meta:
        database = db
        model_metadata_class = ThreadSafeDatabaseMetadata
        legacy_table_names = False


class BaseViewModel(BaseDbModel):
    @classmethod
    def create_view(cls, db: SqliteExtDatabase):
        raise NotImplementedError("Implement this!")
