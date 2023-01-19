import json

from pydantic import BaseModel

from .api.models.helpers import Nullable


class PydanticJson(object):
    @staticmethod
    def dumps(*args, **kwargs):
        if "cls" not in kwargs:
            kwargs["cls"] = PydanticEncoder
        return json.dumps(*args, **kwargs)

    @staticmethod
    def loads(*args, **kwargs):
        return json.loads(*args, **kwargs)


class PydanticEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, BaseModel):
            return obj.dict()
        if isinstance(obj, Nullable):
            return None
        return json.JSONEncoder.default(self, obj)
