from enum import Enum
from typing import TypeVar

from pydantic import BaseModel


class TypeIdModel(BaseModel):
    class Config:
        @staticmethod
        def schema_extra(schema) -> None:
            for prop in schema["properties"].values():
                if prop.get("type", None) == "array":
                    items = prop["items"]
                    if prop.get("typeId", False):
                        items["enum"] = [prop["typeId"]]
                elif prop.get("anyOf", False):
                    if prop.get("typeId", False):
                        prop["anyOf"][0]["enum"] = [prop["typeId"]]
                elif prop.get("typeId", False):
                    prop["enum"] = [prop["typeId"]]


class Nullable(Enum):
    null = None


T = TypeVar("T")


def _(x: T | None) -> T | Nullable:
    if x is None:
        return Nullable.null
    return x
