from playhouse.signals import Model

from .db import db


class BaseModel(Model):
    abstract = False

    class Meta:
        database = db
        legacy_table_names = False
