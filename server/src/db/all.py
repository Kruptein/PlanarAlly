#  These have to appear before some others due to circular referencing and DeferredForeignKey
from .models.asset_share import AssetShare  # isort: skip
from .models.note_access import NoteAccess  # isort: skip
from .models.note_room import NoteRoom  # isort: skip
from .models.note_shape import NoteShape  # isort: skip
from .models.note_tag import NoteTag  # isort: skip

from .base import BaseDbModel, BaseViewModel
from .models.asset import Asset
from .models.asset_entry import AssetEntry
from .models.asset_rect import AssetRect
from .models.asset_shortcut import AssetShortcut
from .models.aura import Aura
from .models.base_rect import BaseRect
from .models.character import Character
from .models.circle import Circle
from .models.circular_token import CircularToken
from .models.composite_shape_association import CompositeShapeAssociation
from .models.constants import Constants
from .models.floor import Floor
from .models.group import Group
from .models.initiative import Initiative
from .models.layer import Layer
from .models.line import Line
from .models.location import Location
from .models.location_options import LocationOptions
from .models.location_user_option import LocationUserOption
from .models.marker import Marker
from .models.mod import Mod
from .models.mod_player_room import ModPlayerRoom
from .models.mod_room import ModRoom
from .models.note import Note
from .models.note_user_tag import NoteUserTag
from .models.notification import Notification
from .models.player_room import PlayerRoom
from .models.polygon import Polygon
from .models.rect import Rect
from .models.room import Room
from .models.room_data_block import RoomDataBlock
from .models.shape import Shape
from .models.shape_custom_data import ShapeCustomData
from .models.shape_data_block import ShapeDataBlock
from .models.shape_owner import ShapeOwner
from .models.shape_room_view import ShapeRoomView
from .models.shape_template import ShapeTemplate
from .models.shape_type import ShapeType
from .models.stats import Stats
from .models.text import Text
from .models.toggle_composite import ToggleComposite
from .models.tracker import Tracker
from .models.user import User
from .models.user_data_block import UserDataBlock
from .models.user_options import UserOptions
from .signals import *  # noqa: F403

ALL_NORMAL_MODELS: list[type[BaseDbModel]] = [
    AssetRect,
    Asset,
    AssetEntry,
    AssetShare,
    AssetShortcut,
    Aura,
    BaseRect,
    Character,
    Circle,
    CircularToken,
    CompositeShapeAssociation,
    Constants,
    Floor,
    Group,
    Initiative,
    Layer,
    Line,
    LocationOptions,
    LocationUserOption,
    Location,
    Marker,
    Mod,
    ModPlayerRoom,
    ModRoom,
    Note,
    NoteAccess,
    NoteRoom,
    NoteShape,
    NoteTag,
    NoteUserTag,
    Notification,
    PlayerRoom,
    Polygon,
    Rect,
    Room,
    RoomDataBlock,
    ShapeCustomData,
    ShapeDataBlock,
    ShapeOwner,
    ShapeTemplate,
    ShapeType,
    Shape,
    Stats,
    Text,
    ToggleComposite,
    Tracker,
    UserDataBlock,
    UserOptions,
    User,
]

ALL_VIEWS: list[type[BaseViewModel]] = [
    ShapeRoomView,
]

ALL_MODELS: list[type[BaseDbModel]] = ALL_NORMAL_MODELS + ALL_VIEWS
