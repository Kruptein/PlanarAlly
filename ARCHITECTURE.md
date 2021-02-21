# PlanarAlly Architecture Overview

In this document I'm going to attempt to give a brief overview of how the PA codebase is structured.

## Server - Client Communication

When you join an actual session, a bidirectional communication channel is opened between the client and server using socket.io which uses websockets behind the screens (or worst case falls back to polling).

During communication, many socket events provide an additional `temporary` field which can be used to indicate to the server that a certain event should not be fully processed at the server. It will still be checked for authorization rights and be sent to other players, but won't spent time to persist it to the database.

Socket.io allows the option to namespace, which is being used to separate websocket events pertaining to the asset store and those from the core game.

Outside of the game sessions and the asset store, some other actions need to communicate and here, more traditional HTTP requests are issued to the server.

## Server

The server is compared to the client a much smaller project which makes it easier to explain.

### api

The API folder contains everything related to the aforementioned communication channels.
It has a separate `http` and `socket` folder and both are roughly structured into separate files based on the event content.

### models

PA uses the peewee ORM and this folder contains all the related database models.

Another related file that is important is the `save.py` file in the server root.
This is the migration code responsible for upgrading your save file when you are behind.

## Client

As said earlier, the client is a bigger project and I'm mainly going to focus on the core game related structure,
but I'll give a brief overview of some of the other folders.

The client uses the Vue.js framework, currently still in version 2, but intending to upgrade to 3 somewhere in the future.

#### AssetManager

This folder contains all code related to the separate asset manager.
It contains its own socket setup and vue store.

#### dashboard/settings

These are smaller components right now, but I want to rework these in the future to match the style of the login page

#### game

This beast of a folder is the heart and soul of PlanarAlly.

##### API

_Everything_ related to the socket communication is done here. There is a cognitive distinction made between events that are received and those that are emitted.

Although the `socket` instance can be imported in any other file and directly used, it is **strongly** recommended to always go through a function in this folder to do the actual call. This gives better typescript guarantees when something changes to the API call.

##### Layers

The next big structure is the layers folder.
An important file here is the layer `manager.ts` which is responsible for the actual draw loop and calling all layers on the board to update when relevant.

The other files have all the code related to actually drawing the layers, which can be rather complex for the vision layers.

##### Operations

This folder contains a set of core actions that can be undone/redone with the undo tool.

##### Shapes

Another big one, is the folder that contains all shape logic. How should a shape be drawn on the board, how does a certain shape resize etc.

Each shape has its own particular concepts or inherits from the base shape implementation.

##### UI

ALL code that is related to something visible in the UI originates in this folder.
This is the big folder full of .vue files, it is relatively ok-ish structured, but could use some restructuring.

As you may know, vue is a reactive framework.

As there are some UI elements that require information of the currently selected shape, but we don't want to make entire shapes reactive as they get passed through some processing heavy code that would slow down a lot if the shapes were reactive.
As a somewhat wieldy compromise the ActiveShapeStore has been introduced, which is a vue store that takes the active shape and loads all info that is used by some UI components in a reactive store. Decoupling the real shape from the reactive frontend world.

##### Visibility

This is a folder that you are the least likely to touch in the entire project.
On one hand because it's inherently complex code, but also because it's just written in a very non-javascript fashion which is a nightmare to interact with.

The visibility code is the code that is responsible for generating the triangulation used for the vision and lighting calculations as well as the code to interact with that triangulation (i.e. where is the closest wall etc)

The long-term vision for this code is to port it to webassembly.
