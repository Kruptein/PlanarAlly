from enum import Enum
from typing import TypeVar


class Nullable(Enum):
    null = None


T = TypeVar("T")


def _(x: T | None) -> T | Nullable:
    if x is None:
        return Nullable.null
    return x
