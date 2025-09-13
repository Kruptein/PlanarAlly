import importlib

# Import the standard json module by its full path to avoid circular import
python_json = importlib.import_module('json')


class PydanticJson(object):
    @staticmethod
    def dumps(*args, **kwargs):
        if "cls" not in kwargs:
            kwargs["cls"] = PydanticEncoder
        return python_json.dumps(*args, **kwargs)

    @staticmethod
    def loads(*args, **kwargs):
        return python_json.loads(*args, **kwargs)


class PydanticEncoder(python_json.JSONEncoder):
    def default(self, obj):
        # Import pydantic here to avoid circular import
        from pydantic import BaseModel
        if isinstance(obj, BaseModel):
            return obj.dict()
        return python_json.JSONEncoder.default(self, obj)
