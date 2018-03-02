"""
PlayerAlly data representation classes.
"""
import os
from collections import OrderedDict
from typing import Dict, List, Tuple

from shapes import Rect


class Client:
    def __init__(self, sid):
        self.sid = sid
        self.room = None
        self.initialised = False


class LayerManager:
    def __init__(self):
        self.layers = []  # type: List[Layer]

    def add(self, layer):
        self.layers.append(layer)

    def as_dict(self):
        return {
            'layers': [l.as_dict() for l in self.layers]
        }

    def get_grid_layer(self):
        for layer in self.layers:
            if isinstance(layer, GridLayer):
                return layer

    def get_layer(self, name):
        for layer in self.layers:
            if layer.name == name:
                return layer


class Layer:
    def __init__(self, name, *, selectable=True, player_visible=False, player_editable=False):
        self.name = name
        self.shapes = OrderedDict()
        self.selectable = selectable
        self.player_visible = player_visible
        self.player_editable = player_editable

    def add_shape(self, shape):
        shape.layer = self.name
        self.shapes[shape.uuid] = shape.as_dict()

    def as_dict(self):
        return {
            'name': self.name,
            'shapes': list(self.shapes.values()),
            'grid': False,
            'player_visible': self.player_visible,
            'player_editable': self.player_editable,
            'selectable': self.selectable
        }


class GridLayer(Layer):
    def __init__(self, size):
        super().__init__("grid", selectable=False, player_visible=True)
        self.size = size

    def as_dict(self):
        d = super().as_dict()
        d['grid'] = True
        d['size'] = self.size
        return d


class Room:
    def __init__(self, name, creator):
        self.name = name
        self.creator = creator
        self.players = []
        self.layer_manager = LayerManager()

        # Keep track of temporary (i.e. not serverStored) shapes
        # so that we can remove them from other clients when someone disconnects
        self.client_temporaries = {}  # type: Dict[Client, List[str]]

        # default layers
        self.layer_manager.add(Layer("map", player_visible=True))
        self.layer_manager.add(GridLayer(50))
        self.layer_manager.add(Layer("tokens", player_visible=True, player_editable=True))
        self.layer_manager.add(Layer("dm"))
        self.layer_manager.add(Layer("fow", selectable=False, player_visible=True))
        self.layer_manager.add(Layer("draw", selectable=False, player_visible=True, player_editable=True))

        # some test shapes
        self.layer_manager.layers[0].add_shape(Rect(50, 50, 50, 50, 1))
        self.layer_manager.layers[2].add_shape(Rect(100, 50, 50, 50, 2, "red"))
        self.layer_manager.layers[2].add_shape(Rect(50, 100, 50, 50, 3, "red"))
        self.layer_manager.layers[3].add_shape(Rect(100, 100, 50, 50, 4, "blue"))

    @property
    def sioroom(self):
        return f"{self.name}_{self.creator}"

    def get_board(self, username):
        board = self.layer_manager.as_dict()
        if self.creator == username:
            return board
        for l in board['layers']:
            if not l['player_visible']:
                board['layers'].remove(l)
            if not l['player_editable']:
                l['selectable'] = False
        return board

    def add_temp(self, sid, uuid):
        if sid not in self.client_temporaries:
            self.client_temporaries[sid] = []
        self.client_temporaries[sid].append(uuid)


class PlanarAlly:
    def __init__(self):
        self.rooms = {}  # type: Dict[Tuple[str, str], Room]

    def add_room(self, room, creator):
        self.rooms[(room, creator)] = Room(room, creator)

    def get_token_list(self, path=None):
        if not path:
            path = os.path.join("static", "img")
        d = {'files': [], 'folders': {}}
        for entry in os.scandir(path):
            if entry.is_file():
                d['files'].append(entry.name)
            elif entry.is_dir():
                d['folders'][entry.name] = self.get_token_list(entry.path)
        return d

    def get_rooms(self, username):
        owned = []
        joined = []
        for (name, creator), room in self.rooms.items():
            if creator == username:
                owned.append(name)
            elif username in room.players:
                joined.append(name)
        return owned, joined
