from playhouse.shortcuts import ThreadSafeDatabaseMetadata
from playhouse.signals import Model

from .db import db
from .typed import TypedModel


class BaseModel(TypedModel, Model):
    class Meta:
        database = db
        model_metadata_class = ThreadSafeDatabaseMetadata
        legacy_table_names = False
