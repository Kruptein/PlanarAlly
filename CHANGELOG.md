# Changelog
All notable changes to this project will be documented in this file.

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
