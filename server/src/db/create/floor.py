from peewee import fn

from ..models.floor import Floor
from ..models.layer import Layer
from ..models.location import Location


def create_floor(location: Location, name: str):
    if Floor.select().where(Floor.location == location).count() > 0:
        index = Floor.select(fn.Max(Floor.index)).where(Floor.location == location).scalar() + 1
    else:
        index = 0
    floor = Floor.create(location=location, name=name, index=index)
    Layer.create(
        location=location,
        name="map",
        type_="normal",
        player_visible=True,
        index=0,
        floor=floor,
    )
    Layer.create(
        location=location,
        name="grid",
        type_="grid",
        selectable=False,
        player_visible=True,
        index=1,
        floor=floor,
    )
    Layer.create(
        location=location,
        name="tokens",
        type_="normal",
        player_visible=True,
        player_editable=True,
        index=2,
        floor=floor,
    )
    Layer.create(location=location, type_="normal", name="dm", index=3, floor=floor)
    Layer.create(
        location=location,
        type_="fow",
        name="fow",
        player_visible=True,
        index=4,
        floor=floor,
    )
    Layer.create(
        location=location,
        name="fow-players",
        type_="fow-players",
        selectable=False,
        player_visible=True,
        index=5,
        floor=floor,
    )
    Layer.create(
        location=location,
        name="draw",
        type_="normal",
        selectable=False,
        player_visible=True,
        player_editable=True,
        index=6,
        floor=floor,
    )
    return floor
