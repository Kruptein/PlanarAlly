# Changelog
All notable changes to this project will be documented in this file.

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
- Deleting a selection of assets should now behave correctly.  (Sometimes not all assets would be deleted)

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
- Grid size DM UI works again.  It broke in 0.3
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
