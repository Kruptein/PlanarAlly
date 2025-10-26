import inspect
import json
from contextlib import ExitStack, contextmanager
from types import ModuleType
from typing import Any, Generator

from pydantic import BaseModel, create_model

# from .api import models
from . import fakemodels as models

_USELESS_ENUM_DESCRIPTION = "An enumeration."
_USELESS_STR_DESCRIPTION = inspect.getdoc(str)


def _is_pydantic_model(obj: Any) -> bool:
    """
    Return true if an object is a 'concrete' pydantic V2 model.
    """
    if not inspect.isclass(obj):
        return False
    elif obj is BaseModel:
        return False
    elif not issubclass(obj, BaseModel):
        return False
    generic_metadata = getattr(obj, "__pydantic_generic_metadata__", {})
    generic_parameters = generic_metadata.get("parameters")
    return not generic_parameters


def _is_submodule(obj: Any, module_name: str) -> bool:
    """
    Return true if an object is a submodule
    """
    return inspect.ismodule(obj) and getattr(obj, "__name__", "").startswith(f"{module_name}.")


def _extract_pydantic_models(module: ModuleType) -> list[BaseModel]:
    _models = []
    for _, model in inspect.getmembers(module, _is_pydantic_model):
        _models.append(model)

    for _, submodule in inspect.getmembers(module, lambda obj: _is_submodule(obj, module.__name__)):
        _models.extend(_extract_pydantic_models(submodule))

    return _models


@contextmanager
def _schema_generation_overrides(
    model: BaseModel,
) -> Generator[None, None, None]:
    """
    Temporarily override the 'extra' setting for a model,
    changing it to 'forbid' unless it was EXPLICITLY set to 'allow'.
    This prevents '[k: string]: any' from automatically being added to every interface.
    """
    revert: dict[str, Any] = {}
    config = model.model_config
    try:
        if isinstance(config, dict):
            if config.get("extra") != "allow":
                revert["extra"] = config.get("extra")
                config["extra"] = "forbid"
        else:
            if config.extra != "allow":
                revert["extra"] = config.extra
                config.extra = "forbid"  # type: ignore
        yield
    finally:
        for key, value in revert.items():
            if isinstance(config, dict):
                config[key] = value
            else:
                setattr(config, key, value)


def _clean_json_schema(schema: dict[str, Any]) -> None:
    """
    Clean up the resulting JSON schemas via the following steps:

    1) Get rid of descriptions that are auto-generated and just add noise:
        - "An enumeration." for Enums
        - `inspect.getdoc(str)` for Literal types
    2) Remove titles from JSON schema properties.
       If we don't do this, each property will have its own interface in the
       resulting typescript file (which is a LOT of unnecessary noise).
    3) If it's a V1 model, ensure that nullability is properly represented.
       https://github.com/pydantic/pydantic/issues/1270
    """
    description = schema.get("description")

    if "enum" in schema and description == _USELESS_ENUM_DESCRIPTION:
        del schema["description"]
    elif description == _USELESS_STR_DESCRIPTION:
        del schema["description"]

    properties: dict[str, dict[str, Any]] = schema.get("properties", {})

    for prop in properties.values():
        prop.pop("title", None)


def _generate_json_schema(models: list[BaseModel]) -> str:
    """
    Create a top-level '_Master_' model with references to each of the actual models.
    Generate the schema for this model, which will include the schemas for all the
    nested models. Then clean up the schema.
    """
    with ExitStack() as stack:
        models_by_name: dict[str, BaseModel] = {}
        models_as_fields: dict[str, tuple[BaseModel, Any]] = {}

        for model in models:
            stack.enter_context(_schema_generation_overrides(model))
            name = model.__name__
            models_by_name[name] = model
            models_as_fields[name] = (model, ...)

        master_model = create_model("_Master_", **models_as_fields)  # type: ignore
        master_schema = master_model.model_json_schema(mode="serialization")

        defs_key = "$defs" if "$defs" in master_schema else "definitions"
        defs: dict[str, Any] = master_schema.get(defs_key, {})

        for name, schema in defs.items():
            _clean_json_schema(schema)

        return json.dumps(master_schema, indent=2)


def main():
    _extracted_models = _extract_pydantic_models(models)
    _schema = _generate_json_schema(_extracted_models)

    with open("models.json", "w") as f:
        f.write(_schema)


# if __name__ == "__main__":
main()
