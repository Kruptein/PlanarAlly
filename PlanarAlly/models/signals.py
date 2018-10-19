from playhouse.signals import post_save, pre_delete

from .campaign import Layer, GridLayer


@post_save(sender=Layer)
def on_save(model_class, instance, created):
    if not created:
        return
    if instance.type_ == "grid":
        GridLayer.create(id=instance.id)


@pre_delete(sender=Layer)
def on_delete(model_class, instance):
    if instance.type_ == "grid":
        GridLayer.get(instance.id).delete_instance()
