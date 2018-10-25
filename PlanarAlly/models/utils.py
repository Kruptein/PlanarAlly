def get_table(name):
    from . import ALL_MODELS

    for model in ALL_MODELS:
        if model._meta.name == name:
            return model


def reduce_data_to_model(model, data):
    return {k: data[k] for k in model._meta.fields.keys() if k in data}


def all_subclasses(cls):
    return set(cls.__subclasses__()).union(
        [s for c in cls.__subclasses__() for s in all_subclasses(c)]
    )
