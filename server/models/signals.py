import logging
from playhouse.signals import post_delete, post_save, pre_delete

from .campaign import GridLayer, Layer, Location, LocationUserOption, PlayerRoom, Room
from .db import db
from .shape import Shape
from .user import User

logger = logging.getLogger("PlanarAllyServer")

__all__ = []  # type: ignore


@post_save(sender=Layer)
def on_layer_save(model_class, instance, created):
    logger.warning("ON SAVE")
    if not created:
        return
    if instance.type_ == "grid":
        GridLayer.create(id=instance.id)


@pre_delete(sender=Layer)
def on_layer_delete(model_class, instance):
    logger.warning("DELETING LAYER ")
    logger.warning(instance, instance.type_)
    if instance.type_ == "grid":
        GridLayer[instance.id].delete_instance()


@pre_delete(sender=Room)
def on_room_delete(a, b):
    logger.warning("DELETE ROOM")

@pre_delete(sender=Location)
def on_location_delete(model_class, instance):
    logger.warning("DELETE LOCATION")


@post_delete(sender=Location)
def on_dlocation_delete(model_class, instance):
    logger.warning("DELETE LOCATION 2")


@post_save(sender=Location)
def on_location_save(model_class, instance, created):
    logger.warning("ON LOC SAVE")
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
    logger.warning("JOINING PLAYER")
    if not created:
        return
    with db.atomic():
        for location in instance.room.locations:
            LocationUserOption.create(location=location, user=instance.player)


@pre_delete(sender=PlayerRoom)
def on_player_leave(model_class, instance):
    logger.warning("LEAVING PLAYER")
    with db.atomic():
        for location in instance.room.locations:
            LocationUserOption.get(
                location=location, user=instance.player
            ).delete_instance()


@pre_delete(sender=Shape)
def on_shape_delete(model_class, instance):
    logger.warning("DELETING SHAPE ")
    logger.warning(instance)