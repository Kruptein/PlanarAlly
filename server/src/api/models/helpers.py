from typing import TypeVar

from pydantic import BaseModel, Extra


class TypeIdModel(BaseModel):
    class Config:
        extra = Extra.forbid

        @staticmethod
        def schema_extra(schema) -> None:
            for prop in schema["properties"].values():
                if prop.get("noneAsNull", False):
                    prop["type"] = [prop["type"], "null"]
                if prop.get("type", None) == "array":
                    items = prop["items"]
                    if "typeId" in prop:
                        items["enum"] = [prop["typeId"]]
                elif "anyOf" in prop:
                    if prop.get("typeId", False):
                        prop["anyOf"][0]["enum"] = [prop["typeId"]]
                elif "typeId" in prop:
                    prop["enum"] = [prop["typeId"]]


T = TypeVar("T")
