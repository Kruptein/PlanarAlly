"""
A collection of some JS equivalent shapes, to create at server side.
"""


class Rect:
    def __init__(self, x, y, width, height, uuid, fill="green", border="rgba(0, 0, 0, 0)"):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.uuid = uuid
        self.fill = fill
        self.border = border
        self.layer = None

    def as_dict(self):
        return {
            'x': self.x,
            'y': self.y,
            'w': self.width,
            'h': self.height,
            'fill': self.fill,
            'border': self.border,
            'uuid': self.uuid,
            'layer': self.layer,
            'type': "rect"
        }
