from .base import BaseDbModel


def get_table(name: str):
    from .all import ALL_MODELS

    for model in ALL_MODELS:
        if model._meta.name == name:
            return model


def reduce_data_to_model(model: type[BaseDbModel], data: dict):
    return {k: data[k] for k in model._meta.fields.keys() if k in data}
