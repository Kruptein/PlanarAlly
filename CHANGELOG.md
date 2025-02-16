# Changelog

All notable changes to this project will be documented in this file.

[DM] denotes changes only useful for the dungeon master\
[server] denotes changes only useful for the server owner\
[tech] denotes internal technical changes that are only useful for code contributors\
tech changes will usually be stripped from release notes for the public
[lang] this is a change to some translation string

## Unreleased

### Fixed

-   Draw tool polygon was not updating vision until shape completion

## [2025.1.1] - 2025-02-08

### Fixed

-   pydantic version patched to 1.10.18 to fix windows build
-   [server] docker server config did not have new keys

## [2025.1] - 2025-01-31

### Added

-   Draw tool:
    -   Added default colours for walls, windows, doors
    -   These get automatically applied when the relevant vision/logic settings are enabled in the draw tool
    -   Can be disabled by unchecking the 'prefer default colours' checkbox in the draw tool vision settings
    -   The specific colours used can be configured in the user options Appearance section and will update shapes retroactively
-   Notes:
    -   Notes can now be popped out to a separate window
-   NoteManager:
    -   Added a button to clear the current search
-   In-Game Assets UI:
    -   Option to search through assets
    -   Option to add folder shortcuts per campaign
        -   These allow quicker navigation to frequently used folders
        -   A "All assets" shortcut is always available
-   [server] Assets:
    -   limits:
        -   Added limits to the total size of assets a user can upload and the size of a single asset
        -   These limits can be configured in the server config
        -   By default there are no limits, it's up to the server admin to configure them
        -   These limits will only apply to new assets, existing assets are not affected
    -   Thumbnails:
        -   The server will now generate thumbnails for all assets

### Changed

-   Dashboard:
    -   Changed some border colours in the create new game menu
-   MenuBar:
    -   Add Notes button for players
-   [tech] Select tool:
    -   Delayed syncing of selection state to the global state from mouse down to mouse move/up
    -   This fixes some of the entries in the Fixed section
-   AssetManager:
    -   Changed UI of renaming assets, allowing inline editing rather than opening a popup
    -   The images shown in the asset manager will now use the thumbnail of the asset if available
        -   This should reduce load times and improve general performance
        -   This also applies to the preview when hovering over assets in the in-game assets sidebar
    -   Remove initiated from the context menu now removes the entire selection
    -   Context menu retains selection unless an item not in the current selection is clicked
-   In-game assets:
    -   Sidebar is removed and replaced with a new Assets dialog similar to notes
    -   The new UI has almost full compatibility with the assets in the dashboard
-   Notes:
    -   Add filtering option 'All' to note manager to show both global and local notes
    -   Note popouts for clients without edit access now show 'view source' instead of 'edit'
-   Dice tool:
    -   Last result is now displayed in the dice tool rather than a popup window
    -   Result breakdowns are shown in the last result display and history
    -   Added a reroll button to quickly redo the previous roll
    -   Added a reroll button to history entries
    -   Add an option to roll 3D dice inside a dice box rather than over the playfield
    -   Input field now scrolls to the end after populating via the on screen buttons
-   @planarally/dice:
    -   (this is the standalone dice library that handles most of the dice logic and rendering)
    -   Upgraded to v0.7
    -   Dice will now stop sliding smoother
    -   Clear state can be configured
    -   D100 dice now properly work in 3D for the full range (1-100 / 0-99)
        -   Currently hardcoded to 1-100 in the client, but the library can be told otherwise
-   I18n:
    -   Added 95% i18n for zh (except diceTool)
-   [server] Assets:
    -   Assets are no longer stored in a flat folder structure, but instead use a subpath based structure
        -   An asset with hash `35eaef2e9a116aa152f7f161f1281411cb1e1375` is now stored as `assets/35/ea/35eaef2e9a116aa152f7f161f1281411cb1e1375`
-   [tech] Systems: Move system-core from game/ to core/ so that it can also be used by e.g. assets

### Removed

-   Labels:
    -   As mentioned in the last 2 releases these were going to be removed
    -   I wasn't happy with the current implementation and they were causing more confusion than they were useful
    -   This also removes the Filter Tool
-   .paa asset handling
    -   This was no longer really maintained and the current frontend doesn't offer any support for it

### Fixed

-   Notes:
    -   It was possible to open a 'view-only' note on a tab you weren't supposed to see
    -   Note manager could be empty and unusable when changing locations or losing view access to an open note
    -   Search filter not resetting page to 1 potentially causing a blank page if on an other page
    -   Default edit access on notes was not correctly applied
    -   Fix searchbar overlapping over other modals
    -   Global notes no longer have a default access level
    -   Notes can no longer be locally edited by clients without edit access through the note popouts
-   Shape Properties:
    -   Input changes could not persist or save on the wrong shape if selection focus was changed while editing (see selection changes)
-   Modals
    -   Dragging modals (e.g. notes) now also brings them to the foreground as if clicked
-   Composites:
    -   Moving composites to a different location could sometimes lead to errors on the client even though the moves were succesful serverside
-   Select Tool:
    -   Snapping an existing shape point to some other point could be overriden with a snap to the grid
-   Game Listing:
    -   Clicking on a session that shares a name with another session would foldout both

## [2024.3.1] - 2024-11-12

This is a hotfix that addresses an issue causing some shapes to be in a broken DB state, causing the related location to no longer load.
The issue only happens when removing a Character. The root of this issue seems to be related to an upgrade of the db framework which has a regression in its handling of certain removes.

The only change in this patch is a downgrade of the db framework and a temporary script to remove broken shapes.

The script is added to the server folder and can be run with `python remove-broken-shape-links.py`.
When run as is, it will loop through all shapes and print out the ones with broken links.

When run with the `delete` argument, it will remove the broken shapes from the DB. (i.e. `python remove-broken-shape-links.py delete`)

## [2024.3.0] - 2024-10-13

### Removed

-   Remnants of last-gameboard integration code
    -   This was no longer maintained and no longer working afaik

### Added

-   Optional simple chat system
    -   This is **not** stored serverside, so messages will be lost on refresh or later re-opening of the session
    -   Chat is basic markdown aware, but does not allow direct HTML
    -   (image) urls can be pasted without special markdown syntax
    -   Can be collapsed by clicking on the chat title
-   Collapse Selection: Temporarily move all shapes in the selection under the cursor for easier navigation through corridors
-   [DM] new DM settings section: Features
    -   Can be used to enable/disable certain features campaign wide
    -   Currently limited to chat & dice

### Changed

-   Select tool:
    -   now integrates all the ruler toggles in its UI as well
    -   these toggles are synced with the ones in the ruler
-   Spell tool:
    -   now renders hexes instead of squares in Hex grid mode
    -   step size changed to 1 in Hex grid mode
    -   shape bar is no longer visible, only hex is available in hex grid mode for now
-   Ruler tool:
    -   now defaults to sharing with other users
-   Dice
    -   non-3D mode
    -   option to use a click interface to build dice strings
    -   extra operators and selectors (e.g. keep highest 2)
    -   3D code & assets are only loaded when settin "use 3D" to true in the tool config for the first time
    -   3D physics now uses havok engine instead of ammo (babylonjs upgraded from 4 to 7)
    -   history & result UI slightly changed
    -   Option to share result with nobody
    -   clicking on the notification of another player's roll shows the details
    -   clicking on a history entry shows the details
-   Toolbar UI
    -   All extended tool UI is now right aligned fully, no longer hovering over the related tool
    -   This was preventing tools to the left to be limited in screen estate they could occupy

### Fixed

-   Draw tool:
    -   Clicking on the "blocks movement" label in the draw tool's vision setting now properly toggles the related checkbox
-   Ruler tool:
    -   Gridmode spacebar did not synchronize snapped end correctly to other players

## [2024.2.0] - 2024-05-18

### Added

-   New grid section in Edit Shape dialog
    -   Configure manual size for shape
        -   Used for finetuning snapping behaviour
    -   Show grid cells the shape occupies
    -   Configure hex orientation
        -   This is used to determine which orientation even-sized shapes should use in hex grids
-   Client Setting "Grid Mode Label Format" to decide what the ruler should show in grid mode
    -   This can be set to either '#cells only', 'distance only' or 'both'
-   Import: option to specify the name for the imported campaign

### Changed

-   Export/Import:
    -   Error toasts no longer have a timeout
    -   (Shape)Labels are no longer exported/imported
-   Ruler tool: allows Unit Size less than 1.0
-   Context menus have been restyled
-   [tech] Select tool: only take shapes in view into account
-   [tech] Properties System can now handle multiple shapes loaded at once

### Fixed

-   Draw Tool:
    -   snapping mode was also snapping to the point being moved
    -   now also snaps to hex vertices
    -   the first mouse press now also properly snaps to the grid
    -   fix small point changes when flipping the rectangle axis while drawing
-   Select Tool:
    -   resizing in snapping mode was also snapping to the point being resized
    -   polygon edit UI had a small visual glitch on appearance causing a circle to appear around (0, 0)
    -   Snap to Grid:
        -   This now has an implementation for hex grids
        -   This should now more properly snap shapes that are larger than 1x1
-   Ruler Tool:
    -   Snap now properly works for hex grids
-   Map Tool:
    -   Now better supports hex grids
-   Spell tool:
    -   selecting another tool would swap to the Select tool instead
    -   Change 'Size' input box to allow entering numbers less than 1 easily
-   Polygon:
    -   selection/contains check went wrong if a polygon used the same point multiple times
    -   selection/contains check was also hitting on the line between the first and last points when not closed
-   Moving shapes to front/back not updating immediately
-   Export:
    -   Missing Character, DataBlock and new Note data
    -   Fixed note data migration crashing due to new format
-   Import:
    -   Prevent a potential timing edgecase causing import to run twice
    -   If an import fails, the newly created (faulty) room will be removed
-   Notes:
    -   The filter was not properly rerunning when opening shape notes, causing notes from the previous shape to still be visible sometimes
    -   When shape filtering, the shape name in the UI would change if you clicked on another shape with the select tool.
    -   Note icons drawn on a shape could be drawn behind the shape in some circumstances.
    -   Fix 'add shape' and 'remove shape' events not being synced immediately if you only have view access
    -   Note icon on shape was drawn in strange locations for shapes larger than 1x1
    -   Fix shape removal not properly removing the shape from related notes client-side
    -   Fix notes not being stored in shape templates
-   Groups:
    -   The 'edit shape' groups tab was completely broken, this has been resolved
    -   Multiple things in the groups tab have become more responsive to changes
        -   Everything badge related is now updating as it happens
        -   Members will now appear/disappear immediately
-   Initiative:
    -   Fixed an issue where Initiative.Order.Change would fail when called with some Shape Ids.
-   Annotations:
    -   Fixed rendering of markdown which included raw HTML elements.
-   Changing client settings for the grid would not immediately update the screen
-   [tech] FloorSystem's layers properties are now only reactive on the array level and are raw for the actual elements.

## [2024.1.0] - 2024-01-27

### Added

-   New location grid setting: drop ratio
    -   This is used to indicate how shapes with size info dropped on the map should be resized
    -   (e.g. a goblin_2x2 will take op 2x2 cells in any setup with dropRatio 1, with dropRatio 0.5 however it would only take up 1x1)
    -   This addresses an issue where this was not properly working with non ft setups
-   Selection Box UI now offers a 'clear' and 'select all' option if it's a multi-select popup

### Changed

-   Vision blocking shapes will now ignore themselves if they are closed
    -   e.g. a tree trunk will be visible, but what's behind the tree trunk will remain hidden
    -   Open polygons will behave as they have in the past
-   Note system is overhauled
    -   notes can now either be global or local (i.e. campaign specific)
    -   notes can now be shared with other players
    -   notes are now accessed through a special note manager
        -   this provides filtering / creation / editing / ...
    -   multiple notes can be popped out at once
    -   popout notes can be collapsed and freely resized
    -   popout notes are now markdown aware
    -   If the text area of a note is still in focus after 5 seconds and an edit was made, a server save is done
    -   _see the release notes for all the changes_
-   Dice history now contains user and details
-   Selection Info: auras are now toggle and rotation sliders instead of range modifiers
-   [tech] ModalStack now supports dynamically inserted modals

### Fixed

-   Polygon edit UI: was not taking rotation of shape into account
-   Teleport: shapes would not be removed on the old location until a refresh
-   Dice tool: would not send zero results when dice list is empty
-   Character: a collection of bugs with variants have been fixed
-   Trackers: add max-height and scrolling
-   RotationSlider: fix sync issues
-   RotationSlider: fix slider anchor not sticking to the rail under certain angles
-   [server] log spam of "unknown" shape when temporary shapes are moved

## [2023.3.0] - 2023-09-17

### Added

-   Character concept
    -   A shape can be marked as a character
    -   Characters can be dropped anywhere (by the DM), moving/teleporting the shape to the new location
    -   This fills in a niche adjacent to the "Templates" concept
        -   Templates allow configuration of common data before placement, allowing unique modification afterwards
            (e.g. useful for prefilling monster info)
        -   Characters are a specific instance that remember their modifications (e.g. useful for (N)PCs)
-   Sort campaign listing by recent play or alphabetically
    -   Defaults to recent sort

### Changed

-   Assets removed in the asset manager will not remove the image on disk if there are still shapes depending on it
-   Shape removal will now also remove the related image on disk if there are no other assets/shapes depending on it
-   Circles used for shadows no longer use a square bounding box, but instead use a polygon approximating the circle.
-   [tech] Don't serve main app on unknown `/api/` endpoints
-   [tech] Selected system now has a proper state with better type ergonomics for focus retrieval
-   [tech] Spawn Info no longer sends entire shape info, but just position, floor, id and name

### Fixed

-   Export: Campaigns with notes could fail to export
-   Vision: Edgecase in triangulation build
-   Kicking: The check to prevent the co-DM from kicking the main DM was incorrect
-   Shapes: The angle of shapes while rotating was being rounded to whole integers, which is kinda awkard when dealing with radians
-   Lighting: auras with both value and dim value set to 0 no longer light up the entire map
-   [tech] AssetManager: Folder changing was doing an unnecessary extra call to the server
-   [tech] Socket: Changing location was not properly leaving the socket connection to the previous location

## [2023.2.0] - 2023-06-21

### Added

-   Drop new assets on the game directly
-   Scroll-like touch gestures no longer attempt to scroll the gameboard out of bounds

### Changed

-   Templates no longer save certain settings
-   Bring players no longer changes the zoom level of the players
-   TpZone: When a player TP request arrives, the view area action will bring the DM to the trigger location and not to the target location

### Fixed

-   Group: No longer sending group info for each member (just once)
-   Group: Shape group settings fixes
    -   Create group button was not properly behaving
    -   Remove group button was not immediately updating the UI until a reselection
-   Group: Fix socket events no longer being listened to; Fixes multiple things that were resolved when you refreshed
-   Auth: A logic error in the auth routing code - in some cases you had to manually go to the login page
-   Templates: Missing some settings when saved
-   Fake Player: Proper rework of access handling
    -   Shapes and auras should now only be rendered _if and only if_ some player in the game has `vision` access to that shape _AND_ the shape is selected in the vision tool.
    -   This also hides invisible shapes
    -   This also hides _all_ auras on the DM layer regardless of the vision tool
-   Labels: Fix removal not working
-   Toolbar: Fix vision and filter tools not immediately being available when relevant
-   Access: Fix players with specific access rules, having edit access at all times
-   Access: Changing access would not live update the edit shape UI if it was open by another client
-   Access: Fix default access in UI not being up to date if shape has no access modifications until reload
-   Access: Prevent DMs from having an explicit access rule
-   Access: No longer gives full access for fake DM
-   TpZone: Fix tp zone moving a player to a different floor not moving their view along (if 'move players' configured)
-   TpZone: Fix non-immediate player initiated teleports not working correctly
-   TpZone: Fix teleports initiated in build-mode not working correctly for players
-   Logic: Request mode not working as intended and behaving as Enabled mode instead
-   Token Directions: Fix shown tokens not taking filtered tokens into account
-   Auras: Fix sometimes not being visible until a refresh or panning closer to the aura
-   Rendering: Transparency of higher layers was no longer applied after a window resize
-   Rendering: Some cases where vision access related changes would not rerender immediately
-   Rendering: Grid not rendering horizontal lines when the width is smaller than the height of the screen
-   Select: Rotation UI should stay consistent when zooming
-   LocationBar: Fix width on drag handle for multiline locations
-   Properties: Invisible toggle not applying until a refresh for players
-   Initiative: Vision lock not properly checking active tokens
-   Initiative: Removing the last entry while it's active could break initiative
-   Vision: Edgecase that could cause an infinite loop when drawing vision lines
-   Draw: Reduced number of points in brush mode significantly
-   AssetManager: Fix progressbar missing
-   Annotation: Markdown no longer rendering as bold
-   [server] Subpath: 2 cases where subpath based setup was not properly loading images (initiative & change asset)

## [2023.1.0] - 2023-02-14

### Added

-   Button to change the current asset for a shape to the shape property settings
-   [DM] Quick access togglebar under the tool bar
    -   Fake Player
    -   Initiative active state (see below)
-   Initiative now has a specific "active" state
    -   This streamlines some things and allows some further future things without relying on the initiative window being open
    -   The Initiative vision lock setting now only triggers when initiative is active
    -   The above setting now also properly reverts to the original vision lock when initiative is no longer active as was always intended
    -   The initiative UI is automatically opened for everybody once initiative is started. (and automatically closed as well)
    -   The above behaviour can be disabled by a new user setting.
    -   A new DM setting (under Varia) can be enabled to limit (non-DM) initiated movement only to the active initiative shape.
-   Most modals will now move to the front when interacted with
-   Most modals can be closed with escape

### Changed

-   Spell tool
    -   range property is removed as it was confusing to people and a bit fiddly
    -   a ruler is now automatically drawn between the spell shape and the selected shape
-   Dice tool: Add min-height in dice tool UI where the dice to roll are being prepared
-   [lang] The edit dialog for shapes now properly says "Edit shape" instead of "Edit asset"

### Fixed

-   Spell tool: spell on selection bugged
-   Spell tool: fill colour behaving janky when border colour has <1 opacity
-   Spell tool: right-click was opening the context-menu
-   Spell tool: once used, the select tool was not being properly activated
-   Spell tool: the 'is public' label was wrongly attached to the range input box
-   Fake Player: showing DM layer
-   DM settings: Fix last DM being able to demote themselves to a player
-   DM settings: Fix invite URL not containing subpath if set
-   Assets: default stroke colour wrongly set, causing badges to be transparent
-   Trackers: Display on token not working for trackers that are shared across variants
-   Some cases where a client could edit shape info without access
    -   _this was always rejected by the server and never synced_
    -   most tracker properties
    -   defeated and locked state using keybinds
-   Prompt modals sometimes still using a validation check from an earlier prompt
-   Resizing the botright corner of a rectangle-based shape while rotated was moving the shape
-   Token direction UI triggering when other UI is on top of it
-   Floor detail UI not moving along if side menu is opened
-   Unlocking shape could sometimes trigger the shape following your mouse
-   Templates: only using the first character of the provided template name
-   Asset Manager: close contextmenu when scrolling
-   Asset Manager: contextmenu appearing in the wrong location when scrolled
-   Adding multiple shapes to group always prompting group question even if no groups are present

## [2022.3.0] - 2022-12-12

### Added

-   Pan with right-click drag
-   User configuration option to limit rendering to only the active floor
-   User setting to change toolbar between icons and words (defaults to icons)
-   Out-of-bounds check with visual UI element to help people get back to their content
-   Show off-screen token directions
-   Import/Export
    -   Export now redirects to a separate page
    -   Both Import and Export now have a status prompt, giving more clarity that things are happening
    -   New game now offers a selection between an empty campaign or importing a campaign
-   Individual die results are now also shown
-   [DM] Players section in the left in-game dm sidebar
    -   Lists players connected to the session
    -   Clicking on a name, centers your screen on their current view (if on the same location)
-   [server] option to specify alternative location for static files

### Changed

-   Draw tool vision and logic tabs will now have a background colour if they are active as a reminder
-   Dashboard UI has been updated (once again)
-   Quick tracker/aura changes
    -   Now supports more complex expressions (most mathematical expressions should work)
    -   Now has a toggle between absolute and relative mode
    -   A new Client Setting - Behaviour has been added to set the default update mode (absolute vs relative)
-   [DM] Asset Manager UI has been updated and is now integrated with the main dashboard
-   [DM] Player viewport rectangles are now shown per client connected for that player instead of 1 rectangle following the latest move
-   [DM] Hiding a token using the vision tool will now also hide their private light auras
-   [server] moved all python imports to proper relative imports
    -   this changes the way to manually run the server (again) (sorry)
-   [tech] keep shape centers in memory instead of recalculating on the fly

### Fixed

-   Vision tool alert state was not always accurate
-   Teleport zone not properly triggering when initiated as a player
-   Teleport zone not properly landing in the center of the target
-   Player door toggles not syncing to the server/persisting
-   Shared trackers/auras not showing up in selection info
-   Shared trackers/aruas removal not showing in client until refresh
-   Errors in prompt modals were not visible
-   Annotation visible info not syncing to other clients until refresh (UI only)
-   Player state clearing on location change
-   Zoom sensitivity on touchpad
-   Typo in location menu
-   Multiple Initiative bugs
    -   Server should detect client errors in initiative listings better and reject wrong data
    -   Modification of the initiative should retain the current active actor under more circumstances
    -   Removal of shape caused some initiative inconsistencies
    -   Changing between DM layer and player visible layer would trip up initiative sometimes
-   In-game AssetPicker modal UI fixes
-   Prompt modal not clearing error message properly
-   Tool details not always being in the correct location (e.g. when changing mode)
-   Trim down noisy whitespace in selection info
-   Initiative camera-lock not changing floors
-   Door/Tp area preview not changing floors
-   Jump to marker not changing floors
-   Moving composite/variant shape to other floor and following would show extra selection boxes
-   Draw layer being rendered below the fog (e.g. rulers/ping etc)
-   Vision not properly recalculating when removing blocking shapes on multifloor setups
-   AssetPicker UI appearing too low
-   Polygon edit UI being left behind when panning
-   Moving polygon point when polyon is rotated
-   Normal shapes sometimes wrongly being identified as spawn locations
-   Dice sometimes going offscreen
-   Keyboard movement not moving select-tool's rotation helper
-   [DM] Assets not being able to moved up to parent folder
-   [DM] Assets not being removable if a shape with a link to the asset exists
-   [DM] Annotations still being visible until refresh after removing player access
-   [DM] Resetting location specific settings was not immediately synchronizing to clients until a refresh
-   [DM] Enabling fake-player mode would hide the DM entries from the left sidebar
-   [DM|server] The asset manager was no longer useable when using a subpath setup
-   [server] Diceroller not working on subpath server

## [2022.2.3] - 2022-07-13

### Fixed

-   [server] Windows executable builds not using the correct directory for certain files (e.g. config/assets)

## [2022.2.2] - 2022-06-17

### Changed

-   [tech] Use WAL mode for database

### Fixed

-   Auras giving light when light source is turned off
-   Ghost initiative entries showing up as ? that cannot be removed
-   Database lock errors while importing during load
-   [server] Server not being able to start due to ModuleNotFoundError

## [2022.2.1] - 2022-06-13

This hides the export/import behind a server config option as I found an important underlying concurrency problem,
which is undesirable for a server with multiple active users.
In order to prevent these servers from running into issues due to upgrading to 2022.2,
I'm already publishing these changes.

Depending on the complexity of the concurrency issues,
I may release a 2022.2.2 soon-ish or it will end up being part of a later 2022.3 release.

### Added

-   [server] server config option to enable import/export, defaulting to False
    -   given the experimental nature, it's better to not enable this by default
    -   it's strongly recommended to only enable this if you run a private server for the moment

### Fixed

-   Note export failing
-   Markers not being exported

## [2022.2] - 2022-06-12

### Added

-   Colour picker now remembers the last 20 used colours for each user.
-   [DM] Export all campaigns endpoint
-   [DM] UI export campaign option in room details
-   [DM] Import campaign support
    -   Can import older saves (if the migration code is still available (i.e. < 1 year old))

### Changed

-   Add white outline to the door logic (un)lock icons
-   Door logic can now specify which block settings to toggle
-   Add double stroke to client viewport
-   Show campaign loading animation earlier (in dashboard)
-   Defeat cross now scales better with shape size
-   Shape badge now scales better with shape size
-   Show default "no" button in delete/leave campaign prompt
-   Default location zoom level is now 0.2 instead of 1.0
-   [server] Added log rotation
-   [server] Restructure server files
-   [tech] SyncTo primitive modified to an alternative Sync structure
-   [tech] Polygon can now have client-side multi-stroke
-   [tech] Snappable points are calculated less often
-   [tech] In-game asset list rendering
-   [tech] Moved http utils to core/http file from core/utils

### Fixed

-   Exporting a campaign where there are images that have no specific asset associated with them, would fail
-   Exporting a campaign was not properly copying the active pan and zoom info for users
-   ExtraSettings svg section not updating immediately until changing tabs
-   ExtraSettings remove svg not properly working
-   ExtraSettings add svg not working for shapes with no prior svg properties
-   Spawn locations loading wrong
-   Teleport zones triggering from other floors
-   Draw tool door permissions not saving
-   Door logic toggle not immediately updating UI when shape properties are open
-   Logic init edge cases breaking UI until refresh
-   Redo logic on resize operation not remembering correct location when it was snapped
-   Asset Manager correctly updates UI when using browser back/forward buttons
-   Clear client viewports when changing location
-   Dashboard navigation headers sometimes being wrongly styled
-   Modal handling on firefox
-   Colour picker resetting saturation panel to red when clicking
-   Colour picker resetting opacity when setting hsv color
-   Drawtool trying to add shape creation operation to undo stack when the shape was not valid
-   Points modified by the polygon edit UI are not snappable until a refresh
-   Logic Permission selector showing error in edgecase
-   Asset socket was not cleaning up past connections
-   Auras that are light sources, no longer appear as a black circle of doom when FOW is not turned on
-   Undo/Redo not persisting to server for movement and rotation
-   [server] Admin client was not built in docker
-   [tech] Ensure router.push calls are always awaited

## [2022.1] - 2022-04-25

For server owners using a subpath, some important changes are made, so make sure to check the changed section before upgrading

### Added

-   simple logic systems to attach to shapes
    -   these logic systems can be configured with permissions
    -   current set of logic systems:
        -   door
            -   Automatically toggle blocking settings for a shape with a single click
        -   teleport zones
            -   Automatically move shapes to spawn points
-   Dropping an asset with dimension info in its name (e.g. 50x30) will automatically size the asset
-   [asset-manager] drop support for folders
-   [server] Added `allow_signups` option in the `General` config section that can be disabled to prevent users from signing up themselves
-   [server] Added barebones admin dashboard
    -   this uses the API endpoint and requires a token
    -   lists users + reset password + delete
    -   lists campaigns
-   container (Docker) build instructions for arm64

### Changed

-   Draw tool UI now has a tabbed interface
    -   a shape tab to configure shape and colours
    -   a visibility tab to configure advanced vision modes as well as blocksVision and blocksMovement changes
-   Polygon edit tool will hide UI while dragging a point/shape
-   [server] Change subpath handling
    -   the client now MUST also set the PA_BASEPATH env variable in production mode
    -   this means the env variable needs to be set at build time
    -   the basepath now HAS TO END with a slash
    -   for docker this means you need to manually build the image
        -   use `--build-arg PA_BASEPATH='/subpath/'
        -   you no longer need the `--env PA_BASEPATH` flag

### Fixed

-   Floor not being remembered on reload after "Bring Players" action
-   Shape pasting not properly increasing badge counters
-   Default vision shapes always acting as tokens (regardless of isToken)
-   Map tool aspect ratio lock no longer working
-   Modals will now change location when resizing the window would put them out of the visible screen area
-   Fix scroll bars being visible due to dice canvas not being sized strictly
-   Fix movement blockers intersecting with themselves when moving on the token layer
-   Fix assets becoming invisible when using a subpath setup (only applies to new assets)
-   Fix colour picker not allowing to change the rgba/hsla/hex values manually
-   Account removal not properly redirecting to login
-   Selecting a shape that was drawn in reveal mode no longer removes shadow during selection
-   Removing an asset would remove any campaign using it as their logo
-   Aura direction number input not synching change to server
-   Some memory leaks when changing locations
-   Floor lighting behaviour for late loading images
-   DDraft uploads not progressing in the asset manager
-   DDraft lights not properly being configured
-   [asset-manager] Asset manager would not check for stale files when removing a folder

### Performance

-   Cache Shape.points to prevent frequent recalculations

## [0.29.0] - 2021-10-28

### Added

-   Dice rolling tool
-   Pointer to the draw tool
-   Server Admin Commands
-   Polygon edit tool
    -   cut polygon in two / add extra node to polygon / remove node from polygon
    -   accessible when selecting a polygon with the select tool in BUILD mode

### Changed

-   Active tool-mode is now more distinct
-   Prevent setting visionMinRange > visionMaxRange using settings UI
-   Added number input to the aura angle direction UI
-   Variant-switcher re-enabled
-   SVG-walls handling
    -   stored metadata is different
        -   old method is still supported but will be deprecated in the future
        -   it is strongly advised to reapply your svg walls
    -   now takes basic transforms into account (i.e. scale && translate)

### Fixed

-   Locked shapes being able to move locations
-   Locked shapes being able to change floors
-   vision min range equal to max range bug
-   Angled auras not rotating with general shape rotation
-   Multiple styling issues in firefox
    -   Annotations no longer fill entire screen width
    -   Aura UI being way to wide
-   Viewport sync
    -   viewport is sent immediately upon connecting (and does not wait for the first pan)
    -   DM viewport move is now throttled and should no longer appear laggy on the client
-   Various DPI related fixes
-   Multiple experimental vision mode bugs
    -   Fix startup not working correctly
    -   Fix unsnapped move of blocking shape not updating movement triangulation
-   Toggle Composite shapes (variants)
    -   shared tracker/aura toggles now properly work
    -   changing location of a composite now moves all variants along
    -   Some non-shared auras could linger around when changing variant
-   Movement block not updating directly when not using snapping
-   Some performance dropoff for big polygons
-   Remove lingering rotation UI when removing a shape in build mode
-   Select tool showing ruler without selection
-   Text resize not live-syncing to other clients

## [0.28.0] - 2021-07-21

### Added

-   Configure background for floors (map layer)
    -   Can be configured on a campaign/location or individual floor level
    -   Can be set to "empty", "simple colour" or a repeated asset

### Changed

-   Draw helper now has a contrast border
-   Initiative can now be advanced by the active player
-   Toolbar mode is now more clearly shown
-   [tech] Moved from vue-cli to vite
    -   this greatly improves dev and build speed
    -   main dev script is now `npm run dev`

### Fixed

-   Subset of HTML no longer working in annotations
-   Various colour picker fixes
    -   Keep focus on saturation while mouse down
    -   Increase height sliders
    -   Fix hue slider click initially not moving
    -   Add back checkboard background
    -   Show cursor:pointer on slider hover
-   Draw tool cursor not immediately changing on colour change
-   Initiative reordering with unset values would throw error
-   Co-DMs can no longer strip DM status of the campaign creator
-   Co-DMs can no longer kick the campaign creator
-   Assets' block properties no longer working
-   Notes disappearing when changing locations

## [0.27.0] - 2021-06-02

### Added

-   HiDPI/retina support
    -   window.devicePixelRatio is now taken into account for rendering
    -   Can be disabled from ClientSettings->Display
-   Physical (mini) grid size
    -   Indicate grid size in function of mini dimensions and PPI
    -   Disables zoom tool when enabled
-   Ability to edit the text value for CircularTokens and Text objects from the property settings
-   [DM] Added ability to copy a location into another game session.
-   [DM] The asset menu bar in-game now automatically live updates when changes are done in the asset manager
-   [DM] Player viewport info
    -   Show a rectangle on the DM layer representing the player current viewport
    -   Moving this rectangle will live update the related player's view (only pan for now)
    -   Can be toggled on from the DM settings
-   [tech] API Server is now disabled by default and can be enabled through the server_config

### Changed

-   Initiative changes
    -   UI changes
        -   separate DM bar only visible to DM
        -   camera/vision lock settings are moved to client settings
        -   quick action to open client settings
        -   delete button removed, now a hover action instead
        -   more width for the initiative value
        -   initiative value no longer looks like a default input field
    -   Option to go back a turn
    -   Option to wipe all existing initiatives
    -   Option to change the sorting behaviour
    -   Blur effect to make it clear that initiative is not yet synced
    -   Enter can now be used to submit a new initiative value
-   Ctrl/Cmd clicking on an already selected shape will now deselect it instead
-   [DM] kicking a player now first prompts for confirmation
-   [tech] server_config variable `public_name` is now commented by default
-   [tech] removed dependencies from Dockefile, that were no longer needed
-   [tech] A big rewrite/refactor of the client has been done.

### Fixed

-   A bug related to floors and lighting on higher up floors not updating
-   Reordering floors being rendered wrong until a refresh
-   Redo not working on Mac
-   Tracker bars with negative values showing a bar going to the left
-   [DM] Co-DM not seeing private initiatives
-   [DM] Removing last floor giving a blank screen
-   [DM] Removing floors below the active floor giving a blank screen
-   [DM] Setting a value < 1 for unitSize was possible
-   [tech] Building docker image on ARM

## [0.26.1] - 2021-03-15

### Fixed

-   A couple of database errors related to completely new servers
-   Markers context menu not working correctly after change

## [0.26.0] - 2021-03-06

### Added

-   Client setting to disable zoom behaviour on scroll
-   Erase option to draw tool
    -   This makes anything from the current floor below it in the draw stack in its region transparent
-   Big red border when disconnected
-   Option to make other players (co-)DM
-   Show a small info popup when trying to join a locked session
-   Option to load wall info from an accompanying svg file
-   Support for dungeondraft dd2vtt files
    -   When placed on the board, a special 'apply ddraft' button is available in the extra settings to load the walls/portals/lights
-   Text shape to the draw tool
    -   When you click somewhere, a modal will appear to ask for the text
-   Code to set a public hostname to be used when updating the invitation url by reading from server_config.cfg
    "general -> public_name". If the public_name is empty or does not exists it falls back to normal operation.
-   Added code to planarally.py to display the warning about the template directory if not running in
    dev mode.
-   Added ability to put a cross through tokens to mark them as defeated using a toggle in the token properties or by selecting them and pressing 'x'

### Changed

-   Client settings
    -   Now open in a modal just like the DM settings
    -   Now can be campaign-specific (with reset/make default options)
-   Spell cone icon is now filled
-   Ctrl keybindings now use Cmd on mac
-   OpenSans font is now loaded from the server itself instead of google fonts
-   Ruler size is now always the same size on your screen irregardles of zoom
-   Ping size is now always the same size on your screen irregardles of zoom
-   Dashboard redesign (page after login)
    -   general UI overhaul
    -   option to set a logo for a session
    -   option to put personal notes
    -   shows last playtime for your account
    -   direct access to the asset manager
    -   (asset manager and settings will at a later time be integrated)
    -   Direct access to leave/delete campaigns
-   Loading animation is now dice related and 3d

### Fixed

-   It's no longer possible to create a floor with a name that is already in use
-   Token properly snaps to mouse when leaving wall
-   Template drops on non-default grid scales where not resized accordingly
-   Some cases where a disconnect would happen without reconnect attempts
-   Cause of slow session loading times
    -   shape group info is now sent along during initial load
-   Shapes with a variant always appearing to other players
-   Context menus going offscreen
-   Navigating backwards (by mouse or with browser controls) not working
-   Global initiative remove popup when deleting group shape

## [0.25.0] - 2021-02-07

### Added

-   Is public toggle for annotations
-   Undo/Redo (50 action memory)
    -   shape movement
    -   shape rotation
    -   shape resize
    -   floor change
    -   layer change
    -   shape creation/removal
-   New aura options
    -   enable/disable toggle
    -   border
    -   viewing angle (width + direction)
-   Location (un)archiving
-   Spell measuring system

### Fixed

-   Shape name not immediately syncing on visibility toggle
-   Vision tool disabled tokens private auras no longer being visible
-   Tokens giving minimal vision on other floors
-   Floor creation not triangulating
    -   This fixes newly created floors being broken in regards to vision until a refresh
-   Update location bar user position when moving shape

## [0.24.1] - 2021-01-17

### Fixed

-   minimal token vision being broken
-   pasting polygons would change the angle on the first segment

## [0.24.0] - 2021-01-10

Due to a bugfix with zoom for non-default gridsizes, you will likely encounter your first load on a map to be slightly off centered
from where you had your camera last time. This should normally not be far off from the original location.
If you have issues finding your stuff back try the space bar to center on your tokens or ctrl+0 to go to the world center.
If you still have issues contact me and I can give you some console code.

### Added

-   Pressing the Enter button on a single selection will open the edit dialog for that shape
-   Hexagon support (flat and pointy topped)
-   Navigate viewport with numpad, 5 will center viewport on origin; tokens can be moved (behaviour depending whether grid is square, flat-top-hex or pointy-topped-hex) with numpad
-   Remove button to initiative effects
-   Map tool now has a (un)lock aspect ratio system
-   Map tool can now skip selection to resize the entire map at once (both in terms of gridd cells and in terms of pixels)
-   Import/Export capabilities to the asset manager
-   Multiruler support
    -   Pressing space while in the ruler tool will start a new ruler from your lastpoint
-   Add multiruler option to select
    -   When moving shapes it's handy when you don't need to swap between tools

### Changed

-   Round counter now starts at 1 instead of 0
-   Create token modal now auto focuses no the input field
-   Create token modal now submits when pressing enter in the input field
-   Most tools now support the right click context menu on selected shapes without having to swap to select
    -   the two exceptions are draw and map tools
    -   filter and vision additionally allow a wider set of features from the select tool to be used
        -   only resize/rotate are not allowed at the moment
-   Use exact shape detection on shape select
    -   When performing a selection close to a non axis-aligned shape it will no longer select those as well
-   Do not toggle all tokens when deselecting the last one in the vision tool
-   Highlight the vision tool in a special colour to signal modified vision state at all times
-   When changing to a tool mode that the current tool does not support, change to the Select tool
-   Removed initiative and move to back/front from contextmenu for shapes that the player does not own
-   Reduce the length of the rotation line
-   Prevent usage of space to center during shape movement
-   Group logic has been greatly increased and now has a dedicated tab
    -   Options to change the alphabet used
    -   Options to randomize the badge assignment
    -   Options to merge/split/create/remove groups
-   [tech] Upgraded to socket.io v3
-   [tech] Improved group delete performance (especially for vision/movement blocking shapes)
-   [tech] Reduced number of calculations used for determining the minimal vision range for tokens

### Fixed

-   Locking shapes via keyboard shortcut did not sync to the server
-   Annotations from other floors being shown
-   Remember ruler visibility on tool change
-   `Ctrl 0` now centers viewport on origin (before, it would show origin on the top-left of the viewport)
-   Initiative effects becoming NaN for non-numeric inputs
-   New initiative effects not immediately synchronizing until a full client refresh
-   Shape name updates not syncing for public names to users that do not own the shape
-   Shape name updates not always updating on the initiative list
-   Moving shapes with default movement permissions not working
-   Various bugs with initiative permission updates
-   Negative values for Auras no longer causes drawing issues
-   Trackers not providing empty rows until re-opening dialog
-   Pasting shapes resulting in extra empty tracker rows
-   Rectangle resizing causing position shift
-   Location changes sometimes not going through for everyone
-   Resizing rotating shapes with snapping now correctly snaps to grid points
-   Dropped assets not immediately rendering
-   Shapes with a broken index value (used for move to back/move to front)
-   Area in the topcenter of the screen where the mouse could sometimes not be used
-   Auras that become public are not properly configured as a vision source on other clients
-   Selection of rotated rectangles and assets
-   Groupselection of rotated shapes
-   Double entries in the vision tool
-   Most assets automatically resizing to fit 1 grid cell
    -   they now retain their original size on drop (unless using templates)
-   Incorrect state in asset manager on reconnect
-   Sorting order in asset manager
-   Asset manager shift selection acting strange when mixing files and folders
-   More cases where the ruler and ping tool could get stuck
-   Tool dialogs now move correctly when changing mode
-   Edit dialog stays open when selecting another shape
-   Floor movement not recalculting vision/movement triangulation
-   Selection including shapes out of vision
-   Adding/Removing labels no longer being synced by the server
-   Current floor no longer being highlighted in context menu
-   Multiple issues when having a modified client gridsize
    -   auras/zoom/map would all use wrong math(s)
-   Teleporting to a spawn location, only changing location not setting the position
-   Synchronization of Label visibility
-   Initiative possibly not working when changing locations
-   [DM] Floor rename always setting a blank name

## [0.23.1] - 2020-10-25

### Fixed

-   Server socketio attaching on correct basepath
-   Client subpath working in docker context

## [0.23.0] - 2020-10-18

### Added

-   Traditional chinese localization added
-   Spawn location tweaks
    -   Multi spawn locations
        -   When moving a shape to a new location that has multiple spawn locations, a box will appear to choose the desired spawn zone
    -   Removal of spawn locations is now possible
-   Template system for assets
    -   Save shape state to its linked asset
    -   On asset drop, choose from the saved templates to prepopulate some fields
-   Snapping support to the ruler
    -   Snapping points are the grid corner points, center between two grid points and the complete center of a grid cell
-   Markdown support for shape annotations
-   Italian localization added
-   System notifications

    -   These are custom notifications server owners can send out and will appear in a toast
    -   By closing a notification you mark it as read and it will not show up any longer
    -   [tech] Server now also starts an extra admin api server that can be configured separately
    -   [tech] API endpoint to create system notifications now exists

-   [tech] Server can now be hosted on a subpath e.g. somedomain.com/planarally-subpath

### Changed

-   Shape edit dialog now uses a panel layout (similar to dm settings)
-   Annotation UI got a small change to better accomodate the new markdown support
-   Landing page redesign
    -   register phase is now a seperate step with an optional email field
-   [tech] During save upgrades, backups will now be stored in the saves_backup folder

### Fixed

-   Run docker container as non-root
-   Unlocking shape via quick menu no longer puts shape in drag mode
-   Map allowing some invalid inputs (negative numbers, 0, everything that isn't a number)
-   Note and annotation textareas not having the correct height initially
-   Console errors when attempting to move floors that you cannot access
-   Private shape names showing up as ? for users with access
-   [tech] Display error messages based on response body

## [0.22.3] - 2020-08-30

### Added

-   `rescale(factor)` webconsole function as a convenience method for DMs to rescale all their shapes
    -   a refresh of the page is most likely necessary for all normal functionality to update
    -   e.g. if you used to have a DM grid size setting that was 70px and want to retrofit your maps to the new baseline of 50, you can use `rescale(50/70);`

### Changed

-   Changed floor keybindings to use alt instead of ctrl, due to chrome and firefox not allowing these keybindings to be overriden
    -   As a reminder (similar for Page Down):
        -   Page Up - Move floor up
        -   Alt + Page Up - Move selected shapes floor up
        -   Alt + Shift + Page Up - Move selected shapes floor up AND move floor up

### Fixed

-   moving shapes to front/back not syncing on the server
    -   sadly I messed something up so you may have to fix the order of some shapes on some maps
-   When adding trackers or auras, duplicate entries could appear clientside until a refresh

# [0.22.2] - 2020-08-28

### Fixed

-   Drawing on FOW layer blocking UI
-   Badge toggle not working properly
-   Group leader not properly set serverside on paste
-   Server error on shape paste due to aura type change

## [0.22.1] - 2020-08-27

### Changed

-   Spawn locations are no longer magically created
    -   You can now (as a DM) explicitly create spawn tokens with the right click context menu
    -   You can already create multiple spawn locations, but UI to choose between them will be for the next proper release

### Fixed

-   Server error when encountering broken spawn locations

## [0.22.0] - 2020-08-26

### Added

-   localization updates
    -   Danish
    -   Spanish
    -   Chinese
-   Rotation in Select tool with build mode
-   Floor UI updates
    -   visibility toggle
        -   "Hidden" floors are not selectable by players, BUT will still render in between other selectable layers
    -   rename floor option
    -   reorder floors by dragging them
-   Shape lock/unlock toggle
    -   Show lock/unlock icon on the selection_info component for quick edit
    -   Only players with edit access can toggle

### Changed

-   Floors are now loaded separately on startup this greatly impacts startup time
    -   The floor the user was last active on is loaded first if possible
    -   Next all floors under the active floor in descending order are loaded
    -   Lastly the floors above in ascending order are loaded
-   Other performance improvements
    -   Delay drawloop start until first floor data arrives
    -   Better handling of multi group moves
    -   Shape movement now sends less data to server
    -   Pan now only updates the visible floors on move and full recalculate on release
-   Grid pixel size is now a client setting instead of a DM setting
-   Show floor selector in the more logical order from upper to lower floors
-   Improve ruler distance text readability

### Fixed

-   Aura not displaying when token is outside the visible canvas
-   Firefox location scrollbar when left menu is open
-   Some significant performance bottlenecks
-   Server now quits, referring to docs/tutorial, if client was not built before start
-   Initial state adding unnecessary fog on lower floors
-   Prefer snapped points over grid snapping
-   Remove white icon in topleft menu UI
-   Moving polygons with keyboard would only move origin point
-   Degenerate cases in triangulation
    -   Triangulation code could hit a degenerate case when dealing with slight number differences in the order of 1e-15
    -   Now the triangulation code will only take the first 10 digits after the dot into consideration to prevent numerical instability.
-   Mouseleave events where not triggered in some cases (e.g. alt tab), this could cause some shapes (e.g. rulers) to remain on the screen
-   Map tool resize does not replicate
-   Center calculation polygons with repeated points
-   Location moved shape now properly disappears on the old location
-   Asset drops on the game board that are not images located in /static are no longer accepted
    -   This fixes the possible spam of "could not load image /game/..." in your console for future cases
    -   A script has been added in the server/scripts folder to remove existing assets
-   Missing case in vision calculation script

## [0.21.0] - 2020-06-13

### Added

-   Shape invisible toggle
    -   Only players with vision access can see and interact with the shape
    -   Public auras are still visible to all players (e.g. invisible creature with a torch would still shed light)
-   Build/Play mode
    -   Show different set of tools dependening on the active mode
-   Movement access permission
-   Changelog modal if a new version comes out
-   Spawn locations
    -   Define where shapes you move to other locations are spawned
-   Public toggle to ruler tool
-   Shape locked toggle
    -   When locked, a shape cannot be moved/resized
    -   Locked shapes can only be selected if no non-locked shapes are included in the selection area
    -   Ctrl+l is a keybinding to toggle lock state of a selection group
-   Internationalization base
    -   English as default and fallback locale
    -   Chinese localization
    -   German localization (some terminology like "Asset" or "Tracker" still english, until appropriate German term found)
    -   Russian localization
    -   A dropdown selection component to switch languages in both login page and the Client Options of main menu

### Changed

-   During shape drag/move use a smaller version to do hitbox tests
    -   This improves behaviour when going through a very tight hallway or a door
-   Delayed initiative updating during edit
-   In Play mode (see #added) the select tool will no longer allow resizing
-   Creating a new floor will no longer automatically move everyone to that floor
-   The version shown in the topleft area in-game will now be limited to the latest release version
-   Basic tokens will now have their default name set to their label instead of 'Unknown shape'
-   Mobile device users are now unable to trigger overscroll refresh by simply moving around
-   Polygon points now also respect grid snapping as all other shapes do during draw

### Fixed

-   Polygon server creation with initial vertices list breaks session
-   Player floor location not being remembered
-   Ruler not showing decimal points
-   DM settings/grid unit size showing invalid input on firefox for floating point numbers
-   Server showing JSON decode errors
-   Players not being able to update initiative effects
-   Active layer sometimes resetting on reload
-   DMs no longer being able to kick themselves
-   Some UI components not properly updating on shape reset
-   Area right of layer selector preventing draw/select
-   Keyboard center throwing error when no tokens are defined
-   Multiple bugs with initiative syncing
-   Three bugs with location specific options not properly loading/saving
-   Scrollbar on bottom of page in firefox when location bar does not fit the screen
-   Players can no longer remove or add floors
-   Players can no longer move their shape to other layers/floors/locations themselves
-   Bug where a light source with 0/0 radii would block all lights of that shape

## [0.20.1] - 2020-05-11

### Fixed

-   Schema differences between new saves and older saves
-   Location removal failing on the server

## [0.20.0] - 2020-05-11

### Added

-   configuration option to specify allowed CORS origins
-   alt modifier can be used to disable draw/resize snapping
-   Client option to invert the ALT behaviour (i.e. invert snapping behaviour)
-   Logo, version info and some urls to the topleft section which is only visible if both locations bar and menu are opened
-   Search bar to asset menu
-   Some basic tooltips to icons
-   Tiered configuration. Configuration file in the data directory takes precedence over one in the folder with server files. Useful for docker deployments to keep the configuration in a volume
-   Use spacebar to cycle between your owned tokens
-   Aspect ratio lock with ctrl modifier
-   Progressbar to the asset manager
-   Location rename
-   Location removal
-   Upon floor change all players with edit access will auto move to the same floor
-   Set any shape as marker and jump to that position from the sidebar [LDeeJay1969]
-   Initiative token images now have their name shown on hover

### Changed

-   Shape access
    -   Now uses a dropdown prefilled with players so you no longer need to manually type it
    -   Option to choose full edit access or only vision access
    -   Default access to specify behaviour for non selected players
-   Map tool UX
    -   Now gives a bit more information on how to use it
    -   After making a selection you can adjust it to better fit your needs
    -   Choose the X/Y numbers after selecting the shape
    -   The center of the drawn resize rectangle now will remain in the exact same place after resize. This prevents sudden map jump.
-   Shape resizing
    -   Now only snaps the point you're resizing instead of an awkward complete shape resize
-   Location bar reworked
    -   Move around as a DM without bringing your players along
    -   shows which players are in which location
    -   now has UI to move groups of players as a whole or individually to other locations
-   Location settings
    -   DM options is now used to configure the default settings
    -   Locations have their own setting menu to override the defaults
-   Default brush size is now 1/10th of the grid size instead of the full grid size

### Fixed

-   Polygon width now properly taken into account when trying to select it
-   Floor/Layer bar now moves along with the side menu when opened
-   Side menu and locations menu no longer overlap
-   Window resizing messing with the lighting borders
-   Previous prompt values are now cleared before showing a new prompt
-   Asset manager not showing uploaded files until refreshed
-   Asset manager contextmenu not rendering correctly when scrolling down
-   Grid layers of al lower floors being visible
-   DM being able to invite themselves to the room as a player
-   Removing a file in the asset manager now deletes the file on the server
-   Draw tool no longer delays rendering brush helper after layer/floor change
-   Active floor is remembered upon rejoining the session

## [0.19.3] - 2020-04-01

### Fixed

-   Clientside access violations
    -   shape keyboard movement
    -   shape delete
    -   shape copy
    -   All of the above were only visible on the client issuing the 'illegal' inputs, they were always rejected by the server and thus not synced to other players

## [0.19.2] - 2020-03-22

### Added

-   Favicon

### Changed

-   Only show snap points visually for the DM
    -   This could otherwise expose hidden things to players.

### Fixed

-   Use grid toggle not working properly
-   Show badge toggle not always synchronizing
-   Moving shape to a different layer no longer leaves the old selection box around

## [0.19.1] - 2020-03-22

### Fixed

-   Keyboard movement not synchronizing

## [0.19.0] - 2020-03-19

### Added

-   Account Settings
    -   Set email address
    -   Change password
    -   Delete account
-   Snap to nearby existing points while drawing and while resizing points
-   CTRL-0 (zero) now resets the viewport to origin (0,0) [LDeeJay1969]
-   Floors
    -   Create/Delete floors that are rendered on top of eachother to increase immersion
    -   Use Page Up/Down as a quick keybinding to move between floors
    -   Use Ctrl + Page Up/Down to move shapes across floors (combine with Shift to immediately move the camera as well)
-   Touch Gestures [ZachMyers3]
-   Easier client traversing by removing \_load route [ZachMyers3]
-   Display current version on client [ZachMyers3]
-   Shape badges
    -   Toggleable badge display showing the shape's group number
-   Logo to the planarserver.exe
-   New experimental vision mode
    -   Recalculates vision based on small changes instead of recalculing the entire scene.

### Changed

-   When resizing on mouse up, a different method will be used to resize/snap the shape to the grid

### Fixed

-   Annotations stop working when changing location
-   Cursor resize icon not correct in multiselect
-   Movement of shapes not working 100% correctly
    -   In particular, moving a group of tokens now behaves correctly and doesn't suddenly jump around
-   Resize of rectangle shapes (and assets) working in all directions
-   Bug where shapes moved by players would remove auras/trackers from shapes for the DM

### Removed

-   [tech] Client build artifacts are no longer available in the server folder
-   Legacy bvh vision mode

## [0.18.2] - 2019-12-29

### Fixed

-   JS build files being out of date.

## [0.18.1] - 2019-12-05

### Fixed

-   Shapes not syncing on mouse move.

## [0.18.0] - 2019-11-09

### Added

-   Option to set custom units of length (defaults to ft)
-   Ping tool
-   Option to change the location of tokens/shapes
-   Option to edit shapes in groups (move to other layer, move to other location, move to top/bottom, add initiative)
-   Option to Ctrl-select tokens/shapes
-   Default right click menu to all tools that didnt have it
-   Colour in the location bar to show current location
-   Polygon tool options
    -   brush size (defaults to 1 grid cell in width)
    -   closed/open polygon toggle, when enable automatically connects first and last point.
-   Escape cancels draw tool actions

### Changed

-   Pasted shapes are now pasted relative to the screen position
-   Login page now autofocusses on the username input field.
-   All shapes on the FOW layer are now invisible while not on the FOW layer.
-   Circle borders (including basic tokens) are now inset, so that they fit within their squares.
-   Basic token text scaling has been changed slightly to have more uniformly sized characters.

-   [tech] Mousemove events are now throttled, so that they don't fire a gazillion events.
-   [tech] tslint swapped out for eslint
-   [tech] Refactor Layer.draw to use Shape.drawSelection
-   [tech] Refactor most uses of forEach to for..of

### Fixed

-   [DM] Session lock state not being shown correctly upon joining.
-   Sessions with a slash in their name do not work
-   Ruler width not being the same at all zoom levels.
-   Brushhelper sticking around on layer change.
-   Temporary shapes not being properly cleared on player disconnect.
-   Private shape auras, trackers, labels and name being revealed during movement.
-   Fix light auras clipping over walls.
-   Fix bug with circle draws using negative radii.
-   Polygon preview segment always showing up as black.

-   [tech] Improved docker image creation script
    -   Faster compilation and smaller final size
    -   Now the frontend is also compiled inside a container

## [0.17.1] - 2019-06-17

### Fixed

-   Issue with MIME-types of .js files being wrongly reported as text/plain.

## [0.17.0] - 2019-06-16

### Changed

-   The DM options menu is now a proper dialog.
    -   Options are sorted by catecory.
    -   A list of players with access to the session is shown with an option to kick them.
    -   A url is shown for the invite url so you no longer have to figure this out yourself.
    -   A button to refresh the invite url is now present.
    -   A button to remove the session is added.
    -   A button to (un)lock the session is added.

### Fixed

-   Shape updates often causing unnecessary lighting recalculations.

## [0.16.0] - 2019-05-19

### Added

-   Option to listen on a socket instead of HOST:PORT.
-   Vision tool to change active tokens.
-   Vision lock button to initiative to only show vision of current actor.
    -   This only applies to tokens the player owns for other tokens the normal vision is restored.
    -   This is purely client side and can thus be chosen by player/DM separately.
-   Camera lock button to initiative to automatically center on current actor.
    -   It will center when an actor begins its turn and the client is owner of that actor.
    -   It does not prevent camera movement after the initial center action.
-   Automatic build of windows executables on azure pipelines for all tags
    -   These will also create a github release automatically
-   Fake player button to DM Settings to disable all DM functions except DM settings.
    -   You can control which player(s) you want to emulate with the vision tool.

### Changed

-   Filter tool is only visible if there are labels defined.

### Fixed

-   Fix a bug causing labels without category to throw errors.
-   CSS bug with menu.
-   Bug making it impossible to remove trackers/auras.
-   Windows build being completely broken.

## [0.15.1] - 2019-05-15

### Fixed

-   Upgrade from save format 12 to 13 failing in some cases.

## [0.15.0] - 2019-04-14

### Added

-   Keybinding to toggle UI (ctrl+u).
-   Keybinding to copy selection to clipboard (ctrl+c).
-   Keybinding to paste clipboard to board (ctrl+v).
-   Labeling system.
    -   You can add labels to shapes.
    -   You can filter the gameboard on these labels.

### Changed

-   Asset preview now disappears when starting a drag asset action.
-   A mouse down in general will now trigger layer or tool selection.
    -   In the past a 'click' was required, now any 'mousedown' will trigger.
-   Zoom scale has been modified.
-   Select tool can now also select shapes not owned by the player.
    -   The selection info box is shown with all info visible for the user.
    -   The tokens cannot be dragged or resized.
    -   Groupselect will only select your own tokens.
-   Some minor style changes to the edit asset dialog
-   Shape names can now be hidden from other users.
-   Default vision mode changed to triangle mode. Legacy vision mode (bvh) can still be selected in the DM options.

### Fixed

-   Bug causing rulers to stick on DM screen.
-   Bug causing rulers to not appear on other screens.
-   Drag and drop asset on firefox redirecting to random urls.
-   Some eventlisteners not being removed properly.
    -   This caused zoom behaviour to mess up when leaving and joining a room multiple times.
-   Bug causing players not being able to add or update initiative effects.
-   Bug causing shown initiative effect to be one lower than it actually is on location load.
-   Move layer to/from DM layer having broken results for players untill a refresh of the page.
-   Bug causing some windows (e.g. initiatives) to no longer appear.
-   Vision bugs at different zoom levels caused by the world boundary being too large.
    -   Reduced boundary location from 1e10 to 1e8.
-   Bug causing the vision recalculation not happening in a lot of cases.

### Removed

-   Some old css files.

### [0.14.2] - 2019-01-29

### Fixed

-   Registered users had to logout and login again before being able to perform actions.
-   [tech] Javascript files being wrongly served as plaintext in some obscure cases.

## [0.14.1] - 2019-01-28

### Fixed

-   A lot of things breaking due to a bug in shape ownership.

## [0.14.0] - 2019-01-27

### Added

-   Polygon shape in the draw tool.
    -   This is especially nice in combination with the new experimental vision mode!
-   [DM] Options to set the minimal and maximal vision ranges when using LOS.
    -   A radial gradient is applied starting from the minimal range and stopping at the maximal range.
    -   This effectively allows you to play with how far tokens can see.
-   Autocomplete hints to the login form.
-   Edit shape dialog now has options to change the border and fill colour.
-   Shape properties can now also be opened from the contextmenu (i.e. right click on a shape).

### Changed

-   Wait with recalculating vision until all shapes are added on startup.
-   Vision mode toggle has been moved to the DM options and is now synced with the server.

### Fixed

-   Fix visionmode menu toggle not remembering what is currently selected.
-   SelectionHelper mistakenly geting send to the server.
-   SelectionHelper sometimes getting moved to a different layer instead of the actual shape.
-   Some small QOL changes to multiline.
-   Logout routing.
-   Active location not being remembered by server.
-   Notes not getting cleared on location change.
-   AssetManager shift selection causing double selections.
-   AssetManager issues with (re)moving files.
-   Player location not saving properly.
-   Prevent duplicate owner entries for a shape.

## [0.13.3] - 2019-01-19

### Fixed

-   Multiple bugs with triangle vision

## [0.13.2] - 2019-01-13

### Fixed

-   Static images were accidently no longer checked into the repository.
-   DM layer was not being sent by the server.

## [0.13.0] - 2019-01-13

### Added

-   A new vision system has been added based on triangulation.
    -   You can select this new system as a client option
    -   It is more precise (i.e. exact) than the previous vision system which was a good approximation.
    -   It can handle any polygon under any angle, so expect some new draw tools in the future!
    -   It is slightly more expensive to preprocess, but this should be relatively unnoticeable.

### Fixed

-   Draw tool mouseUp behaviour had some strange quirks that are now ironed uit.
    -   In particular this prevented some shapes of being synced correctly.

## 0.12.0

### Added

-   Added curl to docker container for proper health check
-   Remember which layer was selected last time [Issue 109]

### Changed

-   [tech] Shape index unique constraint dropped to simplify some code
-   [tech] Massive overhaul of the code organization
-   [tech] Moved from manual webpack config to vue-cli
-   [tech] Moved to a single page application with vue-router

## Fixed

-   Backspace key added as delete action (Fixes Mac OS X delete behaviour) [Issue 69]
-   Added host config option to docker config file
-   Moving shapes to another layer would not always succeed at the server [Issue 108]

## 0.11.6

A collection of small improvements and fixes.

### Added

-   host option in server_config.cfg [Issue 99]

### Changed

-   GridLayer.size from IntegerField to FloatField [Issue 105]
-   Location.unit_size from IntegerField to FloatField [Issue 105]

### Fixed

-   Tokens appear as black/red with all lighting settings disabled [Issues 90/91]
-   Trackers and Auras were not saved server side. [Issue 106]

## 0.11.5

Hotfixes for 0.10.0

### Fixed

-   Drag and Drop file uploading fixed
-   New location creation fixed

## 0.11.4

More hotfixes for 0.10.0

### Fixed

-   Asset uploading

## 0.11.3

Another hotfix for 0.10.0.

### Fixed

-   Actually fix the user creation bug for once.

## 0.11.2

Another hotfix for 0.10.0.

### Fixed

-   Made a woopsie while fixing the earlier user creation error.

## 0.11.1

This version contains hotfixes for the 0.10.0 release

### Fixed

-   Save file was not generated at the right time causing errors when no save file exists during startup
-   User creation was broken

## 0.11.0

**IMPORTANT: READ THIS FIRST**

This version is part 2 of a 2 part upgrade process of the save file.
A completely new and different save format is going to be used in the future
and this requires a drastic change once, _(which is now)_

If you are about to install/use this release you either have completed part 1 (release 0.10.0) or you are starting from a new save file.
**END IMPORTANT**

### Changed

-   [tech] Save file format is changed to sqlite!

### Fixed

-   Shape grid snapping not getting synced on draw
-   Select tool no longer selected by default on load
-   Add new location action messed up websocket rooms
-   CircularTokens created by non-DM users now properly set owner

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

-   Option to choose save file location [contributed by Schemen]
    -   The server config now has an option to specify a different save file name and/or location.
-   Dockerfile [contributed by Schemen]
    -   A dockerfile is now present to support deployment in docker containers
-   VERSION file in the python folder
    -   This will be used in the future to detect software updates

### Fixed

-   Unable to drag modal dialogs in Firefox
-   Unable to drag assets in Asset Manager in Firefox
-   Empty asset and note list was to small for icons
-   Tools started with lowercase
-   Radial menu buttons had border when clicking them

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

-   Added a note system
-   Initiative tracker update
    -   Now shows the active actor and has a next turn button
    -   Shows the current round number
    -   Turn/Effect timers per actor that automatically count down
    -   Show a border around shapes on hover in the initiative list
-   New Asset management panel
    -   Out of game way to organize assets
    -   Upload files via a dialog or by dropping them on the manager
    -   Rename/remove files/directories
    -   move files/folders to other folders
-   Freestyle brush has been added as a draw shape
    -   FOW usage is limited
        -   Currently only works when global fog is applied.
        -   Works when used from the draw tool in reveal/hide mode
        -   Does not properly work in normal mode on the fow layer!
        -   In general: Use it to draw on non-fog layers or use it in reveal/hide mode
-   [tech] tools onSelect and onDeselect for more finegrained tweaking and UI helpers
-   Option for players to select the colour of their rulers.

### Changed

-   Renamed 'Tokens' to 'Assets' in the settings panel
-   Redesigned the way assets are shown in the settings panel
    -   A tree view approach is used, showing preview images on hover
    -   Removed the cog wheel
    -   A button to open the asset manager is added to the in-game interface.
-   Draw and fow tools have been combined in one singular draw tool
    -   Options between 'normal' mode and either 'hide' or 'reveal' mode if you want to draw fog
    -   Fog is now always drawn in the client's active fog colour
    -   Also shows a brush tip while moving the mouse
-   Dim aura range should no longer include the normal range value
    -   e.g. an aura that used to be 20/60 should now be 20/40
-   [tech] Most UI is now rendered using the reactive Vue.js framework instead of JQuery
-   Draw order changed
    -   First all auras are drawn and then all shapes are drawn
    -   This prevents auras overlapping shapes
    -   Shape order is still respected

### Fixed

-   Select box not working properly on the fow layer
-   Ownership changes are now reflected in the initiative list
-   Dim value aura's had the wrong radius
-   Dim value aura's nog properly work with light sources.
    -   Instead of halving the opacity, the radial gradient is applied across the entire aura + dim aura radius.
-   Deleting multiple shapes no longer sends the selectionhelper to the server

## [0.8] - 2018-06-19

This release greatly increases performance of all lighting modes and also properly
introduces Line of Sight based lighting system.

SAVE_FORMAT CHANGED FROM 0 to 1
BACKUP YOUR OLD SAVE BEFORE CONVERTING!
UPDATE YOUR SAVE BY EXECUTING `python ../scripts/convert/0_to_1.py` FROM WITHIN THE `PlanarAlly` FOLDER THAT CONTAINS YOUR SAVE FILE, THE SERVER CONFIG AND THE OTHER PYTHON FILES!!!

### Added

-   Show initiative action is added to the general context menu
-   [tech] A Bounding Volume Hierarchy ray tracing accelerator is used.
    -   This greatly! improves the performance of all lighting including the experimental LoS based lighting.
-   [tech] multiple debugging flags under Settings.
-   [tech] extra layer added that is used for fow. Now two layers are responsible for this.

### Changed

-   Right clicking will now only show a shape specific menu if it was done on a selection
    -   All other right clicks will show the general purpose context menu
-   Light auras now properly follow the actual path formed by vision obstruction objects
-   FOW layer drawn shapes now retain their proper colour used during drawing.
-   Movement that is normally grid-snapping will go out off grid if it stops against a movement blocker
-   [tech] Cleaned up the Vector class, splitting it up in a Vector and a Ray class
    -   Vector: purely direction indication
    -   Ray: combination of an origin point and a vector
-   [tech] A much more performant ray box intersection algorithm is used

### Fixed

-   Shapes no longer get stuck in movementblockers on occassions
-   Auras were ignored in the visibility check during layer shape draw

### Reverted

-   assets dropped on canvas are no longer tagged as token
    -   Tokens should only be used for actual player representatives

## [0.7] - 2018-06-12

### Added

-   Rough background to the annotation field to make it more readable

### Fixed

-   Annotations correctly position centered on the screen
-   Annotations correctly wrap words to the next line
-   Delete key no longer removes shapes while in input fields.
-   Scrolling only zooms when a canvas is targetted.
-   Exit button now correctly positioned when token list is large

## [0.6] - 2018-06-11

### HOTFIXED

-   shapes moved with arrow keys were not being synced to the server
-   assets dropped on canvas are immediately tagged as token

### Added

-   [DM] Using the shift key, shapes can move freely through movement blocking terrain.
-   Pressing 'd' now deselects everything

### Changed

-   Arrow moves will move assets when they are selected instead of the canvas.
    -   The canvas will still be moved if no shape is selected
    -   [DM] Shift key can also be used to pass through terrain.
-   Shape drawing now uses same behaviour in regards to grid snapping
    -   by default shapes will resize to fit the grid
    -   when alt is pressed on mouseUp during drawing or if the grid is disabled, the shape will not resize to grid.
-   Only tokens will have a minimal vision aura
-   Add DM settings option to enable Line of Sight based lighting
-   Disable LoS based lighting by default

### Fixed

-   Deleting a selection of assets should now behave correctly. (Sometimes not all assets would be deleted)

## [0.5] - 2018-06-03

### Added

-   Added an exit button in-game
    -   This will now bring you back to your sessions
    -   Also added a new logout button to the sessions menu
-   Add token toggle to shape settings
-   Line of sight based light for tokens
    -   Only see lights that fall in your line of sight

### Changed

-   Improved the visuals of the toolbar and layer manager
-   Multiple large light/shadow related performance improvements for firefox
    -   Chromium based browsers had slight improvements but already were (ans still are) much more performant in regards to FOW calculation
-   Shapes that do not have an associated image, now show their name or token tag in the initiative dialog

### Fixed

-   The dim value attribute of auras was wrongly used as the normal aura value
-   The grid is now redrawn at the same time as the other layers instead of immediately
-   The light source toggle on shapes now immediately redraws the screen
-   Map tool properly works in all directions again
-   Sessions with spaces not working
-   Assets with ' not appearing correctly in the token list

## [0.4] - 2018-05-04

The great bugfix release

### Added

-   Bring players here function in the rightclick menu when nothing is selected
    -   This will bring over all players to the exact same pan and zoom settings as the DM
    -   Only the DM can access this

### Fixed

-   Grid size DM UI works again. It broke in 0.3
-   Cutoff zoom at 0.01 instead of 0, as zoom factors of 1e-16 caused issues with pages crashing
-   Adding a new location did not correctly send some options to the client
-   The annotation field in the edit asset dialog now prevents key presses to propagate to the board (e.g. no longer deleting shapes because you pressed delete in the textfield)
-   The selection box now is smaller for very small assets
-   Slowdown on the opening of the edit asset dialog throughout gameplay has been fixed.
-   Location options not synced immediately
-   Quick tracker/aura edits now work again

## [0.3] - 2018-04-19

### Added

-   Shape selection option is added to the draw tool, currently giving the option between a rectangle and a circle.
-   More camera options
    -   Use the arrow keys to move 1 grid unit in the pressed direction
    -   Use the scroll wheel to zoom in and out
    -   Press the middle mouse button to pan without using the dedicated pan tool
-   Quickly create simple circular text tokens
    -   right click anywhere that is not an active selection and select the 'create basic token' option
    -   You can insert any text and choose the fill and border colours
    -   Although singular letters or numbers work great, any text will be scaled to fit inside the circle, so longer texts can also work.

### Changed

-   Line width of shape borders increased to 5

### Fixed

-   Various initiative issues with locations

## [0.2] - 2018-04-11

This update is firstmost an update in regards to the development process so little to no new feautures are added in this release.
A couple of important bugfixes are included though.

### Added

-   A save file version is added to the save to possibly convert older saves in the future.
-   A barebones annotation system for shapes
    -   You can add text to any asset using the edit asset dialog
    -   Whenever you mouse-over a shape you own the text will appear at top of the screen
    -   This is mostly a DM tool but players can use it as well.

### Fixed

-   Websocket protocol now correctly chosen at the client side, this caused players to just see a blank scene in some situations
-   Players on a different IP as the dm now actually see images.
-   Pan and zoom options are now remembered per user AND location instead of only per user.
-   MovementObstruction and visionObstruction were not immediately synced on toggle.
-   Groupselect now behaves more predictable when one member collides with a movement blocker

### Changed

-   Move from 1 large javascript file to a proper multi file typescript system
-   When dragging an asset against a movement blocker, it will smoothly slide across the blocker instead of completely locking up.

## [0.1] - 2018-03-22

### Added

-   Initiative tracker
    -   Right click on any asset and add it to the tracker.
    -   Options to hide initiative of certain assets
    -   The initiative of an asset will be removed on delete
        -   this can be disabled with the 'group' flag. This is very handy for minions with the same initiative.
-   Every 5 minutes a save will be written to disk as an extra persistent layer.
    -   saves already happend on other occasions.

### Fixed

-   The delete key no longer removes selected assets if used in an input field!

## [0.0] - First public mention
