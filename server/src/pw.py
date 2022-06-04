# # Peewee type helper functions

# from peewee import ModelSelect
# from typing import Any, Generic, List, Type, TypeVar, Union, cast, overload

# from models.base import BaseModel

# T = TypeVar('T', bound=Type[BaseModel])
# U = TypeVar('U', bound=Type[BaseModel])
# Self = TypeVar("Self", bound="MS[Any]")

# class MS(Generic[T], ModelSelect):
#     def __getitem__(self, _value: int) -> T: ...
    
#     def where(self: Self, *_expressions) -> Self: ...

#     def join(self: Self, _model: U) -> Union[Self, 'MS[U]']: ...

#     def filter(self: Self, *_args, **_kwargs) -> Self: ...


# # Select

# @overload
# def S(model: T) -> MS[T]: ...
# @overload
# def S(model: List[T]) -> MS[T]: ...

# def S(model):
#     return cast(MS, model.select())