#  Has to appear before Asset due to DeferredForeignKey
from .models.asset_shortcut import AssetShortcut

from .models.asset_share import AssetShare  # isort: skip
from .models.asset import Asset
from .models.asset_rect import AssetRect
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
from .models.note import Note
from .models.note_access import NoteAccess
from .models.note_shape import NoteShape
from .models.notification import Notification
from .models.player_room import PlayerRoom
from .models.polygon import Polygon
from .models.rect import Rect
from .models.room import Room
from .models.room_data_block import RoomDataBlock
from .models.shape import Shape
from .models.shape_data_block import ShapeDataBlock
from .models.shape_owner import ShapeOwner
from .models.shape_type import ShapeType
from .models.text import Text
from .models.toggle_composite import ToggleComposite
from .models.tracker import Tracker
from .models.user import User
from .models.user_data_block import UserDataBlock
from .models.user_options import UserOptions
from .signals import *  # noqa: F403

ALL_MODELS = [
    AssetRect,
    Asset,
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
    Note,
    NoteAccess,
    NoteShape,
    Notification,
    PlayerRoom,
    Polygon,
    Rect,
    Room,
    RoomDataBlock,
    ShapeDataBlock,
    ShapeOwner,
    ShapeType,
    Shape,
    Text,
    ToggleComposite,
    Tracker,
    UserDataBlock,
    UserOptions,
    User,
]
