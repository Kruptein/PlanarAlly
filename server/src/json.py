import json

from pydantic import BaseModel


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
    def default(self, o):
        if isinstance(o, BaseModel):
            return o.model_dump()
        return json.JSONEncoder.default(self, o)
