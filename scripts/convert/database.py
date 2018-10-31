import logging
import os
import peewee
import secrets
import shelve
import sys

logger: logging.Logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)"
)
streamHandler = logging.StreamHandler(sys.stdout)
streamHandler.setFormatter(formatter)
logger.addHandler(streamHandler)

sys.path.insert(0, os.getcwd())
try:
    import planarally
except ImportError:
    logger.warning(
        "You have to run this script from within the same folder as the save file."
    )
    logger.info("E.g.: python ../scripts/convert/database.py")
    sys.exit(2)

import auth
from models import *
from models.db import db
from config import SAVE_FILE


def add_assets(user, data, parent=None):
    if not isinstance(data, dict):
        return
    for folder in data.keys():
        if folder == "__files":
            for file_ in data["__files"]:
                Asset.create(
                    owner=user,
                    parent=parent,
                    name=file_["name"],
                    file_hash=file_["hash"],
                )
        else:
            db_asset = Asset.create(owner=user, parent=parent, name=folder)
            add_assets(user, data[folder], parent=db_asset)


def convert(save_file):
    if os.path.exists(SAVE_FILE):
        logger.warning("Database already exists.  Abort conversion.")
        sys.exit(2)
    logger.info("Creating tables")

    db.create_tables(ALL_MODELS)
    Constants.create(save_version=3, secret_token=secrets.token_bytes(32))

    with shelve.open(save_file, "c") as shelf:
        logger.info("Creating users")
        with db.atomic():
            for user in shelf["user_map"].values():
                logger.info(f"\tUser {user.username}")
                db_user = User.create(
                    name=user.username, password_hash=user.password_hash
                )
                for option in [
                    ("fowColour", "fow_colour"),
                    ("gridColour", "grid_colour"),
                    ("rulerColour", "ruler_colour"),
                ]:
                    if option[0] in user.options:
                        setattr(db_user, option[1], user.options[option[0]])
                db_user.save()

                add_assets(db_user, user.asset_info)

        logger.info("Creating rooms")
        with db.atomic():
            for room in shelf["rooms"].values():
                logger.info(f"\tRoom {room.name}")
                user = User.get_or_none(name=room.creator)
                if user is None:
                    logger.error(
                        f"/Room {room.name} creator {room.creator} does not appear in the user map."
                    )
                    sys.exit(2)
                db_room = Room.create(
                    name=room.name,
                    creator=user,
                    invitation_code=room.invitation_code,
                    player_location=room.player_location,
                    dm_location=room.dm_location,
                )

                logger.info("\t\tPlayerRoom")
                for player_name in room.players:
                    player = User.get_or_none(name=player_name)
                    if player is None:
                        logger.error(
                            f"/Room {room.name} player {player_name} does not appear in the user map."
                        )
                        sys.exit(2)
                    PlayerRoom.create(player=player, room=db_room)

                for n_id, note in room.notes.items():
                    Note.create(
                        uuid=n_id,
                        room=db_room,
                        user=User.by_name(note[0]),
                        title=note[1],
                        text=note[2],
                    )

                for location in room.locations.values():
                    logger.info(f"\t\tLocation {location.name}")
                    db_location = Location(room=db_room, name=location.name)
                    for optional in [
                        ("unitSize", "unit_size"),
                        ("useGrid", "use_grid"),
                        ("fullFOW", "full_fow"),
                        ("fowOpacity", "fow_opacity"),
                        ("fowLOS", "fow_los"),
                    ]:
                        if location.options.get(optional[0]):
                            setattr(
                                db_location, optional[1], location.options[optional[0]]
                            )
                    db_location.save()

                    if hasattr(location, "initiative"):
                        InitiativeLocationData.create(
                            location=db_location,
                            turn=getattr(location, "initiativeTurn", 0),
                            round=getattr(location, "initiativeRound", 0),
                        )
                        for init_i, init in enumerate(location.initiative):
                            init_db = Initiative.create(
                                uuid=init["uuid"],
                                visible=init["visible"],
                                group=init["group"],
                                source=init["src"],
                                has_img=init.get("has_img", False),
                                index=init_i,
                                initiative=init["initiative"],
                            )

                            if "effects" in init:
                                for effect in init["effects"]:
                                    InitiativeEffect.create(
                                        uuid=effect["uuid"],
                                        initiative=init_db,
                                        name=effect["name"],
                                        turns=effect["turns"],
                                    )

                    for i_l, layer in enumerate(location.layer_manager.layers):
                        type_map = {
                            "map": "normal",
                            "grid": "grid",
                            "tokens": "normal",
                            "dm": "normal",
                            "fow": "fow",
                            "fow-players": "fow-players",
                            "draw": "normal",
                        }
                        type_ = type_map[layer.name]
                        db_layer = Layer.create(
                            location=db_location,
                            name=layer.name,
                            player_visible=layer.player_visible,
                            player_editable=layer.player_editable,
                            selectable=layer.selectable,
                            type_=type_,
                            index=i_l + 1,
                        )

                        if type_ == "grid":
                            gl = GridLayer.get(db_layer.id)
                            gl.size = layer.size
                            gl.save()

                        for i_s, shape in enumerate(layer.shapes.values()):
                            db_shape = Shape(
                                uuid=shape["uuid"],
                                layer=db_layer,
                                type_=shape["type"],
                                x=shape["x"],
                                y=shape["y"],
                                name=shape.get("name"),
                                index=i_s + 1,
                            )
                            for optional in [
                                ("border", "stroke_colour"),
                                ("fill", "fill_colour"),
                                ("isToken", "is_token"),
                                ("globalCompositeOperation", "draw_operator"),
                                ("annotation", "annotation"),
                                ("movementObstruction", "movement_obstruction"),
                                ("visionObstruction", "vision_obstruction"),
                                ("options", "options"),
                            ]:
                                if shape.get(optional[0]):
                                    setattr(db_shape, optional[1], shape[optional[0]])
                            if shape["type"].lower() == "asset":
                                AssetRect.create(
                                    uuid=shape["uuid"],
                                    src=shape["src"],
                                    width=shape["w"],
                                    height=shape["h"],
                                )
                                db_shape.type_ = "assetrect"
                            elif shape["type"].lower() == "circle":
                                Circle.create(uuid=shape["uuid"], radius=shape["r"])
                            elif shape["type"].lower() == "circulartoken":
                                CircularToken.create(
                                    uuid=shape["uuid"],
                                    text=shape["text"],
                                    font=shape["font"],
                                    radius=shape["r"],
                                )
                            elif shape["type"].lower() == "line":
                                Line.create(
                                    uuid=shape["uuid"],
                                    x2=shape["x2"],
                                    y2=shape["y2"],
                                    line_width=shape["lineWidth"],
                                )
                            elif shape["type"].lower() == "rect":
                                Rect.create(
                                    uuid=shape["uuid"],
                                    width=shape["w"],
                                    height=shape["h"],
                                )
                            elif shape["type"].lower() == "text":
                                Text.create(
                                    uuid=shape["uuid"],
                                    text=shape["text"],
                                    font=shape["font"],
                                    angle=shape["angle"],
                                )
                            elif shape["type"].lower() == "multiline":
                                MultiLine.create(
                                    uuid=shape["uuid"],
                                    line_width=shape["size"],
                                    points=shape["points"],
                                )
                            else:
                                logger.warning(
                                    f"Shape type {shape['type']} is not known"
                                )
                            db_shape.save(force_insert=True)

                            for tracker in shape.get("trackers", []):
                                if tracker["value"] == "":
                                    tracker["value"] = 0
                                if tracker["maxvalue"] == "":
                                    tracker["maxvalue"] = 0
                                Tracker.create(
                                    uuid=tracker["uuid"],
                                    shape=db_shape,
                                    visible=tracker["visible"],
                                    name=tracker["name"],
                                    value=tracker["value"],
                                    maxvalue=tracker["maxvalue"],
                                )

                            for aura in shape.get("auras", []):
                                if aura["value"] == "":
                                    aura["value"] = 0
                                if aura["dim"] == "" or aura["dim"] is None:
                                    aura["dim"] = 0
                                Aura.create(
                                    uuid=aura["uuid"],
                                    shape=db_shape,
                                    vision_source=aura["lightSource"],
                                    visible=aura["visible"],
                                    name=aura["name"],
                                    value=aura["value"],
                                    dim=aura["dim"],
                                    colour=aura["colour"],
                                )

                            for owner in shape.get("owners", []):
                                if owner == "":
                                    continue
                                db_owner = User.get_or_none(name=owner)
                                if db_owner is None:
                                    continue
                                ShapeOwner.create(shape=db_shape, user=db_owner)

        logger.info("User-Location options")
        for user in shelf["user_map"].values():
            db_user = User.get(name=user.username)
            for location_option in user.options.get("locationOptions", []):
                room, creator, location = location_option.split("/")
                db_location = (
                    Location.select()
                    .join(Room)
                    .join(User)
                    .where(
                        (User.name == creator)
                        & (Room.name == room)
                        & (Location.name == location)
                    )
                    .first()
                )
                if db_location is None:
                    continue
                db_user_location_option = LocationUserOption.get(
                    location=db_location, user=db_user
                )
                for option in [
                    ("panX", "pan_x"),
                    ("panY", "pan_y"),
                    ("zoomFactor", "zoom_factor"),
                ]:
                    if option[0] in user.options["locationOptions"][location_option]:
                        setattr(
                            db_user_location_option,
                            option[1],
                            user.options["locationOptions"][location_option][option[0]],
                        )
                db_user_location_option.save()

        logger.info("Database initialization complete.")


if __name__ == "__main__":
    save_file = "planar.save"
    if len(sys.argv) == 2:
        save_file = sys.argv[1]
    convert(save_file)
