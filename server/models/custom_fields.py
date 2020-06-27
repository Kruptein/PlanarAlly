from peewee import UUIDField

class UUIDTextField(UUIDField):
    def python_value(self, value):
        if isinstance(value, str):
            return value
        return str(value)

