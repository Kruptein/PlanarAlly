from __future__ import annotations

from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    Generic,
    Iterator,
    Sequence,
    Tuple,
    Type,
    TypeVar,
)

from peewee import ModelDelete, ModelSelect, ModelUpdate
from playhouse.shortcuts import update_model_from_dict
from typing_extensions import Self

if TYPE_CHECKING:
    from .base import BaseDbModel


T = TypeVar("T", bound="TypedModel")
U = TypeVar("U", bound="TypedModel")


def safe_update_model_from_dict(instance: TypedModel, data: dict, ignore_unknown=False):
    update_model_from_dict(instance, data, ignore_unknown=ignore_unknown)


class SelectSequence(Generic[T], Sequence[T], ModelSelect):
    def count(self) -> int: ...

    def exists(self) -> bool: ...

    def filter(self, *_args, **_kwargs) -> Self: ...

    def join(self, _model: Type[BaseDbModel], *args, **_kwargs) -> Self: ...

    def order_by(self, *args, **kwargs) -> Self: ...

    def scalar(self) -> int: ...

    def where(self, *_expressions) -> SelectSequence[T]: ...

    def __iter__(self) -> Iterator[T]: ...


class UpdateSequence(Generic[T], Sequence[T], ModelUpdate):
    def execute(self): ...

    def where(self, *_expressions) -> UpdateSequence[T]: ...


class DeleteSequence(Generic[T], Sequence[T], ModelDelete):
    def execute(self): ...

    def where(self, *_expressions) -> Self: ...


class TypedMeta:
    name: str
    fields: dict


class TypedModel:
    if TYPE_CHECKING:
        _meta: TypedMeta
        index: int

        @classmethod
        def DoesNotExist(cls: Type[T]): ...

        @classmethod
        def create(cls: Type[T], *args, **kwargs) -> T: ...

        @staticmethod
        def pre_create(**kwargs) -> Dict[Any, Any]: ...

        @staticmethod
        def post_create(subshape: TypedModel, **kwargs): ...

        @classmethod
        def get(cls: Type[T], *args, **kwargs) -> T: ...

        @classmethod
        def get_by_id(cls: Type[T], *args, **kwargs) -> T: ...

        @classmethod
        def get_or_none(cls, *args, **kwargs) -> Self | None: ...

        @classmethod
        def get_or_create(cls, *args, **kwargs) -> Tuple[Self, bool]: ...

        @classmethod
        def select(cls: Type[T], *args, **kwargs) -> SelectSequence[T]: ...

        @classmethod
        def update(cls: Type[T], *args, **kwargs) -> UpdateSequence[T]: ...

        @classmethod
        def delete(cls) -> DeleteSequence[Self]:
            ...
            ...
