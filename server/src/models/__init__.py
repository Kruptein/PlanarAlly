from typing import List, Type

from utils import all_subclasses
from .asset import *
from .base import BaseModel as _BaseModel
from .campaign import *
from .general import *
from .groups import Group
from .initiative import *
from .label import *
from .notifications import *
from .shape import *
from .signals import *
from .typed import TypedModel
from .user import *
from .marker import *

ALL_MODELS: List[Type[TypedModel]] = [model for model in all_subclasses(_BaseModel)]
