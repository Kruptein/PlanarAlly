from playhouse.signals import post_save, pre_delete

from .campaign import GridLayer, Layer, Location, LocationUserOption, PlayerRoom, User
from .db import db

__all__ = []  # type: ignore


@post_save(sender=Layer)
def on_layer_save(model_class, instance, created):
    if not created:
        return
    if instance.type_ == "grid":
        GridLayer.create(id=instance.id)


@pre_delete(sender=Layer)
def on_layer_delete(model_class, instance):
    if instance.type_ == "grid":
        GridLayer[instance.id].delete_instance()


@post_save(sender=Location)
def on_location_save(model_class, instance, created):
    if not created:
        return
    players = User.select().where(
        (User.id << instance.room.players.select(PlayerRoom.player))
        | (User.id == instance.room.creator)
    )
    with db.atomic():
        for player in players:
            LocationUserOption.create(location=instance, user=player)


@post_save(sender=PlayerRoom)
def on_player_join(model_class, instance, created):
    if not created:
        return
    with db.atomic():
        for location in instance.room.locations:
            LocationUserOption.create(location=location, user=instance.player)


@pre_delete(sender=PlayerRoom)
def on_player_leave(model_class, instance):
    with db.atomic():
        for location in instance.room.locations:
            LocationUserOption.get(
                location=location, user=instance.player
            ).delete_instance()
