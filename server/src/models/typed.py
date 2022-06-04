from peewee import ModelSelect
from typing import TYPE_CHECKING, Generic, Sequence, Type, TypeVar
from typing_extensions import Self

if TYPE_CHECKING:
    from .base import BaseModel


T = TypeVar('T', bound='TypedModel')
U = TypeVar('U', bound='TypedModel')
# Self = TypeVar("Self", bound="MS[Any]")


class SelectSequence(Generic[T], Sequence[T], ModelSelect):
    # def __getitem__(self, _value: int) -> T: ...

    def filter(self: Self, *_args, **_kwargs) -> Self: ...
    def join(self, _model: Type["BaseModel"]) -> Self: ...
    def where(self, *_expressions) -> Self: ...
    

class TypedModel:
    if TYPE_CHECKING:
        @classmethod
        def get_or_none(cls, *args, **kwargs) -> Self: ...

        @classmethod
        def select(cls) -> SelectSequence[Self]: ...