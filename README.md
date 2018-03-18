# PlanarAlly

A companion tool for when you travel into the planes.

PlanarAlly is a web tool that adds virtual battlemaps with various extras to your D&D toolbox.

_This project is still in early development; multiple bugs or structure changes can and will happen_

## What you get

### Layers

At the moment the layers are hardcoded.  This is expected to change in the future in some form.
The hardcoded layers atm are:
* Map layer
* Grid layer
* Player/Tokens layer
* DM layer
* Fog of War layer
* Draw layer

The map/token/dm/fow layer are selectable to do things in as a DM, players can only do things on the tokens layer.

The grid layer is currently always on _(to be changed TM)_.  More info about the grid is below.

The FOW layer is a vision control layer, the DM can use the FOW tool to quickly hide or reveal areas to players or use the dedicated FOW layer to do more extensive vision stuff (see the FOW chapter).

Switching between layers is possible through the lower left UI _(only visible if you can select multiple layers)_.
All higher (i.e. more to the right in the UI) layers have a low opacity to give better visual feedback on what you're doing.

A simple contextmenu (right click) is present for all shapes that allows changing of layer but also precedence changes (move to front/back).

### Grid

By default the grid is shown between the map layer and the token layer, so that tokens appear on top of the grid.  (assuming you use the token layer for tokens)
All tokens will automatically snap to a grid location and will also snap to grids when resizing.

To prevent auto snapping, combine your move/resize with the alt key or disable the grid _(soon TM)_

You can set the size of a single grid cell in the options menu.

### Asset management

Currently very bare bones; All images in the `img/assets` directory will be shown in the tokens menu that can be revealed by clicking on the red bar at the left of the screen.
Dragging a token from here on to the grid will place it in the currently selected layer.

To remove a token from the board, you can select it and press the delete key.

Users are automatically the owner of any shape they draw.  The DM always is co-owner.
Although possible through the js console there is no UI in place to give other players ownership of your assets. (WIP)

If you own an asset a panel will appear on selection of the asset at the right side of your screen.
Here you can keep track of various trackers (e.g. health) and auras (e.g. vision/light/paladin auras).
If any tracker or aura is listed here you can click on the number and directly update it.  (simple + and - operations also work e.g. '-23')

By clicking on the edit button in this panel, a larger dialog will show where you can change the asset settings.
You can change the name to track it by and whether it will stop vision/light of passing through.
You can also add one or multiple trackers.  To do this give the tracker a name and at least fill in the first box with a number.
This usually represents the current value of the tracker.  The secondbox is optional and can be used for example for a maximum value.
The eye is used to toggle whether ALL other players can see this tracker.  The trashcan is used to remove the tracker.

The auras work in a similar fashion.  The boxes represent a radius of bright and dim light. (again the second box is optional)
The dim light radius will always be at half opacity in regards to the chosen colour using the colour picker.
The lightbulb toggles whether this aura represents a light/vision source that will pass through fog of war.

### User management

A basic user system is present which allows anyone to register or login to the website.

Once logged in users can create sessions and when doing so automatically become the DM of that session.
To get other users to join your session, open the options menu and there is an invitation code.
the full path to give to your users is `/invite/{INVITATION_CODE}` without the braces.
e.g. on your localhost on the default port 8000 it would be `http://localhost:8000/invite/23902-3234-4234-234`

Users can customise some small things when they're not the DM.  The options menu will be available with the option to
change the colours of the grid lines and the fog of war.

### Fog of War

Fog of war is available in a simple and more advanced way.
At its core you can reveal or hide regions on your map using the FOW tool from any layer.
This has the advantage that you do not need to change layers, but is fairly limited in scope.

You can also change to the dedicated FOW layer where you can use all other normal tools including the draw tool.
You can also interact with the drawn assets as usual.
When drawing on the FOW layer the drawn shapes are by default assumed to be light blocking (This is not the same for the FOW tool!),
you can toggle this behaviour as with all assets using the edit asset panel to finetune this vision layer.

The combination of light blocking shapes and light sources brings for very fun settings with a bit more tactical depth!

It is strongly advised to add lightblocking shapes to your maps if you use lightsources as you don't want your light sources to show stuff on the other side of walls ;)

### Tools

A plethora of basic tools are available to both players and DM and can be selected in the lower right of the screen.

#### Select

You can select different objects on the active layer.  When selected you can additionally move an object simply by dragging it.
You can also resize an object by hovering over one of the corners of the object and then dragging in the desired direction.

Selecting multiple objects allows you to move/drag the entire selection from anywhere in the selection region.

#### Pan

When selected, dragging allows for panning the screen

#### Draw

Allows you to draw a rectangle on the currently active layer.  When selecting this tool an extra panel shows up allowing you to select border and fill colours.

#### Ruler

mearure distances! woo!  Dragging will display a distance from the initial click point under the assumption that one grid equals 5ft.

#### FOW

DM only tool

Hide or Reveal areas of the screen for your players!

! IMPORTANT NOTICE REGARDING FOW: At the moment all shapes are sent to players this means that also all shapes that
are under fow are sent to the players.  The FOW will be displayed correctly above these shapes so that they are 'invisible'
to the player BUT a player with some javascript knowledge will be able to circumvent this.  There are no immediate plans to
'fix' this as I trust my players to not metagame, but I might look at this in the future.

#### Map

DM only tool

When you use this tool on a selected object you can draw a rectangle over an area that should match up to (by default) 3 by 3 grid cells.
The object will then be resized accordingly.

An additional panel is visible to adjust the amount of cells you are gonna select in the X and in the Y direction.

After using this tool you'll often want to slightly reposition the object with the select tool and using ALT to get finer controls and no grid snapping.

## Planned

Following is a list of current TODO's in no particular order:

* Better token management
* DM options
    * Grid/FOW enable/disable options
* Rotate tokens
* Some form of barebones text chat
* Layer management
    * custom amount of layers and custom order
    * icons
* More tools
    * Different shapes
    * Text
    * Annotate parts of the map
* More out of game configuration stuff

NOT planned

* video/voice chat
* dice rolling
* Any kind of marketplace

## Backend Requirements

The core of the project is built around the following three tools.
* python 3.6
* aiohttp
* python-socketio

Additionally the following libraries are also necessary:
* aiohttp_jinja2
* aiohttp_security
* aiohttp_session
* bcrypt
* cryptography

It should be relatively easy to swap out aiohttp for another webframework.  Aiohttp was chosen purely to try out one of the 'fancy' async frameworks.
The function of the web framwork is fairly limited in complexity.  It's main purpose is to provide an authentication layer and persistence.

## Running

`PlanarALly/planarserver.py` is the entrypoint of the web server application.  At the moment some manual configuration is probably necessary.
The server parameters are at the bottom of that file.

Without modification it runs on port 8000 and over HTTP.

If a `certs` folder is present in the same directory it will attempt to run over HTTPS _(names of the certs are hardcoded atm in the script)_

**SAVE DATA**
Currently all data (user auth and session data) is stored using python's builtin shelve module.  The save format is however **not** finalized.
Changes to the save data are expected and as of yet no conversion tools are created.  _(If you require assistance in porting to a newer version contact me)_