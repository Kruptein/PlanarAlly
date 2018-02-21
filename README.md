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