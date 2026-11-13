import type { DeepReadonly, Reactive } from "vue";

import type {
  ApiShapeCustomData,
  CharacterId,
  CompendiumIndexedEntry,
  CompendiumRecord,
  GlobalId,
  LocalId,
  ModShape,
  NumberId,
  StringId,
  Sync,
  Tracker,
  TrackerId,
  UiShapeCustomData,
  UiTracker,
} from "./index";

export type PlayerId = NumberId<"playerId">;
export type ClientId = StringId<"clientId">;
export type FloorId = NumberId<"floorId">;
export type FloorIndex = NumberId<"floorIndex">;
export type AuraId = StringId<"auraId">;
export type NoteId = StringId<"NoteId">;
export type AssetId = NumberId<"assetId">;
export type AssetEntryId = NumberId<"assetEntryId">;
export type ElementId = NumberId<"ElementId">;

export interface Point {
  x: number;
  y: number;
}
export type GlobalPoint = Point & { __brand: "GlobalPoint" };

// Enum values as used by the host

export const Role = { Player: 0, DM: 1, Spectator: 2 } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const VisionBlock = { No: 0, Complete: 1, Behind: 2 } as const;
export type VisionBlock = (typeof VisionBlock)[keyof typeof VisionBlock];

export const FloorType = { Underground: 0, Ground: 1, Air: 2 } as const;
export type FloorType = (typeof FloorType)[keyof typeof FloorType];

export const LayerName = {
  Map: "map",
  Grid: "grid",
  Tokens: "tokens",
  Dm: "dm",
  Lighting: "fow",
  Vision: "fow-players",
  Draw: "draw",
} as const;
export type LayerName = (typeof LayerName)[keyof typeof LayerName];

export const GridType = { Square: "SQUARE", PointyHex: "POINTY_HEX", FlatHex: "FLAT_HEX" } as const;
export type GridType = (typeof GridType)[keyof typeof GridType];

// Whether a player can use a door or teleport zone
export const LogicAccess = { Enabled: 0, Request: 1, Disabled: 2 } as const;
export type LogicAccess = (typeof LogicAccess)[keyof typeof LogicAccess];

// State

interface ReactiveState<T extends object> {
  reactive: DeepReadonly<T>;
  mutableReactive: T;
}

interface NonReactiveState<U> {
  readonly: DeepReadonly<U>;
  mutable: U;
}

// Access

export type AccessLevel = "edit" | "movement" | "vision";
export type AccessConfig = Record<AccessLevel, boolean>;

interface AccessSystem {
  // Access every user has to the shape
  getDefault(shape: LocalId): DeepReadonly<AccessConfig>;
  // DMs always have access, unless `limitToActiveTokens` is set.
  // With multiple levels, all of them are required.
  hasAccessTo(
    shape: LocalId,
    access: AccessLevel | AccessLevel[],
    limitToActiveTokens?: boolean,
  ): boolean;
  getAccess(shape: LocalId, user: string): DeepReadonly<AccessConfig> | undefined;
  addAccess(shape: LocalId, user: string, access: Partial<AccessConfig>, syncTo: Sync): void;
  updateAccess(shape: LocalId, user: string, access: Partial<AccessConfig>, syncTo: Sync): void;
  removeAccess(shape: LocalId, user: string, syncTo: Sync): void;
  // Users with explicit access to the shape
  getOwners(shape: LocalId): Iterable<string>;
}

// Assets

export interface ApiAssetCore {
  id: AssetId;
  fileHash: string;
  kind: string;
  hasTemplates: boolean;
  hasExtraData: boolean;
}

export interface ApiAssetEntry {
  id: AssetEntryId;
  name: string;
  owner: string;
  children: ApiAssetEntry[] | null;
  shares: { user: string; right: "view" | "edit" }[];
  asset: ApiAssetCore | null;
}

interface AssetSystem {
  getAssetInfo(id: AssetId): Promise<ApiAssetCore | undefined>;
}

interface AssetGameSystem {
  addShortcut(id: AssetEntryId): void;
  removeShortcut(id: AssetEntryId): void;
}

// Auras

export interface Aura {
  uuid: AuraId;
  active: boolean;
  visionSource: boolean;
  visible: boolean;
  name: string;
  value: number;
  dim: number;
  colour: string;
  borderColour: string;
  angle: number;
  direction: number;
  floodLight: boolean;
}

export type UiAura = { shape: LocalId; temporary: boolean } & Aura;

interface AuraSystem {
  // The auras of the shape currently open in the shape settings
  state: DeepReadonly<{ id: LocalId | undefined; auras: UiAura[] }>;
  get(shape: LocalId, auraId: AuraId): DeepReadonly<Aura> | undefined;
  getAll(shape: LocalId): DeepReadonly<Aura[]>;
  add(shape: LocalId, aura: Aura, syncTo: Sync): void;
  update(shape: LocalId, auraId: AuraId, delta: Partial<Aura>, syncTo: Sync): void;
  remove(shape: LocalId, auraId: AuraId, syncTo: Sync): void;
}

// Characters

export interface ApiCharacter {
  id: CharacterId;
  shapeId: GlobalId;
}

interface CharacterSystem {
  getAllCharacters(): IterableIterator<DeepReadonly<ApiCharacter>>;
  getShape(characterId: CharacterId): ModShape | undefined;
  getShapeId(characterId: CharacterId): GlobalId | undefined;
}

// Chat

export interface ChatMessage {
  id: string;
  author: string;
  // Rendered html
  content: string;
}

interface ChatSystem {
  // `id` should be unique (e.g. a uuid), `data` is markdown
  addMessage(id: string, author: string, data: string[], sync: boolean): void;
}

// Clients (a player can be connected with multiple clients)

export interface Viewport {
  height: number;
  width: number;
  zoom_factor: number;
  offset_x?: number;
  offset_y?: number;
}

interface ClientSystem {
  getClients(player: PlayerId): Iterable<ClientId>;
  getPlayer(client: ClientId): PlayerId | undefined;
  // Defaults to the own client
  getViewport(client?: ClientId): Viewport | undefined;
  // Center of the client's viewport
  getClientLocation(client: ClientId): GlobalPoint | undefined;
}

// Compendium

interface CompendiumSystem {
  // Opens or closes the compendium
  toggle(): void;
  close(): void;
  openRuleAt(ref: string, x: number, y: number): void;
  closeRule(): void;
  getEntry(ref: string): CompendiumIndexedEntry | undefined;
  getEntries<T = unknown>(system: string, kind: string): CompendiumRecord<T>[];
  listEntries(): CompendiumIndexedEntry[];
  searchEntries(query: string): CompendiumIndexedEntry[];
}

// Custom data

interface CustomDataSystem {
  addElement(element: ApiShapeCustomData, sync: boolean): void;
  updateValue(
    shape: LocalId,
    elementId: ElementId,
    value: ApiShapeCustomData["value"],
    sync: boolean,
  ): void;
  removeElement(shape: LocalId, elementId: ElementId, sync: boolean): void;
  loadAndDropState(ids: ReadonlySet<LocalId>, source: string | symbol): void;
}

// Floors

export interface Floor {
  id: FloorId;
  name: string;
  playerVisible: boolean;
  type: FloorType;
  backgroundValue?: string;
}

export type FloorRepresentation = { name: string } | { id: number } | { position: number };

interface FloorSystem {
  getFloor(floor: FloorRepresentation): DeepReadonly<Floor> | undefined;
  getFloorIndex(floor: FloorRepresentation): FloorIndex | undefined;
  selectFloor(floor: FloorRepresentation, sync: boolean): void;
  selectLayer(name: LayerName, sync?: boolean): void;
}

// Game

interface GameSystem {
  // DM only, prevents players from interacting with the board
  setIsLocked(isLocked: boolean, sync: boolean): void;
}

// Groups

export interface Group {
  uuid: string;
  characterSet: string[];
  creationOrder: "incrementing" | "random";
}

interface GroupSystem {
  hasGroup(groupId: string): boolean;
  getGroupId(shape: LocalId): string | undefined;
  getGroupSize(groupId: string): number;
  getGroupMembers(groupId: string): ReadonlySet<LocalId>;
  createNewGroupForShapes(shapes: LocalId[], keepBadges?: boolean): void;
  addGroupMembers(groupId: string, members: { id: LocalId; badge?: number }[], sync: boolean): void;
  removeGroupMember(member: LocalId, sync: boolean): void;
  getBadge(shape: LocalId): number;
  // The badge as shown on the shape, according to the group's character set
  getBadgeCharacters(shape: LocalId): string;
}

// Doors and teleport zones

// Player names, "default" applies to every player
export interface LogicPermissions {
  enabled: string[];
  request: string[];
  disabled: string[];
}

interface DoorSystem {
  isDoor(shape: LocalId): boolean;
  getDoors(): Readonly<IterableIterator<LocalId>>;
  // Enables or disables the door behaviour of the shape
  toggle(shape: LocalId, enabled: boolean, syncTo: Sync): void;
  // Opens or closes the door
  toggleDoor(shape: LocalId): void;
  canUse(shape: LocalId, player: PlayerId): LogicAccess;
  getPermissions(shape: LocalId): DeepReadonly<LogicPermissions> | undefined;
  setPermissions(shape: LocalId, permissions: LogicPermissions, syncTo: Sync): void;
  setToggleMode(shape: LocalId, mode: "movement" | "vision" | "both", syncTo: Sync): void;
}

interface TeleportZoneSystem {
  isTeleportZone(shape: LocalId): boolean;
  toggle(shape: LocalId, enabled: boolean, syncTo: Sync): void;
  toggleImmediate(shape: LocalId, immediate: boolean, syncTo: Sync): void;
  getPermissions(shape: LocalId): LogicPermissions | undefined;
  setPermissions(shape: LocalId, permissions: LogicPermissions, syncTo: Sync): void;
}

// Markers

interface MarkerSystem {
  newMarker(shape: LocalId, sync: boolean): void;
  jumpToMarker(shape: LocalId): void;
  removeMarker(shape: LocalId, sync: boolean): void;
}

// Notes

export interface NoteRoom {
  roomCreator: string;
  roomName: string;
  locationId: number | null;
  locationName: string | null;
}

export interface NoteAccess {
  name: string;
  can_edit: boolean;
  can_view: boolean;
}

export interface ClientNote {
  uuid: NoteId;
  creator: string;
  title: string;
  text: string;
  tags: { name: string; colour: string }[];
  showOnHover: boolean;
  showIconOnShape: boolean;
  rooms: NoteRoom[];
  access: NoteAccess[];
  shapes: LocalId[];
}

interface NoteSystem {
  setTitle(noteId: NoteId, title: string, sync: boolean): void;
  // `syncAfterDelay` debounces the server sync, e.g. while typing
  setText(noteId: NoteId, text: string, sync: boolean, syncAfterDelay?: boolean): void;
  attachShape(noteId: NoteId, shape: LocalId, sync: boolean): void;
  removeShape(noteId: NoteId, shape: LocalId, sync: boolean): void;
  addTag(noteId: NoteId, tag: string, sync: boolean): Promise<void>;
  removeTag(noteId: NoteId, tag: string, sync: boolean): void;
  addAccess(
    noteId: NoteId,
    user: string,
    access: { can_view: boolean; can_edit: boolean },
    sync: boolean,
  ): void;
  setAccess(
    noteId: NoteId,
    user: string,
    access: { can_view: boolean; can_edit: boolean },
    sync: boolean,
  ): void;
  removeAccess(noteId: NoteId, user: string, sync: boolean): void;
  setShowOnHover(noteId: NoteId, showOnHover: boolean, sync: boolean): void;
  setShowIconOnShape(noteId: NoteId, showIconOnShape: boolean, sync: boolean): void;
  removeNote(noteId: NoteId, sync: boolean): void;
}

// Players

export interface PlayerInfo {
  id: PlayerId;
  name: string;
  location: number;
  role: Role;
}

interface PlayerSystem {
  getPlayer(player: PlayerId): PlayerInfo | undefined;
  getCurrentPlayer(): PlayerInfo | undefined;
  getCurrentPlayerId(): PlayerId | undefined;
}

// Position

interface PositionSystem {
  get screenTopLeft(): GlobalPoint;
  get screenCenter(): GlobalPoint;
}

// Properties

export interface ShapeProperties {
  name: string;
  nameVisible: boolean;
  isInvisible: boolean;
  strokeColour: string[];
  fillColour: string;
  blocksMovement: boolean;
  blocksVision: VisionBlock;
  showBadge: boolean;
  isDefeated: boolean;
  isLocked: boolean;
  // If x and y are 0, the size is inferred
  size: { x: number; y: number };
  showCells: boolean;
  cellFillColour?: string;
  cellStrokeColour?: string;
  cellStrokeWidth?: number;
  oddHexOrientation: boolean;
}

interface PropertiesSystem {
  // Leases the shape's properties into the reactive state until `dropState` is called with the same source
  loadState(shape: LocalId, source: string): void;
  dropState(shape: LocalId, source: string): void;
  setName(shape: LocalId, name: string, syncTo: Sync): void;
  setNameVisible(shape: LocalId, visible: boolean, syncTo: Sync): void;
  setIsInvisible(shape: LocalId, isInvisible: boolean, syncTo: Sync): void;
  setStrokeColour(shape: LocalId, strokeColour: string, syncTo: Sync): void;
  setFillColour(shape: LocalId, fillColour: string, syncTo: Sync): void;
  setBlocksMovement(shape: LocalId, blocksMovement: boolean, syncTo: Sync): boolean;
  setBlocksVision(shape: LocalId, blocksVision: VisionBlock, syncTo: Sync): void;
  setShowBadge(shape: LocalId, showBadge: boolean, syncTo: Sync): void;
  setIsDefeated(shape: LocalId, isDefeated: boolean, syncTo: Sync): void;
  setSize(shape: LocalId, size: { x: number; y: number }, syncTo: Sync): void;
  setShowCells(shape: LocalId, showCells: boolean, syncTo: Sync): void;
  setCellStrokeColour(shape: LocalId, strokeColour: string, syncTo: Sync): void;
  setCellFillColour(shape: LocalId, fillColour: string, syncTo: Sync): void;
  setCellStrokeWidth(shape: LocalId, strokeWidth: number, syncTo: Sync): void;
  setOddHexOrientation(shape: LocalId, oddHexOrientation: boolean, syncTo: Sync): void;
  setLocked(shape: LocalId, isLocked: boolean, syncTo: Sync): void;
}

// Room

interface RoomSystem {
  setChat(enabled: boolean, sync: boolean): void;
  setDice(enabled: boolean, sync: boolean): void;
}

// Selection

interface SelectedSystem {
  // Makes the shape the focus of the selection, used by e.g. the dice tool and mod tabs
  focus(shape: LocalId): void;
  push(...shapes: LocalId[]): void;
  set(...shapes: LocalId[]): void;
  remove(shape: LocalId): void;
  get hasSelection(): boolean;
}

// Settings

// A location setting, `value` is the value for the active location
export interface WithLocationDefault<T> {
  default: T;
  value: T;
  location: Record<number, T | undefined>;
}

// A player setting, `override` is the room specific value
export interface WithDefault<T> {
  default: T;
  override?: T;
  value: T;
}

export interface LocationOptions {
  useGrid: boolean;
  gridType: GridType;
  unitSize: number;
  unitSizeUnit: string;
  fullFow: boolean;
  fowOpacity: number;
  fowLos: boolean;
  visionMode: string;
  visionMinRange: number;
  visionMaxRange: number;
  spawnLocations: GlobalId[];
  movePlayerOnTokenChange: boolean;
  limitMovementDuringInitiative: boolean;
  dropRatio: number;
  ambientLight: boolean;
  airMapBackground: string;
  groundMapBackground: string;
  undergroundMapBackground: string;
}

export interface PlayerOptions {
  gridColour: string;
  fowColour: string;
  rulerColour: string;
  useToolIcons: boolean;
  showTokenDirections: boolean;
  defaultWallColour: string;
  defaultWindowColour: string;
  defaultClosedDoorColour: string;
  defaultOpenDoorColour: string;
  invertAlt: boolean;
  disableScrollToZoom: boolean;
  defaultTrackerMode: boolean;
  mousePanMode: number;
  useHighDpi: boolean;
  useAsPhysicalBoard: boolean;
  gridSize: number;
  miniSize: number;
  ppi: number;
  initiativeCameraLock: boolean;
  initiativeVisionLock: boolean;
  initiativeOpenOnActivate: boolean;
  renderAllFloors: boolean;
}

interface LocationSettingsSystem {
  // Whether line of sight is active in the current location
  isLosActive(): boolean;
}

// Trackers

interface TrackerSystem {
  // The trackers of the shape currently open in the shape settings
  state: DeepReadonly<Reactive<{ id: LocalId | undefined; trackers: UiTracker[] }>>;
  get(shape: LocalId, trackerId: TrackerId): DeepReadonly<Tracker> | undefined;
  getAll(shape: LocalId): DeepReadonly<Tracker[]>;
  add(shape: LocalId, tracker: Tracker, syncTo: Sync): void;
  update(shape: LocalId, trackerId: TrackerId, delta: Partial<Tracker>, syncTo: Sync): void;
  remove(shape: LocalId, trackerId: TrackerId, syncTo: Sync): void;
}

// UI

interface UiSystem {
  // Shows or hides the entire UI
  toggleUi(): void;
  showClientSettings(show: boolean): void;
  showDmSettings(show: boolean): void;
  // Text shown at the top of the screen, e.g. for shape annotations
  setAnnotationText(text: string): void;
}

// Variants

export interface ApiVariant {
  id: number;
  name: string | null;
  assetId: AssetId;
  assetHash: string;
  width: number;
  height: number;
}

interface VariantsSystem {
  // Leases the shape's variants into the reactive state until `dropState` is called with the same source
  loadState(shape: LocalId, source: string): void;
  dropState(shape: LocalId, source: string): void;
  get(shape: LocalId, variantId: number): ApiVariant | undefined;
  create(shape: LocalId, variant: Omit<ApiVariant, "id" | "assetHash">): void;
  update(shape: LocalId, variant: Partial<ApiVariant> & { id: number }, sync: boolean): void;
  remove(shape: LocalId, variantId: number, sync: boolean): void;
  // Switches the shape to the variant
  load(shape: LocalId, variantId: number): void;
}

export interface ModSystems {
  access: AccessSystem;
  asset: AssetSystem;
  assetGame: AssetGameSystem;
  auras: AuraSystem;
  characters: CharacterSystem;
  chat: ChatSystem;
  client: ClientSystem;
  compendium: CompendiumSystem;
  customData: CustomDataSystem;
  door: DoorSystem;
  floors: FloorSystem;
  game: GameSystem;
  groups: GroupSystem;
  locationSettings: LocationSettingsSystem;
  markers: MarkerSystem;
  notes: NoteSystem;
  players: PlayerSystem;
  position: PositionSystem;
  properties: PropertiesSystem;
  room: RoomSystem;
  selected: SelectedSystem;
  tp: TeleportZoneSystem;
  trackers: TrackerSystem;
  ui: UiSystem;
  variants: VariantsSystem;
}

export interface ModSystemsState {
  access: ReactiveState<{
    // The shape currently open in the shape settings
    id: LocalId | undefined;
    defaultAccess: AccessConfig;
    playerAccess: Map<string, AccessConfig>;
    // Shapes the current user has access to
    ownedTokens: Map<AccessLevel, Set<LocalId>>;
  }> &
    // Shapes with default access are not included
    NonReactiveState<{ access: Map<LocalId, Map<string | symbol, AccessConfig>> }>;
  asset: ReactiveState<{
    entryIdMap: Map<AssetEntryId, ApiAssetEntry>;
    assetIdMap: Map<AssetId, ApiAssetCore>;
  }>;
  assetGame: ReactiveState<{
    managerOpen: boolean;
    shortcuts: AssetEntryId[];
  }>;
  characters: ReactiveState<{
    activeCharacterId: CharacterId | undefined;
    characters: Map<CharacterId, ApiCharacter>;
  }>;
  chat: ReactiveState<{ messages: ChatMessage[] }>;
  client: ReactiveState<{
    clientIds: Map<ClientId, PlayerId>;
    clientViewports: Map<ClientId, Viewport>;
  }>;
  compendium: ReactiveState<{
    open: boolean;
    popover: { ref: string | null; x: number; y: number };
  }>;
  // Shapes with an active lease (see `loadAndDropState`) are kept in the reactive data,
  // all other shapes are only available in the non-reactive data.
  customData: ReactiveState<{ data: Map<LocalId, UiShapeCustomData[]> }> &
    NonReactiveState<{ data: Map<LocalId, UiShapeCustomData[]> }>;
  dice: ReactiveState<{
    dice3d: "off" | "on" | "box";
    shareResult: "all" | "dm" | "none";
  }>;
  floors: ReactiveState<{
    floors: Floor[];
    floorIndex: FloorIndex;
  }>;
  game: ReactiveState<{
    isConnected: boolean;
    boardInitialized: boolean;
    isDm: boolean;
    // A DM viewing the board as a player
    isFakePlayer: boolean;
    roomName: string;
    roomCreator: string;
    isLocked: boolean;
  }>;
  groups: NonReactiveState<{
    groups: Map<string, Group>;
    groupMembers: Map<string, Set<LocalId>>;
  }>;
  locationSettings: ReactiveState<
    { [K in keyof LocationOptions]: WithLocationDefault<LocationOptions[K]> } & {
      activeLocation: number;
    }
  >;
  markers: ReactiveState<{ markers: Set<LocalId> }>;
  notes: ReactiveState<{ notes: Map<NoteId, ClientNote> }>;
  playerSettings: ReactiveState<{ [K in keyof PlayerOptions]: WithDefault<PlayerOptions[K]> }>;
  players: ReactiveState<{ players: Map<PlayerId, PlayerInfo> }>;
  position: ReactiveState<{ zoomDisplay: number }> &
    NonReactiveState<{ zoom: number; panX: number; panY: number }>;
  // Shapes with an active lease (see `loadState`) are kept in the reactive data,
  // all other shapes are only available in the non-reactive data.
  properties: ReactiveState<{ data: Map<LocalId, ShapeProperties> }> &
    NonReactiveState<{ data: Map<LocalId, ShapeProperties> }>;
  room: ReactiveState<{ enableChat: boolean; enableDice: boolean }>;
  selected: ReactiveState<{
    focus: LocalId | undefined;
    selected: Set<LocalId>;
  }>;
  ui: ReactiveState<{
    showUi: boolean;
    annotationText: string;
    showClientSettings: boolean;
    showDmSettings: boolean;
  }>;
  // Shapes with an active lease (see `loadState`) are kept in the reactive data,
  // all other shapes are only available in the non-reactive data.
  variants: ReactiveState<{ data: Map<LocalId, ApiVariant[]> }> &
    NonReactiveState<{ data: Map<LocalId, ApiVariant[]> }>;
}
