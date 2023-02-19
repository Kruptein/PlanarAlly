from typing import TypeVar

from pydantic import BaseModel, Extra


class TypeIdModel(BaseModel):
    class Config:
        extra = Extra.forbid

        @staticmethod
        def schema_extra(schema) -> None:
            for prop in schema["properties"].values():
                if prop.get("noneAsNull", False):
                    if "type" in prop:
                        prop["type"] = [prop["type"], "null"]
                    elif "allOf" in prop and len(prop["allOf"]) == 1:
                        prop["anyOf"] = [prop["allOf"][0], {"type": "null"}]
                        del prop["allOf"]
                    else:
                        raise Exception("Unhandled noneAsNull case")
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
