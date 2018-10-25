from .asset import *
from .base import BaseModel as _BaseModel
from .campaign import *
from .general import *
from .shape import *
from .signals import *
from .user import *
from .utils import all_subclasses

ALL_MODELS = [model for model in all_subclasses(_BaseModel) if not model.abstract]
