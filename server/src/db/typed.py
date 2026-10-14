from __future__ import annotations

from collections.abc import Iterator, Sequence
from typing import TYPE_CHECKING, Any, Self

from peewee import Database, ModelDelete, ModelSelect, ModelUpdate
from playhouse.shortcuts import update_model_from_dict

if TYPE_CHECKING:
    from .base import BaseDbModel


def safe_update_model_from_dict(instance: TypedModel, data: dict, ignore_unknown=False):
    update_model_from_dict(instance, data, ignore_unknown=ignore_unknown)


class SelectSequence[T: "TypedModel"](Sequence[T], ModelSelect):
    def count(self) -> int: ...  # pyright: ignore [reportIncompatibleMethodOverride]

    def exists(self) -> bool: ...  # pyright: ignore [reportIncompatibleMethodOverride]

    def filter(self, *_args, **_kwargs) -> Self: ...

    def join(self, _model: type[BaseDbModel], *args, **_kwargs) -> Self: ...

    def order_by(self, *args, **kwargs) -> Self: ...

    def scalar(self) -> int: ...  # pyright: ignore [reportIncompatibleMethodOverride]

    def where(self, *_expressions) -> SelectSequence[T]: ...

    def __iter__(self) -> Iterator[T]: ...

    def dicts(self, as_dict=True) -> Self: ...

    def group_by(self, *args) -> Self: ...

    def get(self, database: Database | None = None) -> T | None: ...


class UpdateSequence[T: "TypedModel"](Sequence[T], ModelUpdate):
    def execute(self) -> int: ...  # pyright: ignore [reportIncompatibleMethodOverride]

    def where(self, *_expressions) -> UpdateSequence[T]: ...


class DeleteSequence[T: "TypedModel"](Sequence[T], ModelDelete):
    def execute(self): ...  # pyright: ignore [reportIncompatibleMethodOverride]

    def where(self, *_expressions) -> Self: ...


class TypedMeta:
    name: str
    fields: dict


class TypedModel:
    if TYPE_CHECKING:
        _meta: TypedMeta
        index: int

        @classmethod
        def DoesNotExist(cls): ...

        @classmethod
        def create(cls, *args, **kwargs) -> Self: ...

        @staticmethod
        def pre_create(data_dict: dict[Any, Any], reduced_dict: dict[Any, Any]) -> dict[Any, Any]: ...

        @staticmethod
        def post_create(subshape: TypedModel, **kwargs): ...

        @classmethod
        def get(cls, *args, **kwargs) -> Self: ...

        @classmethod
        def get_by_id(cls, *args, **kwargs) -> Self: ...

        @classmethod
        def get_or_none(cls, *args, **kwargs) -> Self | None: ...

        @classmethod
        def get_or_create(cls, *args, **kwargs) -> tuple[Self, bool]: ...

        @classmethod
        def select(cls, *args, **kwargs) -> SelectSequence[Self]: ...

        @classmethod
        def update(cls, *args, **kwargs) -> UpdateSequence[Self]: ...

        @classmethod
        def delete(cls) -> DeleteSequence[Self]: ...
