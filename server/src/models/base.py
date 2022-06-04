from playhouse.signals import Model

from .db import db
from .typed import TypedModel


class BaseModel(TypedModel, Model):
    class Meta:
        database = db
        legacy_table_names = False
