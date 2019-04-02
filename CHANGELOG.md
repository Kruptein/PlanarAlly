# Changelog

All notable changes to this project will be documented in this file.

[DM] denotes changes only useful for the dungeon master
[tech] denotes technical changes

## Unreleased

### Added

- Keybinding to toggle UI (ctrl+u).
- Keybinding to copy selection to clipboard (ctrl+c).
- Keybinding to paste clipboard to board (ctrl+v).

### Changed

- Asset preview now disappears when starting a drag asset action.
- A mouse down in general will now trigger layer or tool selection.
  - In the past a 'click' was required, now any 'mousedown' will trigger.
- Zoom scale has been modified.
- Select tool can now also select shapes not owned by the player.
  - The selection info box is shown with all info visible for the user.
  - The tokens cannot be dragged or resized.
  - Groupselect will only select your own tokens.
- Some minor style changes to the edit asset dialog
- Shape names can now be hidden from other users.

### Fixed

- Bug causing rulers to stick on DM screen.
- Bug causing rulers to not appear on other screens.
- Drag and drop asset on firefox redirecting to random urls.
- Some eventlisteners not being removed properly.
  - This caused zoom behaviour to mess up when leaving and joining a room multiple times.
- Bug causing players not being able to add or update initiative effects.
- Bug causing shown initiative effect to be one lower than it actually is on location load.
- Move layer to/from DM layer having broken results for players untill a refresh of the page.
- Vision bugs at different zoom levels caused by the world boundary being too large.
  - Reduced boundary location from 1e10 to 1e8.

### Removed

- Some old css files.

### [0.14.2] - 2019-01-29

### Fixed

- Registered users had to logout and login again before being able to perform actions.
- [tech] Javascript files being wrongly served as plaintext in some obscure cases.

## [0.14.1] - 2019-01-28

### Fixed

- A lot of things breaking due to a bug in shape ownership.

## [0.14.0] - 2019-01-27

### Added

- Polygon shape in the draw tool.
  - This is especially nice in combination with the new experimental vision mode!
- [DM] Options to set the minimal and maximal vision ranges when using LOS.
  - A radial gradient is applied starting from the minimal range and stopping at the maximal range.
  - This effectively allows you to play with how far tokens can see.
- Autocomplete hints to the login form.
- Edit shape dialog now has options to change the border and fill colour.
- Shape properties can now also be opened from the contextmenu (i.e. right click on a shape).

### Changed

- Wait with recalculating vision until all shapes are added on startup.
- Vision mode toggle has been moved to the DM options and is now synced with the server.

### Fixed

- Fix visionmode menu toggle not remembering what is currently selected.
- SelectionHelper mistakenly geting send to the server.
- SelectionHelper sometimes getting moved to a different layer instead of the actual shape.
- Some small QOL changes to multiline.
- Logout routing.
- Active location not being remembered by server.
- Notes not getting cleared on location change.
- AssetManager shift selection causing double selections.
- AssetManager issues with (re)moving files.
- Player location not saving properly.
- Prevent duplicate owner entries for a shape.

## [0.13.3] - 2019-01-19

### Fixed

- Multiple bugs with triangle vision

## [0.13.2] - 2019-01-13

### Fixed

- Static images were accidently no longer checked into the repository.
- DM layer was not being sent by the server.

## [0.13.0] - 2019-01-13

### Added

- A new vision system has been added based on triangulation.
  - You can select this new system as a client option
  - It is more precise (i.e. exact) than the previous vision system which was a good approximation.
  - It can handle any polygon under any angle, so expect some new draw tools in the future!
  - It is slightly more expensive to preprocess, but this should be relatively unnoticeable.

### Fixed

- Draw tool mouseUp behaviour had some strange quirks that are now ironed uit.
  - In particular this prevented some shapes of being synced correctly.

## 0.12.0

### Added

- Added curl to docker container for proper health check
- Remember which layer was selected last time [Issue 109]

### Changed

- [tech] Shape index unique constraint dropped to simplify some code
- [tech] Massive overhaul of the code organization
- [tech] Moved from manual webpack config to vue-cli
- [tech] Moved to a single page application with vue-router

## Fixed

- Backspace key added as delete action (Fixes Mac OS X delete behaviour) [Issue 69]
- Added host config option to docker config file
- Moving shapes to another layer would not always succeed at the server [Issue 108]

## 0.11.6

A collection of small improvements and fixes.

### Added

- host option in server_config.cfg [Issue 99]

### Changed

- GridLayer.size from IntegerField to FloatField [Issue 105]
- Location.unit_size from IntegerField to FloatField [Issue 105]

### Fixed

- Tokens appear as black/red with all lighting settings disabled [Issues 90/91]
- Trackers and Auras were not saved server side. [Issue 106]

## 0.11.5

Hotfixes for 0.10.0

### Fixed

- Drag and Drop file uploading fixed
- New location creation fixed

## 0.11.4

More hotfixes for 0.10.0

### Fixed

- Asset uploading

## 0.11.3

Another hotfix for 0.10.0.

### Fixed

- Actually fix the user creation bug for once.

## 0.11.2

Another hotfix for 0.10.0.

### Fixed

- Made a woopsie while fixing the earlier user creation error.

## 0.11.1

This version contains hotfixes for the 0.10.0 release

### Fixed

- Save file was not generated at the right time causing errors when no save file exists during startup
- User creation was broken

## 0.11.0

**IMPORTANT: READ THIS FIRST**

This version is part 2 of a 2 part upgrade process of the save file.
A completely new and different save format is going to be used in the future
and this requires a drastic change once, _(which is now)_

If you are about to install/use this release you either have completed part 1 (release 0.10.0) or you are starting from a new save file.
**END IMPORTANT**

### Changed

- [tech] Save file format is changed to sqlite!

### Fixed

- Shape grid snapping not getting synced on draw
- Select tool no longer selected by default on load
- Add new location action messed up websocket rooms
- CircularTokens created by non-DM users now properly set owner

## 0.10.0

**IMPORTANT: READ THIS FIRST**

This version is part 1 of a 2 part upgrade process of the save file.
A completely new and different save format is going to be used in the future
and this requires a drastic change once, _(which is now)_

In this first part a script is added to convert an existing save file to the new format. Once this conversion is done, you should continue with part 2 which is the next release.

THIS RELEASE WILL ON PURPOSE NOT RUN CORRECTLY TO MAKE SURE THE UPGRADE PROCESS IS FOLLOWED AS EXPECTED.

**You have a save that you wish to convert**

Make sure you are in the "PlanarAlly" folder containing the "planarserver.py" file. (If you are in a PlanarAlly folder with another PlanarAlly subfolder, you need to open the subfolder).

Run the script `python ../scripts/convert/database.py <save_file>`.
(if save_file is ommited, the default save file location "planar.save" is used)

If all is well this should generate a `planar.sqlite` file.

**You have no existing save or don't care about your save**

You can completely skip this release and go straight ahead to the next release.

**END IMPORTANT**

Aside of the major save file changes, some other things are present in this release cycle.

### Added

- Option to choose save file location [contributed by Schemen]
  - The server config now has an option to specify a different save file name and/or location.
- Dockerfile [contributed by Schemen]
  - A dockerfile is now present to support deployment in docker containers
- VERSION file in the python folder
  - This will be used in the future to detect software updates

### Fixed

- Unable to drag modal dialogs in Firefox
- Unable to drag assets in Asset Manager in Firefox
- Empty asset and note list was to small for icons
- Tools started with lowercase
- Radial menu buttons had border when clicking them

## [0.9] - 2018-09-26

### Upgrade information

#### Save format changes

The save format has been changed from version 1 to 3, that's 2 increments in one release yes.
This is due to the size of the release involving multiple new features that involved separate changes that were developed in parallel to eachother.

As always make sure to back up your old saves before converting!
To update run both `python ../scripts/convert/1_to_2.py` and `python ../scripts/convert/2_to_3.py` from within the same folder as your save files.

#### Asset changes

The way assets are stored on disk and managed in game has completely changed. You'll no longer be able to manage your assets from your file manager or command line, and will have to use the in-browser tools to work with them. This is a change that was required in order to provide extra features to the assets while preserving disk space. (e.g. personal assets / share assets / default templates / ... )
Assets are now stored in `/static/assets/` instead of `/static/img/assets/`. In order to keep your current saves working (if they have assets that rely on the old image locations), the old folder is kept intact and will not be removed. You are free to do with this folder as you please as it is no longer used by PA itself.

### Added

- Added a note system
- Initiative tracker update
  - Now shows the active actor and has a next turn button
  - Shows the current round number
  - Turn/Effect timers per actor that automatically count down
  - Show a border around shapes on hover in the initiative list
- New Asset management panel
  - Out of game way to organize assets
  - Upload files via a dialog or by dropping them on the manager
  - Rename/remove files/directories
  - move files/folders to other folders
- Freestyle brush has been added as a draw shape
  - FOW usage is limited
    - Currently only works when global fog is applied.
    - Works when used from the draw tool in reveal/hide mode
    - Does not properly work in normal mode on the fow layer!
    - In general: Use it to draw on non-fog layers or use it in reveal/hide mode
- [tech] tools onSelect and onDeselect for more finegrained tweaking and UI helpers
- Option for players to select the colour of their rulers.

### Changed

- Renamed 'Tokens' to 'Assets' in the settings panel
- Redesigned the way assets are shown in the settings panel
  - A tree view approach is used, showing preview images on hover
  - Removed the cog wheel
  - A button to open the asset manager is added to the in-game interface.
- Draw and fow tools have been combined in one singular draw tool
  - Options between 'normal' mode and either 'hide' or 'reveal' mode if you want to draw fog
  - Fog is now always drawn in the client's active fog colour
  - Also shows a brush tip while moving the mouse
- Dim aura range should no longer include the normal range value
  - e.g. an aura that used to be 20/60 should now be 20/40
- [tech] Most UI is now rendered using the reactive Vue.js framework instead of JQuery
- Draw order changed
  - First all auras are drawn and then all shapes are drawn
  - This prevents auras overlapping shapes
  - Shape order is still respected

### Fixed

- Select box not working properly on the fow layer
- Ownership changes are now reflected in the initiative list
- Dim value aura's had the wrong radius
- Dim value aura's nog properly work with light sources.
  - Instead of halving the opacity, the radial gradient is applied across the entire aura + dim aura radius.
- Deleting multiple shapes no longer sends the selectionhelper to the server

## [0.8] - 2018-06-19

This release greatly increases performance of all lighting modes and also properly
introduces Line of Sight based lighting system.

SAVE_FORMAT CHANGED FROM 0 to 1
BACKUP YOUR OLD SAVE BEFORE CONVERTING!
UPDATE YOUR SAVE BY EXECUTING `python ../scripts/convert/0_to_1.py` FROM WITHIN THE `PlanarAlly` FOLDER THAT CONTAINS YOUR SAVE FILE, THE SERVER CONFIG AND THE OTHER PYTHON FILES!!!

### Added

- Show initiative action is added to the general context menu
- [tech] A Bounding Volume Hierarchy ray tracing accelerator is used.
  - This greatly! improves the performance of all lighting including the experimental LoS based lighting.
- [tech] multiple debugging flags under Settings.
- [tech] extra layer added that is used for fow. Now two layers are responsible for this.

### Changed

- Right clicking will now only show a shape specific menu if it was done on a selection
  - All other right clicks will show the general purpose context menu
- Light auras now properly follow the actual path formed by vision obstruction objects
- FOW layer drawn shapes now retain their proper colour used during drawing.
- Movement that is normally grid-snapping will go out off grid if it stops against a movement blocker
- [tech] Cleaned up the Vector class, splitting it up in a Vector and a Ray class
  - Vector: purely direction indication
  - Ray: combination of an origin point and a vector
- [tech] A much more performant ray box intersection algorithm is used

### Fixed

- Shapes no longer get stuck in movementblockers on occassions
- Auras were ignored in the visibility check during layer shape draw

### Reverted

- assets dropped on canvas are no longer tagged as token
  - Tokens should only be used for actual player representatives

## [0.7] - 2018-06-12

### Added

- Rough background to the annotation field to make it more readable

### Fixed

- Annotations correctly position centered on the screen
- Annotations correctly wrap words to the next line
- Delete key no longer removes shapes while in input fields.
- Scrolling only zooms when a canvas is targetted.
- Exit button now correctly positioned when token list is large

## [0.6] - 2018-06-11

### HOTFIXED

- shapes moved with arrow keys were not being synced to the server
- assets dropped on canvas are immediately tagged as token

### Added

- [DM] Using the shift key, shapes can move freely through movement blocking terrain.
- Pressing 'd' now deselects everything

### Changed

- Arrow moves will move assets when they are selected instead of the canvas.
  - The canvas will still be moved if no shape is selected
  - [DM] Shift key can also be used to pass through terrain.
- Shape drawing now uses same behaviour in regards to grid snapping
  - by default shapes will resize to fit the grid
  - when alt is pressed on mouseUp during drawing or if the grid is disabled, the shape will not resize to grid.
- Only tokens will have a minimal vision aura
- Add DM settings option to enable Line of Sight based lighting
- Disable LoS based lighting by default

### Fixed

- Deleting a selection of assets should now behave correctly. (Sometimes not all assets would be deleted)

## [0.5] - 2018-06-03

### Added

- Added an exit button in-game
  - This will now bring you back to your sessions
  - Also added a new logout button to the sessions menu
- Add token toggle to shape settings
- Line of sight based light for tokens
  - Only see lights that fall in your line of sight

### Changed

- Improved the visuals of the toolbar and layer manager
- Multiple large light/shadow related performance improvements for firefox
  - Chromium based browsers had slight improvements but already were (ans still are) much more performant in regards to FOW calculation
- Shapes that do not have an associated image, now show their name or token tag in the initiative dialog

### Fixed

- The dim value attribute of auras was wrongly used as the normal aura value
- The grid is now redrawn at the same time as the other layers instead of immediately
- The light source toggle on shapes now immediately redraws the screen
- Map tool properly works in all directions again
- Sessions with spaces not working
- Assets with ' not appearing correctly in the token list

## [0.4] - 2018-05-04

The great bugfix release

### Added

- Bring players here function in the rightclick menu when nothing is selected
  - This will bring over all players to the exact same pan and zoom settings as the DM
  - Only the DM can access this

### Fixed

- Grid size DM UI works again. It broke in 0.3
- Cutoff zoom at 0.01 instead of 0, as zoom factors of 1e-16 caused issues with pages crashing
- Adding a new location did not correctly send some options to the client
- The annotation field in the edit asset dialog now prevents key presses to propagate to the board (e.g. no longer deleting shapes because you pressed delete in the textfield)
- The selection box now is smaller for very small assets
- Slowdown on the opening of the edit asset dialog throughout gameplay has been fixed.
- Location options not synced immediately
- Quick tracker/aura edits now work again

## [0.3] - 2018-04-19

### Added

- Shape selection option is added to the draw tool, currently giving the option between a rectangle and a circle.
- More camera options
  - Use the arrow keys to move 1 grid unit in the pressed direction
  - Use the scroll wheel to zoom in and out
  - Press the middle mouse button to pan without using the dedicated pan tool
- Quickly create simple circular text tokens
  - right click anywhere that is not an active selection and select the 'create basic token' option
  - You can insert any text and choose the fill and border colours
  - Although singular letters or numbers work great, any text will be scaled to fit inside the circle, so longer texts can also work.

### Changed

- Line width of shape borders increased to 5

### Fixed

- Various initiative issues with locations

## [0.2] - 2018-04-11

This update is firstmost an update in regards to the development process so little to no new feautures are added in this release.
A couple of important bugfixes are included though.

### Added

- A save file version is added to the save to possibly convert older saves in the future.
- A barebones annotation system for shapes
  - You can add text to any asset using the edit asset dialog
  - Whenever you mouse-over a shape you own the text will appear at top of the screen
  - This is mostly a DM tool but players can use it as well.

### Fixed

- Websocket protocol now correctly chosen at the client side, this caused players to just see a blank scene in some situations
- Players on a different IP as the dm now actually see images.
- Pan and zoom options are now remembered per user AND location instead of only per user.
- MovementObstruction and visionObstruction were not immediately synced on toggle.
- Groupselect now behaves more predictable when one member collides with a movement blocker

### Changed

- Move from 1 large javascript file to a proper multi file typescript system
- When dragging an asset against a movement blocker, it will smoothly slide across the blocker instead of completely locking up.

## [0.1] - 2018-03-22

### Added

- Initiative tracker
  - Right click on any asset and add it to the tracker.
  - Options to hide initiative of certain assets
  - The initiative of an asset will be removed on delete
    - this can be disabled with the 'group' flag. This is very handy for minions with the same initiative.
- Every 5 minutes a save will be written to disk as an extra persistent layer.
  - saves already happend on other occasions.

### Fixed

- The delete key no longer removes selected assets if used in an input field!

## [0.0] - First public mention
