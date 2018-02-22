# PlanarAlly

A companion tool for when you travel into the planes.

PlanarAlly is a web tool that adds virtual battlemaps with various extras to your D&D toolbox.

_This project is still in early development; multiple bugs or structure changes can and will happen_

## Backend Requirements

* python 3.6
* aiohttp
* python-socketio


## Running

Running `python planarserver.py` is enough to get the server up and running.  It runs on port 8000 by default but this can be changed in the code.
If no cert folder is present the current implementation will assume a localhost environment and connect the sockets over http otherwise https will be used.

## What you get

### Layers

At the moment the layers are hardcoded, this is expected to change in the future.
There are 3 layers for objects and 1  additional grid layer that sits just above the lowest layer visually.
There is the map layer, token layer and DM layer.

These names are purely descriptive and do not enforce anything in particular.

Switching between layers is possible through the lower left UI, by chaning layer all elements on higher layers (higher being more to the right in the UI), become transparent.

You can switch objects from layer using the contextmenu (right click on object) and also change precedence of objects within a layer.

### Grid

By default the grid is shown between the lowest layer (M) and the middle layer (T), so that tokens appear on top of the grid.  (assuming you use the token layer for tokens)
All tokens will automatically snap to a grid location and will also snap to grids when resizing.

To prevent auto snapping, combine your move/resize with the alt key.

### Token management

Currently very bare bones; All images in the `img/` directory will be showed in the tokens menu that can be revealed by clicking on the red bar at the left of the screen.
Dragging a token from here on to the grid will place it in the currently selected layer.

To remove a token from the board, you can select it and press the delete key.

## Planned

Following is a list of current TODO's in no particular order:

* Select multiple tokens for move operation
* Light/Shadow
* Better token management
* Client options
* Rotate tokens
* Some form of barebones text chat
* Layer management
    * custom amount of layers and custom order
    * icons
* More tools
    * Ruler
    * Draw shapes
    * Text

NOT planned

* video/voice chat
* dice rolling