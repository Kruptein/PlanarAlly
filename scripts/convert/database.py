import logging
import os
import peewee
import shelve
import sys

logger: logging.Logger = logging.getLogger('PlanarAllyServer')
logger.setLevel(logging.INFO)
formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)')
streamHandler = logging.StreamHandler(sys.stdout)
streamHandler.setFormatter(formatter)
logger.addHandler(streamHandler)

sys.path.insert(0, os.getcwd())
try:
    import planarally_old as planarally
    import auth
    from models import db, Layer, Location, Room, PlayerRoom, Shape, User
except ImportError:
    logger.warning(
        "You have to run this script from within the same folder as the save file.")
    logger.info("E.g.: python ../scripts/convert/database.py")
    sys.exit(2)


def convert(save_file):
    with shelve.open(save_file, "c") as shelf:
        if User.select().count() > 0:
            logger.warning("Database is already populated.  Abort conversion.")
            sys.exit(2)

        logger.info("Creating users")
        with db.atomic():
            for user in shelf['user_map'].values():
                User.create(username=user.username,
                            password_hash=user.password_hash)
        logger.info("Creating rooms")
        with db.atomic():
            for room in shelf['rooms'].values():
                logger.info(f"\tRoom {room.name}")
                user = User.get_or_none(User.username == room.creator)
                if user is None:
                    logger.error(
                        f"/Room {room.name} creator {room.creator} does not appear in the user map.")
                    sys.exit(2)
                db_room = Room.create(name=room.name, creator=user, invitation_code=room.invitation_code,
                                      player_location=room.player_location, dm_location=room.dm_location)

                logger.info("\t\tPlayerRoom")
                for player_name in room.players:
                    player = User.get_or_none(User.username == player_name)
                    if player is None:
                        logger.error(
                            f"/Room {room.name} player {player_name} does not appear in the user map.")
                        sys.exit(2)
                    PlayerRoom.create(player=player, room=db_room)

                for location in room.locations.values():
                    logger.info(f"\t\tLocation {location.name}")
                    db_location = Location.create(
                        room=db_room, name=location.name)

                    for i_l, layer in enumerate(location.layer_manager.layers):
                        logger.info(f"\t\t\tLayer {layer.name}")
                        db_layer = Layer.create(location=db_location, name=layer.name, player_visible=layer.player_visible,
                                                player_editable=layer.player_editable, selectable=layer.selectable, index=i_l)

                        for i_s, shape in enumerate(layer.shapes.values()):
                            try:
                                sh = Shape(
                                    uuid=shape['uuid'], layer=db_layer, x=shape['x'], y=shape['y'], name=shape.get('name'), index=i_s)
                                for optional in [('border', 'border_colour'), ('fill', 'fill_colour'), ('isToken', 'is_token'), ('globalCompositeOperation', 'draw_operator'), ('annotation', 'annotation'), ('movementObstruction', 'movement_obstruction'), ('visionObstruction', 'vision_obstruction')]:
                                    if shape.get(optional[0]):
                                        setattr(
                                            sh, optional[1], shape[optional[0]])
                                sh.save(force_insert=True)
                            except Exception as e:
                                logger.error(
                                    f"An error occured during processing of shape {shape}")
                                logger.exception(e)
                                sys.exit(2)


if __name__ == "__main__":
    save_file = "planar.save"
    if len(sys.argv) == 2:
        save_file = sys.argv[1]
    convert(save_file)
