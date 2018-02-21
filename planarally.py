class Client:
    def __init__(self, sid):
        self.sid = sid
        self.rooms = [sid]
        self.initialised = False

class LayerManager:
    def __init__(self):
        self.layers = []

    def add(self, layer):
        self.layers.append(layer)

    def as_dict(self):
        return {
            'layers': [l.as_dict() for l in self.layers]
        }

class Layer:
    def __init__(self, name):
        self.shapes = []

    def add_shape(self, shape):
        self.shapes.append(shape)

    def as_dict(self):
        return {
            'shapes': [s.as_dict() for s in self.shapes],
            'grid': False
        }

class GridLayer(Layer):
    def __init__(self, name):
        super().__init__(name)

    def as_dict(self):
        return {'grid': True}

class Shape:
    def __init__(self, x, y, width, height, colour="green"):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.colour = colour

    def as_dict(self):
        return {
            'x': self.x,
            'y': self.y,
            'w': self.width,
            'h': self.height,
            'c': self.colour
        }

class PlanarAlly:
    def __init__(self):
        self.clients = {}
        self.layer_manager = LayerManager()

        self.layer_manager.add(Layer("map"))
        self.layer_manager.add(Layer("tokens"))
        self.layer_manager.add(Layer("dm"))
        self.layer_manager.add(GridLayer("grid"))
        self.layer_manager.layers[0].add_shape(Shape(40,40,50,50))
        self.layer_manager.layers[1].add_shape(Shape(80,40,50,50, "red"))
        self.layer_manager.layers[1].add_shape(Shape(40,80,50,50, "red"))
        self.layer_manager.layers[2].add_shape(Shape(80,80,50,50, "blue"))

    def add_client(self, sid):
        self.clients[sid] = Client(sid)