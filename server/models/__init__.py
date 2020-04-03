from utils import all_subclasses
from .asset import *
from .base import BaseModel as _BaseModel
from .campaign import *
from .general import *
from .initiative import *
from .label import *
from .shape import *
from .signals import *
from .user import *
from .marker import *

ALL_MODELS = [model for model in all_subclasses(_BaseModel) if not model.abstract]
