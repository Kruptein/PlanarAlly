from peewee import Model
from playhouse.shortcuts import model_to_dict

from . import db

class BaseModel(Model):
    class Meta:
        database = db
        legacy_table_names = False
