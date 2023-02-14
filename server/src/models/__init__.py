from typing import List, Type

from ..utils import all_subclasses
from .asset import *  # noqa: F403
from .base import BaseModel as _BaseModel
from .campaign import *  # noqa: F403
from .general import *  # noqa: F403
from .groups import Group  # noqa: F401
from .initiative import *  # noqa: F403
from .label import *  # noqa: F403
from .notifications import *  # noqa: F403
from .shape import *  # noqa: F403
from .signals import *  # noqa: F403
from .typed import TypedModel
from .user import *  # noqa: F403
from .marker import *  # noqa: F403

ALL_MODELS: List[Type[TypedModel]] = [model for model in all_subclasses(_BaseModel)]
