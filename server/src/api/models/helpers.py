from typing import TypeVar

from pydantic import BaseModel, ConfigDict
from pydantic_core import MISSING

T = TypeVar("T")


def missing_to_none(value: T | MISSING) -> T | None:
    if value is MISSING:
        return None
    return value


def schema_extra(schema) -> None:
    for name, prop in schema["properties"].items():
        # All of the below deal with adding custom types in the outputted js interfaces
        # e.g. changing `string` to be `DID` where `DID` is a typescript type in the client
        prop_type = prop.get("type", None)
        if prop_type == "array" or (prop_type and len(prop_type) > 1 and prop_type[0] == "array"):
            items = prop["items"]
            if "typeId" in prop:
                items["enum"] = [prop["typeId"]]
                del prop["typeId"]
            if "missing" in prop:
                if name in schema["required"]:
                    schema["required"].remove(name)
                del prop["missing"]
        elif "anyOf" in prop:
            if prop.get("typeId", False):
                if "items" in prop["anyOf"][0]:
                    prop["anyOf"][0]["items"]["enum"] = [prop["typeId"]]
                else:
                    prop["anyOf"][0]["enum"] = [prop["typeId"]]
        else:
            if "typeId" in prop:
                prop["enum"] = [prop["typeId"]]
                del prop["typeId"]
            if "missing" in prop:
                if name in schema["required"]:
                    schema["required"].remove(name)
                del prop["missing"]


class TypeIdModel(BaseModel):
    model_config = ConfigDict(extra="forbid", json_schema_extra=schema_extra)
