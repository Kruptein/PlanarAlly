## Unreleased

### Added
- `access` option on DataBlock creation and `DataBlock.access` / `DataBlock.setAccess` to control which users can read and write a DataBlock
- `provideApi` and `getModApi` to share functionality and data between mods

### Changed
- `modOptions` returns Vite's `UserConfig`, so the `as UserConfig` cast in mod configs is no longer needed (`vite` is now an optional peer dependency)

### Fixed
- Mod dev servers use the host's Vue instead of a Vue URL baked into the mod-api release, which broke HMR when the versions differed

## [0.6.0]

### Added
- `dice.roll` to roll dice as the current player without opening the dice tool
- `dice.prefill` to open the dice tool with an expression filled in

## [0.5.0]

### Added
- Custom data apis
- Dice simplification apis

### [0.4.0]

### Added
- Vite config export to handle HMR and dev mode smoother

### [0.3.0]

### Added
- Optional DM settings UI component
- Expose Modal UI component on api

## [0.2.0]

### Added
- Compendium functionality

## [0.1.1]

### Fixed
- Tracker system state types

### Removed
- legacy preTrackerUpdate root event

## [0.1.0]

Initial mod API release