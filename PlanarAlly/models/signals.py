from playhouse.signals import post_save, pre_delete

from .campaign import GridLayer, Layer, Location, LocationUserOption, PlayerRoom, User


@post_save(sender=Layer)
def on_layer_save(model_class, instance, created):
    if not created:
        return
    if instance.type_ == "grid":
        GridLayer.create(id=instance.id)


@pre_delete(sender=Layer)
def on_layer_delete(model_class, instance):
    print(f"Deleting {repr(instance)}")
    print(instance.type_, instance.id)
    if instance.type_ == "grid":
        print("DEL")
        GridLayer[instance.id].delete_instance()


@post_save(sender=Location)
def on_location_save(model_class, instance, created):
    if not created:
        return
    players = User.select().where(
        (User.id << instance.room.players.select(PlayerRoom.player))
        | (User.id == instance.room.creator)
    )
    for player in players:
        LocationUserOption.create(location=instance, user=player)
