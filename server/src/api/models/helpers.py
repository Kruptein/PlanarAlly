from typing import TypeVar

from pydantic import BaseModel, Extra


class TypeIdModel(BaseModel):
    class Config:
        extra = Extra.forbid

        @staticmethod
        def schema_extra(schema) -> None:
            for prop in schema["properties"].values():
                # By default None values are interpretted as `undefined`
                # This extra property sets them explicitly as `null`
                if prop.get("noneAsNull", False):
                    if "anyOf" in prop:
                        prop["anyOf"].append({"type": "null"})
                    elif "allOf" in prop and len(prop["allOf"]) == 1:
                        prop["anyOf"] = [prop["allOf"][0], {"type": "null"}]
                        del prop["allOf"]
                    else:
                        prop["type"] = [prop["type"], "null"]

                # All of the below deal with adding custom types in the outputted js interfaces
                # e.g. changing `string` to be `DID` where `DID` is a typescript type in the client
                prop_type = prop.get("type", None)
                if prop_type == "array" or (prop_type and len(prop_type) > 1 and prop_type[0] == "array"):
                    items = prop["items"]
                    if "typeId" in prop:
                        items["enum"] = [prop["typeId"]]
                elif "anyOf" in prop:
                    if prop.get("typeId", False):
                        prop["anyOf"][0]["enum"] = [prop["typeId"]]
                elif "typeId" in prop:
                    prop["enum"] = [prop["typeId"]]


T = TypeVar("T")
