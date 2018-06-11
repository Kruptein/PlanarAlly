# PlanarAlly

A companion tool for when you travel into the planes.

PlanarAlly is a web tool that adds virtual battlemaps with various extras to your D&D toolbox.   This can be ran in a completely offline set-up.

This tool is provided free to use, but requires some small computer knowledge to run.  If you have any questions, feel free to contact me.

**INDEX**

[Features](##-What-you-get)\
[Planned features](##-Planned)\
[Install](#Installing-/-Backend-Requirements)\
[Running PA](#Running)

_This project is still in early development; multiple bugs or structure changes can and will happen_

![Example view of a player with a light source](extra/player_light_example.png)
_Credits to Gogots for the background map used [source](https://gogots.deviantart.com/art/City-of-Moarkaliff-702295905)_

## What you get

### Layers

Layers are a core aspect of any virtual table top.  PA currently provides a hardcoded set of layers.  _(This is intended to change in the future)_

While most of these layers can only be directly influenced by the DM, they often are still visible for the players.

If multiple layers are selectable (currently only the DM has this option), you can change between the current active layer in the lowerleft of the screen.  Elements on higher layers are typically shown with a lower opacity to avoid confusion.

To change tokens to a different layer, you can use the contextmenu provided on right click.  This also provides a way to move overlapping assets behind eachother.

#### Map layer

**Selectable**: DM only\
**Viewable**: DM and players

The map layer is the lowest rendered layer.  This means that all other layers will appear on top of this layer.  It is typically used for terrain and maps.

#### Grid layer

**Selectable**: Nobody\
**Viewable**: DM and players

The grid layer shows a grid _duh_.  The DM can enable or disable this feature.  When enabled, most actions will by default snap to the grid (e.g. moving tokens).  To prevent this behaviour, you can hold the ALT key while doing the action.

The dimension of the grid and the size one cell represents can be configured by the DM.  All players can customize which colour and opacity the grid has.

**note:** currently only a square grid is available.  There are no immediate plans to support hexagonal grids, but this might be done in the future.

#### Tokens layer

**Selectable**: DM and players\
**Viewable**: DM and players

The tokens layer is the currently only selectable layer for players, but is also the main layer that is used by the DM.  This layer is intended for all reguar token action.

#### DM layer

**Selectable**: DM only\
**Viewable**: DM only

The only DM only viewable layer.  This layer is intended for DM's to hide things they want to either show later or as a reference.

#### FOW layer

**Selectable**: DM only\
**Viewable**: DM and players

The fog of war layer is an important layer that allows the DM to decide how lighting and shadows work.

FOW is a complex topic and has its own dedicated info over [here](###-Fog-of-War)

### Locations

_Work in progress: very basic usability_

The DM will have a special tool in the topleft of the screen where one can select a panel with all the registered locations.
By default only the start location is available, but the giant plus button allows for the creation of more locations.

**Note:** Currently locations cannot be removed.\
**Note2:** Switching locations will also transfer **ALL PLAYERS** too!

The regular DM settings menu will change to the settings of the current selected location and any changes made to this menu will only be applied to the current location.

### Asset management

_Work in progress: very basic usability_

#### Adding assets

All images in the `img/assets` directory will be shown in the tokens menu that can be revealed by opening the settings panel
in the topleft of the screen.
Dragging a token from here on to the grid will place it in the currently selected layer and will also auto snap _(Unless alt is pressed or the grid is disabled)_.

The only way to currently modify this list is by modifying the files with a file explorer or via shell commands.

To remove a token from the board, you can select it and press the delete key.

Users are automatically the owner of any shape they draw.  The DM always is co-owner.
You can add/remove owners using the edit asset dialog.

#### Asset related UI

If you own an asset, a panel will appear on selection of the asset at the right side of your screen. Here you can keep track of various trackers (e.g. health) and auras (e.g. vision/light/paladin auras).
If any tracker or aura is listed here you can click on the number and directly update it.  (simple + and - operations also work e.g. '-23')

By clicking on the edit button in this panel, a larger dialog will show where you can change the asset settings.  This can be seen in the example image above.
You can change the name of the asset and also toggle whether it will stop vision/light or even movement of passing through.

##### Trackers

You can also add one or multiple trackers.  To do this give the tracker a name _(optional)_ and at least fill in the first box with a number.
This usually represents the current value of the tracker.  The secondbox is optional and can be used for example to represent a maximum value,
These values are nowhere used so you can use them for any purpose you see fit.

With the eye you can toggle who can see this tracker.  It toggles between only the owners or everyone.
The trashcan is used to remove the tracker.

##### Auras

The auras work in a similar fashion.  The boxes represent a radius of bright and dim light. (again the second box is optional)
The dim light radius will always be at half opacity in regards to the chosen colour using the colour picker.
The lightbulb toggles whether this aura represents a light/vision source that will pass through fog of war.

The aura colour is by default fully transparent as this is usually what you want for lightsources, but you can change this to whatever your heart desires.

When an aura is selected as a lightsource, it will automatically show a gradual dropoff towards its edge to simulate an actual light.  For this reason the dim value of lightsource auras is ignored.

##### Annotations

Additionally a private annotation can be added to any shape you own.  This annotation will appear at the top of your screen whenever you hover over the shape with your mouse (even if it is not selected).  This is visible for all owners (and the DM).

This is a handy DM tool to quickly add information to various elements or add hidden elements on the DM layer with annotations to add room information for example.

Although I do not see a direct use for player annotations, they are available.

### User management

A basic user system is present which allows anyone to register or login to the website.

Once logged in users can create sessions and when doing so automatically become the DM of that session.
To get other users to join your session, open the DM options menu and there is an invitation code.
the full path to give to your users is `/invite/{INVITATION_CODE}` without the braces.
e.g. on your localhost on the default port 8000 it would be `http://localhost:8000/invite/23902-3234-4234-234`

Users can customise some small things when they're not the DM.  The options menu will be available with the option to
change the colours of the grid lines and the fog of war.

### Fog of War

Fog of war is a dynamic lighting system that greatly enhances the atmosphere.

The DM can choose whether the entire location is covered in shadows by default or visible.  This can be done in the DM settings menu.

Fog of war is available in a simple and more advanced way.

At its core you can reveal or hide regions on your map using the FOW tool from any layer. This has the advantage that you do not need to change layers, but is fairly limited in scope. Regions drawn using this tool are always regarded as pure fog, that light and assets can pass through.

You can also change to the dedicated FOW layer where you can use all other normal tools including the draw tool.
When drawing on the FOW layer the drawn shapes are by default assumed to be light blocking (This is not the same for the FOW tool!) and also movement blocking, you can toggle this behaviour as with all assets using the edit asset panel to finetune this vision layer.

The lightblocking shapes will only be visible on the FOW layer for the DM to reduce clutter.

The combination of light blocking shapes and light sources brings for very fun settings with a bit more tactical depth!

It is strongly advised to add lightblocking shapes to your maps if you use lightsources as you don't want your light sources to show stuff on the other side of walls ;)

You can also define the light blocking / movement blocking properties on non-FOW layer shapes.

Currently the lightsource will always draw a tiny bit of the lightblocking shape in order to give some visual feedback as to what is blocking your light.  This behaviour still requires some finetuning.

**Note:** Currently I'm experimenting with only showing those lights to a player if the player either owns the light emitting asset or if the light is in line of sight of one of the player's shapes.

**! IMPORTANT NOTICE REGARDING FOW and cheating:** At the moment all shapes on player visible layers are sent to players this means that also all shapes that
are under fow are sent to the players.  The FOW will be displayed correctly above these shapes so that they are 'invisible' to the player BUT a player with some javascript knowledge will be able to circumvent this.  There are no immediate plans to
'fix' this as I trust my players to not metagame, but I might look at this in the future.

### Initiative tracker

A very basic initiative tracker is available.  Right clicking on any shape and selecting 'add initiative' will show the initiative tracker.
This is also the only way atm to open the tracker.  The initiative tracker is cuurently automatically sorted from highest to lowest.
2 additional options are available: The vision aspect that is also present for trackers/auras but also a special group flag.  If this is not set,
removing a tracked asset will also remove the corresponding initiative tracker.  With the flag set this is not the case!  This is especially useful
if you have multiple similar monsters that should have the same initiative.

### Tools

A plethora of basic tools are available to both players and DM and can be selected in the lower right of the screen.

#### Select

You can select different objects on the active layer.  When selected you can additionally move an object simply by dragging it.  You can also resize an object by hovering over one of the corners of the object and then dragging in the desired direction.

As explained earlier these operations snap to the grid unless the alt key is pressed during the progress or if the grid is disabled.

Selecting multiple objects allows you to move/drag the entire selection from anywhere in the selection region.

To deselect shapes, you can press the 'd' key or just click somewhere outside of the current selection field.

#### Pan

When selected, dragging allows for panning the screen.

**Tip:** You can pan at all times without changing tools using the middle mouse button.

#### Draw

Allows you to draw a shape on the currently active layer.  When selecting this tool an extra panel shows up allowing you to select border and fill colours.
Currently two shapes are available: a rectangle and a circle.

This operation also is by default grid snapping.

#### Ruler

Mearure distances! woo!  Dragging will display a distance from the initial click point under the assumption that one grid equals 5ft.
Notice that rulers of other players are also visible!

**Note:**  The distances shown are determined based on the DM grid settings.

#### FOW

DM only tool

Hide or Reveal areas of the screen for your players!
See [FOW](#-Fog-of-War) for more info.

#### Map

DM only tool

When you use this tool on a selected object you can draw a rectangle over an area that should match up to (by default) 3 by 3 grid cells.
The object will then be resized accordingly.

An additional panel is visible to adjust the amount of cells you want to select in the X and in the Y direction.

After using this tool you'll often want to slightly reposition the object with the select tool and using ALT to get finer controls and no grid snapping.

## Planned

Following is a list of current TODO's in no particular order:

* Better token management
* Rotate tokens
* Some form of barebones text chat
* Layer management
    * custom amount of layers and custom order
    * icons
* More tools
    * Different shapes
    * Text
* More out of game configuration stuff
* Lighting optimisations
* Sublocations

Technical

* Provide more persistence options (database/memory store)
* Clean up server side API

NOT planned for now

* video/voice chat
* dice rolling
* Any kind of marketplace

## Installing / Backend Requirements

_Newbie info is located below_

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

All of the dependencies are listed in requirements.txt so after cloning/downloading this repo, 
a simple `pip install -r requirements.txt` should do the trick.

It should be relatively easy to swap out aiohttp for another webframework.  Aiohttp was chosen purely to try out one of the 'fancy' async frameworks.
The function of the web framwork is fairly limited in complexity.  It's main purpose is to provide an authentication layer and persistence.

It is strongly advised to use a virtual environment.

If you want to help development or tweak some code, see the DEVELOP.md guide.

#### Help I have no idea how to do this???
1. Download this project to the location from where you want to run the project. [Download link](https://github.com/Kruptein/PlanarAlly/archive/master.zip)
2. Go [install python 3.6](https://www.python.org/downloads/).  Make sure to remember where you installed python.
3. open a command prompt in the PlanarAlly-master directory that you downloaded.  (shift + rightclick in the directory > Open Powershell window here or Open command prompt window here)
4. execute `<PATH_TO_PYTHON_INSTALL>\python.exe -m venv env`  (e.g. `C:\Python36\python.exe -m venv env`)
5. execute `env\Scripts\activate`
6. execute `python -m pip install --upgrade pip`
7. execute `pip install -r requirements.txt`

Everything is now installed, you can now run the command `python PlanarAlly\planarserver.py` to start the server and then point your browser to `http://localhost:8000`

In the future you'll only need to open the directory again and then execute step 5 again before running the start command.  The other steps are no longer necessary.

You can create a special file to automate this (after everything is installed). Place [this file](https://gist.githubusercontent.com/Kruptein/c02ea3fe383c8e6d189cedc03a91684c/raw/b97d55d8e652bb479b67c4fa4caecf55a4f946f7/autostart.bat) in your main directory (make sure to save it as a .bat file NOT a .bat.txt file). Just doubleclicking this file will auto start the server.


## Running

Running `python PlanarAlly/planarserver.py` will start the webserver.  You can change the port and whether it should use https in the `server_config.cfg` file.

Without modification it runs on port 8000 and over HTTP.

**SAVE DATA**
Currently all data (user auth and session data) is stored using python's builtin shelve module.  The save format is however **not** finalized.
Changes to the save data are expected and as of yet no conversion tools are created.  _(If you require assistance in porting to a newer version contact me)_
